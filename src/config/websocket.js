const socketIO=require('socket.io');
const {logger}=require('../utils/logger');
const socketAuth=require('../middleware/socketAuth');
let io;

const init=(server)=>{
    io=socketIO(server,{
        cors:{
            origin:process.env.CORS_ORIGINS.split(','),
            methods:['GET','POST']

        }
    })

    io.use(socketAuth);
    io.on('connection',(socket)=>{
        logger.info(`New client connected${socket.id}`)
        socket.on('joinUserRoom',(userId)=>{
            socket.join(`user_${userId}`);
        });
        socket.on('disconnect',()=>{
            logger.info('Client disconnected')
        })
    })

    return io
}


const getIO=()=>{
    if(!io) throw new Error('socket.io not initialised')
        return io
}

const emitToUser=(userId,event,data)=>{
    getIO().to(`user_${userId}`).emit(event,data);
}

module.exports={init,getIO,emitToUser}