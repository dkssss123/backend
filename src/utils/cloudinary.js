import { v2 as cloudinary } from "cloudinary"
import fs from "fs"



    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    })  

    const uploadOnCloudinary = async (localfilePath) => {
        try {
            if (!localfilePath) return null
            // Upload file to Cloudinary
            const response = await cloudinary.uploader.upload(localfilePath, {
                resource_type: "auto",
            }) 
            // file has been uploaded successfully
            console.log("File uploaded on cloudinary successfully", response.url)
            return response 
        } catch (error) {
            console.log("Cloudinary upload error:", error.message)
            if (localfilePath && fs.existsSync(localfilePath)) {
                fs.unlinkSync(localfilePath) // remove the locally saved temporary file as the upload operation has failed
            }
            return null
        } 

    }
    export {uploadOnCloudinary}
