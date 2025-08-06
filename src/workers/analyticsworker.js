const {parentPort,workerData}=require('worker_threads');
const AnalyticsService=require('../service/analyticsservice');

const logger=require('../utils/logger');
parentPort.postMessage({status:'ready'});
parentPort.on('message',async(message)=>{
    try{
        if(message.action==='start'){
            logger.info('starting analytics workers');
            let result;
            switch(message.data.task){
                case 'dailyReport':
                    result=await AnalyticsService.generateDailyReport();
                    break;
                case 'customerSegments':
                    result=await AnalyticsService.generateDailyReport();
                    break;
                case 'productTrends':
                    result=await AnalyticsService.generateDailyReport();
                    break;    

                    default: 
                    throw new Error('unkown task')
            }
            parentPort.postMessage({
                status:'completed',
                data:result,
                task:message.data.task
            })
        }

    }
    catch(error){
        logger.error('Analytics wroker error',error);
        parentPort.postMessage({
            status:'error',
            error:error.message,
            stack:error.stack
        })
    }
});
process.on('uncaughtException',(error)=>{
    logger.error('uncaught exception in worker:',error);
    process.exit(1);
})