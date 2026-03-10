const express = require('express')
const router = express.Router()
const axios = require('axios');
const {getValidToken} = require('../token.js')
// 城市查询
router.get('/hf_search_city',async (req,res)=>{
    try{
        const { location } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/geo/v2/city/lookup`, {
            params: { location },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取城市失败' });
    }
})
// 天气查询
// 实时天气查询
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
// 未来x天
router.get('/hf_3',async (req,res)=>{
    try{
        const { location } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/weather/3d`, {
            params: { location },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取未来3天天气数据失败' });
    }
})
router.get('/hf_7',async (req,res)=>{
    try{
        const { location } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/weather/7d`, {
            params: { location },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取未来3天天气数据失败' });
    }
})
router.get('/hf_10',async (req,res)=>{
    try{
        const { location } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/weather/10d`, {
            params: { location },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取未来3天天气数据失败' });
    }
})
router.get('/hf_15',async (req,res)=>{
    try{
        const { location } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/weather/15d`, {
            params: { location },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取未来3天天气数据失败' });
    }
})
router.get('/hf_30',async (req,res)=>{
    try{
        const { location } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/weather/30d`, {
            params: { location },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取未来3天天气数据失败' });
    }
})
// 未来x小时
router.get('/hf_24h',async (req,res)=>{
    try{
        const { location } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/weather/24h`, {
            params: { location },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取未来3天天气数据失败' });
    }
})
router.get('/hf_72h',async (req,res)=>{
    try{
        const { location } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/weather/72h`, {
            params: { location },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取未来3天天气数据失败' });
    }
})
router.get('/hf_168h',async (req,res)=>{
    try{
        const { location } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/weather/168h`, {
            params: { location },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取未来3天天气数据失败' });
    }
})
// 天气指数预报
router.get('/hf_indices3',async (req,res)=>{
    try{
        const { location,type } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/indices/3d`, {
            params: { location,type },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取未来3天天气数据失败' });
    }
})
router.get('/hf_indices7',async (req,res)=>{
    try{
        const { location,type } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/v7/indices/7d`, {
            params: { location,type },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取未来3天天气数据失败' });
    }
})
// 空气质量
router.get('/hf_airquality_now',async (req,res)=>{
    try{
        const { latitude, longitude } = req.query;
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/airquality/v1/current/${latitude}/${longitude}`, {
            // params: { latitude, longitude },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        res.json(response.data);
    } catch (error) {
        console.log("!!!!!!!!",req.query);
        console.error('和风天气API错误:', error.response?.data || error.message);
        res.status(500).json({ error: '获取实时空气质量失败' });
    }
})
module.exports = router