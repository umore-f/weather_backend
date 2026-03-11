const express = require('express')
const router = express.Router()
const axios = require('axios');

router.get('/op_now',async (req,res)=>{
    try{
        const { location } = req.query;
        const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?lat=39.906217&lon=116.3912757&appid=${process.env.OPEN_WEATHER_PRIVATE_KEY}&lang=zh_cn&units=metric`, {
            params: { location },
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('知心天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取实时天气失败' });
    }
})

module.exports = router