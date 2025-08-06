const mongoose=require('mongoose');
const { MongoMemoryServer }=require('mongodb-memory-server');
const logger=require('..utils/logger');

let mongoServer;
const opts={
    useNewUrlParser:true,
    useUnifiedTopology:true,
    poolSize:10,
    serverSelectionTimeoutMS:5000,
    socketTimeoutMS:45000
}

async function connect(){
  if(process.env,NODE_ENV==='test'){
    mongoServer=await MongoMemoryServer.create();
    const mongoUri=mongoServer.getUri();
    await mongoose.connect(mongoUri,opts);

  }
  else{
    await mongoose.connect(process.env.MONGO_URI,opts);
  }

  mongoose.connection.on('error',(e)=>{
    logger.error('mongoDB connection error:',e)
    
  });

  mongoose.connection.once('open',()=>{
    logger.info('MongoDB connected')
  })
}


async function disconnect(){
    await mongoose.disconnect();
    if(mongoServer) await mongoServer.stop();

}

async function setupIndexes(){
    const models=require('../models');
    await promises.all(
        Object.values(models).map(model=> model.createIndexes())
    )
    logger.info('Database indexes created');
}

module.exports=[connect,disconnect,setupIndexes]