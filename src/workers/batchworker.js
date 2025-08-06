const {parentPort,workerData}=require('worker_threads');
const Order=requ('../models/Order');
const {logger}=require('..utils/logger');
const { batch } = require('googleapis/build/src/apis/batch');
parentPort.postMessage({status:'ready'});
parentPort.on('message',async(message)=>{
    try{
        if(message.action=='start'){
            logger.info('batch worker processing');
            let processed=0;
            const batchSize=message.data.batchSize || 100;
            const c=Order.find(message.data.query);

            for(let doc=await c.next(); doc!=null; doc=await c.next()){
                await processDocument(doc,message.data.task);
                processed++
                if(processed%batchSize===0){
                    parentPort.postMessage({
                        status:'progress',
                        processed,
                        task:message.data.task
                    })
                }
            }
            parentPort.postMessage({
                status:'completed',
                processed,
                task:message.data.task
            })
        }
    }
    catch(error){
        logger.error('batch worker error');
        parentPort.postMessage({
            status:"error",
            error:error.message
        })
    }

})

async function processDocument(doc,task){
    switch (task){
        case 'updateOrderStatuses':
            doc.status='processed';
            await doc.save();
            break;
            case 'CalculateOrderMetrics':
                break;
                default:
                    throw new Error('unknown batch error/task')
    }
}

//processDicument function bnana h 