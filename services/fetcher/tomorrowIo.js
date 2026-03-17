const express = require('express')
const router = express.Router()
const axios = require('axios');
const renameFields = require('../../utils/helpers')

router.get('/ti_hours',async (req,res)=>{
    try{
        const { location } = req.query;
        const response = await axios.get(`https://api.tomorrow.io/v4/weather/forecast`, {
            params: { 
                location,
                apikey:process.env.TI_PRIVATE_KEY,
                timesteps: '1h'
             },
        });
        console.log("!!!!!!!!",req.query);
        res.json(renameFields(response.data));
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('VC天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取实时天气失败' });
    }
})
// 5天
router.get('/ti_days',async (req,res)=>{
    try{
        const { location } = req.query;
        const response = await axios.get(`https://api.tomorrow.io/v4/weather/forecast`, {
            params: { 
                location,
                apikey:process.env.TI_PRIVATE_KEY,
                timesteps: '1d'
             },
        });
        console.log("!!!!!!!!",req.query);
        res.json(renameFields(response.data));
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('VC天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取实时天气失败' });
    }
})
module.exports = router