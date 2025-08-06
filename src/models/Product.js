const mongoose=require('mongoose');
const { verbose } = require('nodemon/lib/config/defaults');
const {schema}=mongoose;
const ProductSchema=new mongoose.schema({
    name: {type:String,required:true},
    category:{type: String,required:true,index:true},
    subCategory:String,
    price:Number,
    inventory:{
        available:{
            type:Number,
            default:0,
            min:0
        }, 
        reserved:{
            type:Number,
             default:0,
            min:0
        }
    },
    price:{type:Number,required:true,min:0},
    
    description:{type:String,required:true},
    tags:[String],
    attributes:{
        weight:Number,
        dimensions:String,
        color:String,
        size:String
    },
    images:[String],
    salesCount:{type:Number,default:0},
    rating:{types:Number,min:0,max:5},
   
    createdAt:{type:Date,default:Date.now},
    updatedAt: Date
},{versionKey:false})

ProductSchema.index({name:'text',description:'text',tags:'text'})
ProductSchema.index({category:1,'inventory.available':1,salesCount:-1})
 ProductSchema.pre('save',function(next){
    this.updatedAt=new Date();
    next();
 })


module.exports=mongoose.model('Product',ProductSchema)