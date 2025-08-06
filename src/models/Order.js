const mongoose=require('mongoose');
const {schema}=mongoose;
const {eventEmitter}=require('../utils/eventEmitter')

const OrderSchema=new mongoose.schema({
   orderNumber: {type:String,unique:true,index:true,required:true,
    default:function(){
   const date=new Date();
   return `ORD-${date.getFullYear()}${(date.getMonth()+1).padStart(2,'0')}${date.getDate().padStart(2,'0')}`
    }
   }, // indexed, unique
userId: {type:mongoose.schema.Types.ObjectId,ref:'User',required:true,index:true}, // indexed
items: [
{
productId: {type:mongoose.schema.Types.ObjectId,ref:'Product'},
quantity: {type:Number,required:true,min:1},
priceAtTime:  {type:Number,required:true,min:0},
discountApplied:  {type:Number,required:true,min:0},
totalPrice: {type:Number,required:true,min:0}

},
],
status: {type:String,enum:['pending','processing','shipped','delivered','cancelled'],default:'pending',index:true}, // enum: pending, processing, shipped, delivered, cancelled
paymentInfo: {
method: {type:String,enum:['credit-card','debit-card','bank-transfer'],required:true}, },
transactionId: {
    type:String,
    required:true
},
amount: {type:Number,
    required:true,
    min:0
},
 shippingAddresses:{
        addressLine1:{type:String,required:true},
        addressLine2:String,
        city:{type:String,required:true},
       
        state: {type:String,required:true},
        country: {type:String,required:true},
        postalCode:{type:String,required:true},
    
    
    geo:{
        type:{type:String, enum:['point'],default:'point',required:true},
            coordinates:{type:[Number],index:'2dsphere',required:true,
               
            },
        }
    },
timestamps: {
created: {type:Date,default:Date.now},
updated: Date,
shipped: Date,
delivered: Date,
cancelled:Date
},
analytics: {
processingTime: Number, // in minutes
customerSegment: {
    type:String,
    enum:['new','returning','frequent','vip']
}
},
totals:{
    subtotal:{
        type:Number,
        required:true,
        min:0
    },
    tax:{
        type:Number,
        required:true,
        min:0
    },
    shipping:{
        type:Number,
        required:true,
        min:0
    },
    discount:{
        type:Number,
        required:true,
        min:0
    },
    grandTotal:{
        type:Number,
        required:true,
        min:0
    }
}

},{versionKey:false})

OrderSchema.index({'items.productId':1});
OrderSchema.index({'shippingAddresses.gro.coordinates':'2dsphere'});
OrderSchema.pre('save',function(next){
    if(this.isModified('status')){
        this.timestamps.updated=new Date();
         if(this.status==='shipped' && !this.timestamps.shipped){
            this.timestamps.shipped=new Date();
             eventEmitter.emit('orderShipped',this)
         }
         else if(this.status==='delivered' && !this.timestamps.delivered){
            this.timestamps.delivered=new Date();
             eventEmitter.emit('orderDelivered',this)
         }
         else if(this.status==='cancelled' && !this.timestamps.cancelled){
            this.timestamps.cancelled=new Date();
             eventEmitter.emit('orderCancelled',this)
         }
    }
    next();

})
OrderSchema.statics.isValidStatusTransition=function(currentStatus,newStatus){
    const validTransitions={
        pending:['processing','cancelled'],
        processing:['shipped','cancelled'],
        shipped:['delivered','cancelled'],
        delivered:[],
        cancelled:[]

    }
    return validTransitions[currentStatus]?.includes(newStatus) || false
}

OrderSchema.methods.updateStatus=async function(newStatus){
    if(!this.constructor.isValidStatusTransition(this.status,newStatus)){
        throw new Error(`Invalid status transition from ${this.status} to ${newStatus} `)
    }
    this.status=newStatus
    await this.save();
    return this;
}
OrderSchema.virtual('processingDuration').get(function(){
    if(this.timestamps.delivered && this.timestamps.created){
        return (this.timestamps.delivered-this.timestamps.created)/(1000*60);
    }
    return null;
})

module.exports=mongoose.model('Order',OrderSchema)