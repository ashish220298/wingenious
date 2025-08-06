const mongoose=require('mongoose');
const analyticsSchema=new mongoose.schema({
    type:String,
    data:mongoose.schema.Types.Mixed,
    createdAt:{type:Date,default:Date.now},
  

})


module.exports=mongoose.model('Analytics',analyticsSchema)