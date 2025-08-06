const redis=require('redis');
const logger=require('..utils/logger');

class RedisClient{
    constructor(){
        this.client=redis.createClient({
            url: process.env.REDIS_URL,
            socket:{
                reconnectStrategy:(retries)=>{
 if(retries>5){
    logger.error('Too many retries, connection is now terminated');
    return new Error('Too many retries');
 }
 return Math.min(retries*100,5000)
                }
            }
        });
        this.client.on('error',(err)=>logger.error('Redis error:',err));
        this.client.on('connect',(err)=>logger.info('Redis connected:',err));
        this.client.on('reconnecting',(err)=>logger.info('Redis connecting:',err));
        this.client.on('ready',(err)=>logger.info('Redis ready:',err));


    }

    async connect(){
        await this.client.connect();

    }
     async get(key){
        return this.client.get(key);

    }
     async set(key,value,options={}){
        return this.client.set(key,value,options);

    }
     async del(key){
        return this.client.del(key);

    }
     async quit(){
        return this.client.quit();



    }

}

module.exports=new RedisClient();
