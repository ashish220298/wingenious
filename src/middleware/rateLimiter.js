const rateLimit=require('express-rate-limit');
const logger=require('../utils/logger');
const apiLimiter=rateLimit({
    windowMs: 15*60*1000,
    max:100,
    hamdler:(req,res)=>{
        logger.warn('Rate limit exceeded');
        res.status(429).json({
            success:false,
            message:'Too many request'
        })
    },
    standardHeaders:true,
    legacyHeaders:false
})

const authLimiter=rateLimit({
    windowMs:60*60*1000,
    max:10,
    skip:req=>req.method==='OPTIONS'
})

module.exports={apiLimiter,authLimiter}