// 查询本地数据库
const express = require('express')
const router = express.Router()
const axios = require('axios');
const { Op, where } = require('sequelize');
const { CurrentWeather } = require('../models/current_weather')
const { City } = require('../models')
console.log('City:', City);
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
    lon: city.lon
}
}
module.exports = getLatLon