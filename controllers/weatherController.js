// 查询本地数据库
const express = require('express')
const router = express.Router()
const axios = require('axios');
const { Op, where } = require('sequelize');
const { City } = require('../models')
console.log('City:', City);
// 查找城市信息
async function getLatLon(cityName) {
const city = await City.findOne({    
    where: {
        name:cityName
    }}
);
if (!city) {
    return null; 
}
return {
    cityName: cityName,
    lat: city.lat,
    lon: city.lon,
    cityId: city.city_id,
}
}

module.exports = getLatLon