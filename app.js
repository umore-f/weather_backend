const express = require('express')
const heFengRouter = require('./router/he_feng')
const getWeatherRouter = require('./router/index')
const cors = require('cors');

const app = express()
app.use(cors());
app.use(heFengRouter)
app.use(getWeatherRouter)
app.all('/*splat',(req,res)=>{
    res.send('<h1>404 Not Found</h1>')
})

app.listen(9000,()=>{
    console.log("天气系统服务器启动中......");
    // syncWeatherData() //启动服务器的时候立即执行一次,获取数据
})