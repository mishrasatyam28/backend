import {promiseHandler} from "../utils/promiseHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/clodinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";

const generateAccessAndRefreshToken = async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()


    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return {accessToken, refreshToken}

} catch (error) {
    throw new ApiError(500, "Something went wrong while generating referesh and access token")
}
}

const registerUser = promiseHandler(async (req, res) => {
  //get user details from frontend
  // validation - not empty
  //check if user already exists: username, email
  // check for images, check for avatar
  // create user object - create entry in db
  //remove password and refresh token field from response
  //check for user creation
  //return response

  // console.log(req.body);

  const {fullName, email, username, password} = req.body;
  
  // console.log("email: ", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{username}, {email}],
  });
  
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  
  // console.log(req.files);

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    coverImageLocalPath =req.files.coverImage[0].path
  }



  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required on cloud");
  }

  

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email, 
    password,
    username: username.toLowerCase()
})
 

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = promiseHandler(async(req,res)=>{
  // req.body -> data
  //useranme or email
  //find the user
  //password check
  //access and refresh token
  // send cookies
  // send response

  const {email,username,password} = req.body
  console.log(email)

  if(!email && !username){
    throw new ApiError(400,'username or email is required')
  }

  // if(!(email || username)){
  //   throw new ApiError(400,'username or email is required')
  // }



  const user = await User.findOne({
    $or:[{username},{email}]
  })

  if(!user){
    throw new ApiError(400,'User does not exist')
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
   throw new ApiError(401,"Invalid user Credentails")
  }

  // first created generateAccessAndRefreshToken then
  const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options ={
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken,options)
  .cookie('refreshToken',refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user:loggedInUser,accessToken,refreshToken
      },
      'User logged In Successfully!'
      )
  )
})

const logoutUser = promiseHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set:{
          refreshToken:undefined
        }
      },
      {
        new:true
      }
    )

    const options ={
      httpOnly:true,
      secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json(
      new ApiResponse(
        200,{},"User logged out"
      )
    )
})

const refreshAccessToken = promiseHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized request")
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id)
    
    if(!user){
      throw new ApiError(401,"Invalid Refresh Token user")
    }

    if(incomingRefreshToken!==user?.refreshToken)
    {
      throw new ApiError(401,"Refresh token is expired")
    }

    const {accessToken,newRefreshToken} = generateAccessAndRefreshToken(user._id)

    const options={
      httpOnly:true,
      secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken:newRefreshToken},
        "Access token refreshed!"
      )
    )

  } catch (error) {
    throw new ApiError(401,error?.message || "Somthing Invalid refresh token")
  }
})

export {registerUser,loginUser,logoutUser,refreshAccessToken};
