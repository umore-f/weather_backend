// 查询本地数据库
const express = require('express')
const router = express.Router()
const axios = require('axios');
const { Op } = require('sequelize');
const { CurrentWeather } = require('../models/current_weather')
// 查询实时天气数据
router.get('/currentWeather',async (req,res)=>{
    const { cityName } = req.query
    const currentWeather = await CurrentWeather.findByPk(id);
    if (currentWeather) {
        res.json(currentWeather)
    } else {
        const response = await axios.get(`http://127.0.0.1:9000/hf_search_city?location=${cityName}`, {
            timeout: 10000 // 设置10秒超时，防止请求卡死
        });
        if(response.data.code==200) {
            response.data.location[0].id
        }
    }
})
// 查询用户收藏的城市
router.get('/favoriteCity',async (req,res)=>{
    const { id } = req.query
    const favoriteCitys = await CurrentWeather.findByPk(id);
});
// 用户取消/点击收藏
router.get('/isFavorite',async (req,res)=>{
    const { id } = req.query
    const favoriteCitys = await CurrentWeather.findByPk(id);
})