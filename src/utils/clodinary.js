import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env. CLOUDINARY_API_SECRET 
});


const uploadOncloudinary = async(localFilePath) =>{
    try {
        if(!localFilePath)return null

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        //file has been uploaded successfully
        console.log('File is uploaded on clodinary ',response.url)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally temporary file as the upload operation is faied.
        return null
    }
}

export {uploadOncloudinary}