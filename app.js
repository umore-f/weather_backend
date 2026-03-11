const express = require('express')
const heFengRouter = require('./router/he_feng')
const syncWeatherData = require('./services/syncWeather')
const getWeatherRouter = require('./services/fetcher/index')
const cors = require('cors');
const cron = require('node-cron');
const app = express()
app.use(cors());
app.use(heFengRouter)
app.use(getWeatherRouter)
app.all('/*splat',(req,res)=>{
    res.send('<h1>404 Not Found</h1>')
})
// 计时循环任务 获取新数据
// cron.schedule('*/10 * * * *', () => {
//   syncWeatherData();
// });
app.listen(9000,()=>{
    console.log("天气系统服务器启动中......");
    // syncWeatherData() //启动服务器的时候立即执行一次,获取数据
})