const mongoose=require('mongoose');
const AuditLOgsSchema=new mongoose.schema({
    orderId:{type:mongoose.schema.Types.ObjectId,ref:'Order',index:true} ,
    status:String,
    changedAt:{type:Date,default:Date.now},
    changedBy:String

})


module.exports=mongoose.model('AuditLog',AuditLOgsSchema)