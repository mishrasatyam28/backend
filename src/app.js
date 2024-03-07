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

export {app}