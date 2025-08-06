const jwt=require('jsonwebtoken');
const {logger}=require('../utils/logger');
const {User}=require('../models');

const authenticate=async(req,res,next)=>{
    try{
        const token=req.header('Authorization')?.replace('Bearer ','');
        if(!token){
            throw new Error('Authentication required');

        }
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const user=await User.findById(decoded.userId)
            if(!user){
                throw new Error('User not found')
            }
            req.user=user;
            req.token=token;
            next();
        
    }
    catch(error){
        logger.error('Authentication failed',error.message)
        res.status(401).json({
            success:false,
            message:'please authenicate'
        })
    }
}

const authorize=(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            logger.warn('Unauthorised access')
            return res.status(403).json({
                success:false,
                message:'Access forbidden'
            })
        }
        next();
    }
}

module.exports={authenticate,authorize}