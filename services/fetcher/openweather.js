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
router.get('/op_hours',async (req,res)=>{
    try{
        const locationStr = req.query.location; // "116.405290,39.904990"
        if (!locationStr) {
        return res.status(400).json({ error: '缺少 location 参数' });
        }
        const [lon, lat] = locationStr.split(','); // 注意顺序：经度在前，纬度在后

        const response = await axios.get(`http://api.openweathermap.org/data/2.5/forecast`, {
            params: { 
                lat: lat.trim(),
                lon: lon.trim(),
                appid: process.env.OPEN_WEATHER_PRIVATE_KEY,
                lang: "zh_cn",
                units: "metric",
             },
            headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('openWeather天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取时天气失败' });
    }
})
module.exports = router