const express = require('express')
const heFengRouter = require('./router/he_feng')
const cors = require('cors');
const app = express()
app.use(cors());
app.use(heFengRouter)
app.all('/*splat',(req,res)=>{
    res.send('<h1>404 Not Found</h1>')
})
app.listen(9000,()=>{
    console.log("天气系统服务器启动中......");
    
})