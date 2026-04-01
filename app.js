const express = require('express')
const getWeatherRouter = require('./router/index')
const getDataRouter = require('./controllers/index')
const cors = require('cors');
const { startScheduler } = require('./cron/weatherCron')
const app = express()
app.use(cors());
app.use(getWeatherRouter)
app.use(getDataRouter)
app.all('/*splat',(req,res)=>{
    res.send('<h1>404 Not Found</h1>')
})
startScheduler();
app.listen(9000,()=>{
    console.log("天气系统服务器启动中......");
})