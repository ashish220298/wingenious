const express=require('express');
const cors=require('cors');
const helmet=require('helmet');
const morgan=require('morgan');
const compression=require('compression');
const rateLimit=require('express-rate-limit');
const path=require('path');
const mongoose=require('mongoose');
const {notFound,errorHandler}=require('./middleware/errorHandler');
const {connect}=require('./config/database');
const {logger}=require('./utils/logger');

const analyticsRoutes=require('./routes/analyticsroutes');
const orderRoutes=require('./routes/orderroutes');

const realtimeRoutes=require('./routes/realtimeroutes');

class App{
    constructor(){
        this.app=express();
        this.setupDatabase();
        this.setupMidlleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupDatabase(){
        connect().catch(err=>{
            logger.error('Database connection error',err);
            process.exit(1);
        })
    }
    setupMidlleware(){
        this.app.use(cors({
            origin:process.env.CORS_ORIGIN |'*',
            methods:['GET','POST','PUT','DELETE','OPTIONS'],
            allowedHeaders:['Content-Type','Authorization','X-Requested-With']
        }))
        this.app.use(morgan(process.env.NODE_ENV==='production'?'combined': 'dev',{
            stream:{write:message=>logger.info(message.trim())}}))
        
        const limiter=rateLimit({
            windowMS: 15*60*1000,
            max:100,
            standardHeaders:true,
            legacyHeaders:false
        })
        this.app.use(limiter);
        this.app.use(express.json({limit:'10kb'}));
        this.app.use(express.urlencoded({extended:true,limit:'10kb'}))

        this.app.use(compression());

        this.app.get('/health',(req,res)=>{
            res.status(200).json({
             status:'health',
             timestamp: new Date().toISOString(),
             uptime:process.uptime(),
             database:mongoose.connection.readyState===1?'connected':'disconnected'
            })
        })
    }
    setupRoutes(){
        this.app.use('/api/analytics',analyticsRoutes);
         this.app.use('/api/orders',orderRoutes);
          this.app.use('/api/realtime',realtimeRoutesRoutes);

          if(process.env.NODE_ENV==='production'){
                this.app.use(express.static(path.join(__dirname,'../../client/build')))
                this.app.get('*',(req,res)=>{
                    res.sendFile(path.resolve(__dirname,'../../client/build/index.html'))
                })
          }
    }

    setupErrorHandling(){
        this.app.use(notFound)
        this.app.use(errorHandler)
    }
    async start(port){
        const server=this.app.listen(port,()=>{
            logger.info(`server runnign in ${process.env.NODE_ENV} on port ${port}`)
        })
        require('./config/websocket').init(server);
        return server
    }
}
module.exports=new App()

