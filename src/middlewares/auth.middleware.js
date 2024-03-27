import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { promiseHandler } from "../utils/promiseHandler.js";
import jwt from 'jsonwebtoken'   

export const verifyJwt = promiseHandler(async(req,_,next)=>{
    try {
        // console.log(req.cookies)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        if(!token){
           throw new ApiError(401,"Unauthorized request")
        }
    
        const decodeToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }

})