const express = require('express')
const router = express.Router()
const axios = require('axios');

router.get('/zx_now',async (req,res)=>{
    try{
        const { location } = req.query;
        const response = await axios.get(`https://api.seniverse.com/v3/weather/now.json?key=${process.env.zhixin_PRIVATE_KEY}&location=beijing`, {
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