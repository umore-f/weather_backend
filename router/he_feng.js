const express = require('express')
const router = express.Router()
const axios = require('axios');
const {getValidToken} = require('../token.js')

router.get('/hf_now',async (req,res)=>{
    try{
        const { location } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/weather/now`, {
            params: { location },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取实时天气失败' });
    }
})

module.exports = router