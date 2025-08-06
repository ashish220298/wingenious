const winston=require('winston');
const {format}=winston;
const path=require('path');
const DailyRotateFile=require('winston-daily-rotate-file');
 const consoleFormat=format.printf(({level,message,timestamp,stack})=>{
    let log=`${timestamp} [${level.toUpperCase()}] ${message}`
    if(Object.keys(meta).length>0){
        log+=`\nMetadata:${JSON.stringify(meta,null,2)}`
    }
    return stack? `${log}\nStacktrace:${stack}`:log;
 })

 const logger=winston.createLogger({
    level:process.env.NODE_ENV==='production'?'info':'debug',
    format:format.combine(
        format.timestamp({format:'YYYY-MM-DD HH:mm:ss'}),
        format.errors({stack:true}),
        format.json()
    ),
    transports:[
        new winston.transports.Console({
            format:format.combine(
                format.colorize(),
                consoleFormat
            ),
            silent:process.env.NODE_ENV==='test'
        }),

        new DailyRotateFile({
            filename:path.join(process.cwd(),'logs','application-%DATE%.log'),
        datePattern:'YYYY-MM-DD',
        zippedArchive:true,
        maxSize:'20m',
        maxFiles:'14d',
        format:fileFormat


        }),
         new DailyRotateFile({
            level:'error',
            filename:path.join(process.cwd(),'logs','error-%DATE%.log'),
        datePattern:'YYYY-MM-DD',
        zippedArchive:true,
        maxSize:'20m',
        maxFiles:'30d',
        format:fileFormat


        }),
        

    
    
    ],

    exxceptionHandlers:[
        new winston.transports.File({
            filename:path.join(process.cwd(),'logs','exceptions.log')
        })
    ],
    rejectionHandlers:[
                new winston.transports.File({
            filename:path.join(process.cwd(),'logs','rejections.log')
        })
    ]
 });

 if(process.nv.NODE_ENV==='production'&& process.env.MONGO_URI){
require('winston-mongodb');
logger.add(new winston.transports,MongoDB({
    level:'error',
    db:process.env.MONGO_URI,
    options:{useUnifiedTopology:true},
    collection:'server-logs',
    cappedSize
:10000000,
format:format.combine(
    format.timestamp(),
    format.errors({stack:true}),
    format.metadata()
)}))
 }
 logger.apiLogger=(req,res,next)=>{
    const start=Date.now();
    res.on('finish',()=>{
        const duration=Date.now()-start;
        logger.info(`${req.method} ${req.originalUrl}`,{
            status:res.statusCode,
            duration:`${duration}ms`,
            ip:req.ip,
            user:req.user?._id,
            params:req.params,
            query:req.query
        })
    })
    next()
 }

 logger.dblogger=(operation, collection,query,duration)=>{
    logger.debug(`db${operation}on${collection}`,{
        query,duration:`${duration}ms`
    })
 }

 logger.socketLogger=(evetn,payload)=>{
    logger.verbose(`Socket evetn:${event}`,{
        payload
    })
 }

 module.exports=logger;