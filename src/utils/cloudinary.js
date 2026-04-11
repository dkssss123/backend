import { v2 as cloudinary } from "cloudinary"
import fs from "fs"



    // Configuration
    cloudinary.config({ 
        cloud_name: '', 
        api_key: '', 
        api_secret: '' // Click 'View API Keys' above to copy your API secret
    }) 