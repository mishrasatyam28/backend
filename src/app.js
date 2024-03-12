import express, { json } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

// data from form
app.use(json({limit:"16kb"}))

// data from url
app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))

// all data store on server's public folder
app.use(express.static("public"))

// CRUD operation from server to browser
app.use(cookieParser())


 
// routes import
import userRouter from './routes/user.routes.js';

// routes declaration
app.use("/api/v1/users",userRouter)

//http://localhost:8000/api/v1/users/register

export {app}