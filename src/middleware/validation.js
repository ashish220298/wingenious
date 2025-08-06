const Joi=require('joi');
const {createError}=require('../utils/errorHandler');
const orderSchema=Joi.object({
    items:Joi.array.items(
        Joi.object({
            productId:Joi.string().hex().length(24).required(),
             quantity:Joi.number().integer().min(1).required()
        })).min(1).required(),
        shippingAddress:Joi.object({
            addressLine1:Joi.string().required(),
            city:Joi.string().required(),
            country:Joi.string().required()            
  }).required()
    
})

const validateOrder=(req,res,next)=>{
    const {error}=orderSchema.validate(req.body,{abortEarly:false})
    if(error){
        const errors=error.details.map(detail=>({
            field:detail.path.join('.'),
            message:detail.message
        }));
        throw createError(400,'validateion failed', {errors})
    }
    next()
}

module.exports={validateOrder};