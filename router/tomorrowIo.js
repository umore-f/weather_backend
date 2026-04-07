const express = require('express')
const router = express.Router()
const axios = require('axios');

router.get('/ti_next_hours_days',async (req,res)=>{
    try{
        const { location } = req.query;
        const response = await axios.get(`https://api.tomorrow.io/v4/weather/forecast`, {
            params: { 
                location,
                apikey:process.env.TI_PRIVATE_KEY,
                timesteps: '1h,1d',
                timezone: 'Asia/Shanghai'
             },
        });
        res.json(response.data);
    } catch (error) {
        console.error('VC天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取实时天气失败' });
    }
})
router.get('/ti_last_hours_days',async (req,res)=>{
    try{
        const { location } = req.query;
        const response = await axios.get(`https://api.tomorrow.io/v4/weather/history/recent`, {
            params: { 
                location,
                apikey:process.env.TI_PRIVATE_KEY,
                timesteps: '1d',
                timezone: 'Asia/Shanghai'
             },
        });
        res.json(response.data);
    } catch (error) {
        console.error('TI天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取实时天气失败' });
    }
})
module.exports = router