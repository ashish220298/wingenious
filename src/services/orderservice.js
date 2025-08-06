const Order=require('./models/Order');
const Product=require('./models/Product');

const {eventEmitter}=require('..utils/eventEmitter');
const {cache}=require('./cacheservice');
const {logger}=require('./logger');

class OrderService {
    async createOrder(orderData){
        const session =await Order.startSession();
        session.startTransaction();
        try{
            await this.validateAndReserveInventory(orderData.items,session);
            const order=new Order({
                ...orderData,
                orderNumber:this.generateOrderNumber(),
                status:'pending',
                paymentStatus:'pending'
            })

            await order.save({session})
            await this .updateProductSales(order.items,session);
            await session.commitTransaction();
            session.endSession();
            eventEmitter.emit('orderCreated',order);
            await cache.del('analytics:*')
            return order
        }
          catch(error){
         await session.abortTransaction();
         session.endSession();
         logger.error('order creation failed');
         throw error
    }
    }

    async validateAndReserveInventory(items,session){
        for(const item of items){
            const product=await Product.findById(item.productId)
            if(!product || product.inventory.available<item.quantity){
                throw new Error('Insifficient inventory')
            }
            product.inventory.available-=item.quantity;
            product.inventory.reserved+=item.quantity;
            await product.save({session});

        }
    }

    async updateProductSales(items,session){
        const bulkOps=items.map(item=>({
            updateOne:{
             filter:{_id:item.productId},
             update:{
                $inc:{salesCount:item.quantity},
                $set:{updatedAt: new Date()}
             }
            }
        }))
        await Product.bulkWrite(bulkOps,{session})
    }
    async updateOrderStatus(orderId,newStatus){
        const order=await Order.findById(orderId);
        if(!order) throw new Error('order not found')
            const validTransitions={
        pending:['processing','cancelled'],
        processing:['shipped','cancelled'],
        shipped:['delivered','returned'],
        delivered:['returned'],
        cancelled:[],
        returned:[],


    }

    if(!validTransitions[order.status].includes(newStatus)){
        throw new Error('Invalid status transistin ')
    }
    order.status=newStatus;
    await order.save();
    eventEmitter.emit('orderStatusChanged',{orderId,newStatus});
    await cache.del('analytics:*')
    return order
    }
    generateOrderNumber(){
        const date=new Date();
           return `ORD-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-&${Math.floor(1000+Math.random()*9000)}`


    }
    async getOrdersPaginated({page=1,limit=10,filters={},sort='-createdAt'}){
        const query=Order.find(filters)
        .sort(sort)
        .skip((page-1)*limit)
        .limit(limit)
        .populate('userId','name email')

        const countQuery=Order.countDocuments(filters);
        const [orders,total]=await Promise.all([query.exec(),countQuery.exec()]);
        return {
            data:orders,
            pagination:{
                page,
                limit,
                total,
                pages:Math.ceil(total/limit)
            }
        }

    }



  
}

module.exports=new OrderService();

