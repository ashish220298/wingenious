const mongoose=require('mongoose');
const {schema}=mongoose;
const bcrypt=require('bcryptjs');
const { required } = require('nodemon/lib/config');

const userSchema=new mongoose.schema({
    name: {type:String,required:true} ,
    email:{type: String,required:true,unique:true},
    password:{type:String,required:true,select:false},
    role:{
        type:String,
        enum:['customer','admin','manager'],
        default:'customer'
    },
    segments:{
        purchaseFrequency:{type:String,enum:['high','medium','low']},
        averageOrderValue:{type:String,enum:['high','medium','low']},
        purchaseFrequency:Date
    },

    shippingAddresses:{
        addressLine1:String,
        addressLine2:String,
        city:String,
        city:String,
        state: String,
        country: String,
        postalCode:String,
    },
    location:{
        type:{type:String, default:'point',
            coordinates:[Number],
        }
    },
    isDefault:Boolean,
    createdAt:{type:Date,default:Date.now},
    updatedAt:Date
},{versionKey:false})
userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password=await bcrypt.hash(this.password,10);
    }
    this.updatedAt=new Date();
    next()
})
 userSchema.methods.comparePassword=async function (candidatePassword){
    return bcrypt.compare(candidatePassword,this.passoword)
 }

 userSchema.indexx({email:1})
 userSchema.index({'shippingAddresses.location':'2dsphere'})
module.exports=mongoose.model('User',userSchema)