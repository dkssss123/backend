import {asyncHandler} from '../utils/asyncHandler.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/apiError.js';
import jwt from 'jsonwebtoken';
import { Subscription } from '../models/subscription.model.js';
import mongoose from 'mongoose';


const generateAccessAndRefreshToken = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
         
        user.refreshToken = refreshToken
         await user.save({
            validateBeforeSave: false
         })
         return {accessToken, refreshToken}

    }catch(error){
        console.error("Token generation error:", error)
        throw new ApiError(500, "Failed to generate access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
   const {fullName, email, username, password} = req.body || {};
   console.log("email", email);

   if(
    [fullName, email, username, password].some((field) => !field || field.trim() === "")
   )
   {
    throw new ApiError(400, "All fields are required");
   }
    const existedUser = await User.findOne({
        $or: [{ email },{ username }]

    });
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists");
    }
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("req.files:", JSON.stringify(req.files, null, 2));
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    console.log("avatarLocalPath:", avatarLocalPath);
    if(!avatarLocalPath){
        console.log("File fields received:", req.files ? Object.keys(req.files) : "none (req.files is empty)");
        throw new ApiError(400, "Avatar image is required");
    }
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;
        if(!avatar)
            throw new ApiError(400, "Failed to upload avatar image");

         const user = await User.create({
            fullName: fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
            })
            const createdUser = await User.findById(user._id).select("-password -refreshToken");
            if(!createdUser){
                throw new ApiError(500, "Failed to create user");
            }
        return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
})

const loginUser = asyncHandler(async (req, res) => {
    const{email,username,password} = req.body
    if(!(username || email)){
        throw new ApiError(400, "Username or email is required")
    }
    if(!password){
        throw new ApiError(400, "Password is required")
    }
    const user = await User.findOne({
        $or: [
            {email},
            {username}
        ]
    })
    if(!user){
        throw new ApiError(404, "User not found with the provided email or username")
    }
    const isPasswordCorrect = await user.isPasswordCorrect(password)
    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid password")
    }
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

        const options = {
            httpOnly: true,
            secure: true
        }
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200,
             {user: loggedInUser, accessToken, refreshToken},
              "User logged in successfully"
        ))
})

const logoutUser = asyncHandler(async(req, res) => { 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshAccessToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized, refresh token is required")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
          const user=  await User.findById(decodedToken._id)
          if(!user){
              throw new ApiError(401, "Invalid refresh token")
          }
    
          if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, " refresh token expires, please login again")
          }
    
          const options = {
            httpOnly: true,
            secure: true
        }
      const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200, 
            {accessToken, refreshToken}, "Access token refreshed successfully"
        ) )  
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")

        
    }   
}) 
const changeCurentPassword = asyncHandler(async(req, res) =>{
    const {oldPassword, newPassword}= req.body
   const user=await User.findById(req.user?._id)
   isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
     throw new ApiError(401, "Old password is incorrect")
    }
    user.password = newPassword 
     await user.save({validateBeforeSave: false})
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})
const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user retrieved successfully"))
})
const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body
    if (!fullName && !email) {
        throw new ApiError(400, "At least one field (fullName or email) is required to update")
    }
    const user= User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email:email
                
            },
        },
            {new: true}
        ).select("-password")
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})
    const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.files?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400, "Failed to upload avatar image")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")
     return res
    .status(200)
    .json(
        new ApiResponse(200,user,"AvatarUpdateSuccessfully")
    )
})
    const updateUserCoverImage = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.files?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage image is required")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400, "Failed to upload coverImage image")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"CoverImageUpdateSuccessfully")
    )
})
    const getUserChannelProfile = asyncHandler(async(req, res) => {
    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }
    const channel = await user.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from: "Subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"

            }

        },
        {
            $lookup:{
                 from: "Subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addField:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $count:{
                        if:{$in:[req.user?._id,"subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1



            }
        }
    ])
})

if(!channel?.length){
    throw new ApiError(404,"channel does not exist")
}

return res
.status(200)
.json(  
    new ApiResponse(200,channel[0],"user channel fatched successfully")
)

    const getWatchHistory = asyncHandler(async(req, res)=>{
        const user= await User.aggregate([
            {
                $match: {
                    _id= new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup:{
                    from: "videos",
                    localField: "wathchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline:[
                        {
                            $lookup:{
                                from: "users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner",
                                pipeline: [
                                    {
                                        $project:{
                                            fullName:1,
                                            username:1,
                                            avatar:1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first:"$owner"
                                }
                            }
                        }
                    ]
                        
                        
                        
                    
                }
            }
        ])

    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].getWatchHistory,
            "watchhistory fatched successfully"
        )
    )
    
export {registerUser, loginUser, logoutUser, refreshAccessToken, 
    changeCurentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar,
     updateUserCoverImage, getUserChannelProfile, getWatchHistory }
   