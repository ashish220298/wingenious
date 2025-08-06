const redis=require('../config/redis');
const { logger }=require('../utils/logger');
class cacheservice{
    constructor(){
        this.client=redis;
    }
    async get(key){
        try{
        const data=await this.client.get(key);
        return data? JSON.parse(data): null
        }
        catch(error){
            logger.error('cache get error',error);
            return null
        }

    }
    async set(key,value,ttl=3600){
        try{
            await this.client.set(key,JSON.stringify(value),{EX:ttl})
        }
        catch(error){
            logger.error('cache set erro',error)
        }
    }
     async del(key){
        try{
            await this.client.del(key);

        }
        catch(error){
            logger.error('cache delete error',error);
        }
     }
     async delPattern(pattern){
        try{
            const keys=await this.client.keys(pattern);
            if(keys.length>0){
                await this.client.del(keys);

            }
        }
        catch(error){
            logger.error('caceh pattern delete error',error)
        }
     }

}

module.exports=new cacheservice();