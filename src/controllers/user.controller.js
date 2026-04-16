import {asyncHandler} from '../utils/asyncHandler.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/apiError.js';

     

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
    console.log("req.files", req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is required");
    }
        const avatar = await uploadOnCloudinary(avatarLocalPath)
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if(!avatar)
            throw new ApiError(400, "Failed to upload avatar image");
        if(!coverImage)
            throw new ApiError(400, "Failed to upload cover image");

         const user =await User.create({
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
export {registerUser}
