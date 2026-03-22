// 查询本地数据库
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Op, where } = require("sequelize");
const { City, DailyWeather } = require("../models");
const {
  isEmptyValue,
  filterOutliersByMaxDeviation,
  get_yesterday_formatted,
} = require("../utils/helpers");
// console.log("City:", City);

// 昨天的天气数据
async function getHistoryWeather(cityName) {
  const dateStr = get_yesterday_formatted();
  const dailyWeatherList = await DailyWeather.findAll({
    where: {
      city: cityName,
      type: 0,
      forecast_time: {
        [Op.like]: dateStr,
      },
    },
  });
  if (dailyWeatherList.length === 0) {
    console.log("未找到记录");
    return [];
  }
  // dailyWeatherList.forEach((record, index) => {
  //   console.log(`记录 ${index + 1}:`, record.get({ plain: true }));
  // });

  return dailyWeatherList.map((record) => ({
    cityName: record.city,
    tempMax: record.temp_max,
    tempMin: record.temp_min,
    temp: record.temp,
    humidity: record.humidity,
    precip: record.precip_total,
    pressure: record.pressure,
  }));
}




// 昨天预报数据
async function getNextWeather(cityName) {
  // const weatherAvg = await getAvg(cityName)
  const dateStr = get_yesterday_formatted();
  const dailyWeatherList = await DailyWeather.findAll({
    where: {
      city: cityName,
      type: 1,
      forecast_time: {
        [Op.like]: '2026-03-22',
      },
    },
  });
  if (dailyWeatherList.length === 0) {
    console.log("未找到记录");
    return [];
  }
  // dailyWeatherList.forEach((record, index) => {
  //   console.log(`记录 ${index + 1}:`, record.get({ plain: true }));
  // });

  return dailyWeatherList.map((record) => ({
    cityName: record.city,
    forecastTime: record.forecast_time,
    tempMax: Number(record.temp_max),
    tempMin: Number(record.temp_min),
    temp: Number(record.temp),
    humidity: Number(record.humidity),
    precip: Number(record.precip_total),
    pressure: Number(record.pressure),
    source: record.source,
  }));
}
// getNextWeather("北京");
// getHistoryWeather('北京')

module.exports = { getHistoryWeather, getNextWeather };
