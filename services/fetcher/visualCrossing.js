const express = require('express')
const router = express.Router()
const axios = require('axios');
const renameFields = require('../../utils/helpers')
router.get('/op_now',async (req,res)=>{
    try{
        const { location } = req.query;
        const response = await axios.get(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/39.9,116.3/today?key=${process.env.VC_PRIVATE_KEY}&lang=zh_cn&unitGroup=metric&include=current`, {
            params: { location },
        });
        res.json(renameFields(response.data));
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('VC天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取实时天气失败' });
    }
})
router.get('/vc_hours',async (req,res)=>{
    try{
        const locationStr = req.query.location; // "116.405290,39.904990"
        if (!locationStr) {
        return res.status(400).json({ error: '缺少 location 参数' });
        }
        const [lon, lat] = locationStr.split(','); // "116.405290,39.904990"
        const response = await axios.get(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/next7days`, {
            params: { 
                key: process.env.VC_PRIVATE_KEY,
                lang: "zh_cn",
                unitGroup: "metric",
                include: "hours",
             },
        });
        res.json(renameFields(response.data));
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('VC天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取时天气失败' });
    }
})
router.get('/vc_days',async (req,res)=>{
    try{
        const locationStr = req.query.location; // "116.405290,39.904990"
        if (!locationStr) {
        return res.status(400).json({ error: '缺少 location 参数' });
        }
        const [lon, lat] = locationStr.split(','); // "116.405290,39.904990"
        const response = await axios.get(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/next7days`, {
            params: { 
                key: process.env.VC_PRIVATE_KEY,
                lang: "zh_cn",
                unitGroup: "metric",
                include: "days",
             },
        });
        res.json(renameFields(response.data));
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('VC天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取时天气失败' });
    }
})
module.exports = router