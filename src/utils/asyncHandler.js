
// const asyncHandler = () ={} 
// const asyncHandler = () ={()=>{}}
// const asyncHandler = () ={async()=>{}}
// const asyncHandler = () =async()=>{}

const asyncHandler = (fn) => async(req,res,next)=>{
    try {
        await fn(req,res,next)
    } catch (error) {
        res.send(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
}

export {asyncHandler}