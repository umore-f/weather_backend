// 查询本地数据库
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Op, where } = require("sequelize");
const { City, DailyWeather } = require("../models");
const { isEmptyValue, filterOutliersByMaxDeviation } = require('../utils/helpers')
console.log("City:", City);
// 查找城市信息
async function getLatLon(cityName) {
  const city = await City.findOne({
    where: {
      name: cityName,
    },
  });
  if (!city) {
    return null;
  }
  return {
    cityName: cityName,
    lat: city.lat,
    lon: city.lon,
    cityId: city.city_id,
  };
}
// 昨天的天气数据
async function getHistoryWeather(cityName) {
  const dailyWeatherList = await DailyWeather.findAll({
    where: {
      city: cityName,
      type: 0,
    },
  });
  if (dailyWeatherList.length === 0) {
    console.log('未找到记录');
    return [];
  }
    dailyWeatherList.forEach((record, index) => {
    console.log(`记录 ${index + 1}:`, record.get({ plain: true }));
  });

return dailyWeatherList.map(record => ({
    cityName: record.city,
    tempMax: record.temp_max,
    tempMin: record.temp_min,
    humidity: record.humidity,
    precip: record.precip_total,
    pressure: record.pressure,
  }));
}
// 明天的天气数据
async function getHistoryWeather(cityName) {
  const dailyWeatherList = await DailyWeather.findAll({
    where: {
      city: cityName,
      type: 1,
      forecast_time:{
        [Op.like]: ''
      }
    },
  });
  if (dailyWeatherList.length === 0) {
    console.log('未找到记录');
    return [];
  }
    dailyWeatherList.forEach((record, index) => {
    console.log(`记录 ${index + 1}:`, record.get({ plain: true }));
  });

return dailyWeatherList.map(record => ({
    cityName: record.city,
    tempMax: record.temp_max,
    tempMin: record.temp_min,
    humidity: record.humidity,
    precip: record.precip_total,
    pressure: record.pressure,
  }));
}
// 获取历史拟合数据
async function getAvg(cityName) {
  const weatherList = await getHistoryWeather(cityName);
  if (weatherList.length === 0) return null;

  // 提取各字段的有效数值（原始有效值，未过滤）
  const validTempMaxRaw = weatherList
    .filter(item => !isEmptyValue(item.tempMax))
    .map(item => Number(item.tempMax));
  const validTempMinRaw = weatherList
    .filter(item => !isEmptyValue(item.tempMin))
    .map(item => Number(item.tempMin));
  const validHumidityRaw = weatherList
    .filter(item => !isEmptyValue(item.humidity))
    .map(item => Number(item.humidity));
  const validPrecipRaw = weatherList
    .filter(item => !isEmptyValue(item.precip))
    .map(item => Number(item.precip));
  const validPressureRaw = weatherList
    .filter(item => !isEmptyValue(item.pressure))
    .map(item => Number(item.pressure));

  // 异常值过滤（剔除偏差过大的值）
  const filteredTempMax = filterOutliersByMaxDeviation(validTempMaxRaw, 0.5);
  const filteredTempMin = filterOutliersByMaxDeviation(validTempMinRaw, 0.5);
  const filteredHumidity = filterOutliersByMaxDeviation(validHumidityRaw, 0.5);
  const filteredPrecip = filterOutliersByMaxDeviation(validPrecipRaw, 0.5);
  const filteredPressure = filterOutliersByMaxDeviation(validPressureRaw, 0.5);

  // 计算平均值（若过滤后数组为空，则返回 null）
  const avgTempMax = filteredTempMax.length
    ? filteredTempMax.reduce((sum, v) => sum + v, 0) / filteredTempMax.length
    : null;
  const avgTempMin = filteredTempMin.length
    ? filteredTempMin.reduce((sum, v) => sum + v, 0) / filteredTempMin.length
    : null;
  const avgHumidity = filteredHumidity.length
    ? filteredHumidity.reduce((sum, v) => sum + v, 0) / filteredHumidity.length
    : null;
  const avgPrecip = filteredPrecip.length
    ? filteredPrecip.reduce((sum, v) => sum + v, 0) / filteredPrecip.length
    : null;
  const avgPressure = filteredPressure.length
    ? filteredPressure.reduce((sum, v) => sum + v, 0) / filteredPressure.length
    : null;

  return {
    cityName,
    avgTempMax: avgTempMax !== null ? Number(avgTempMax.toFixed(2)) : null,
    avgTempMin: avgTempMin !== null ? Number(avgTempMin.toFixed(2)) : null,
    avgHumidity: avgHumidity !== null ? Number(avgHumidity.toFixed(2)) : null,
    avgPrecip: avgPrecip !== null ? Number(avgPrecip.toFixed(2)) : null,
    avgPressure: avgPressure !== null ? Number(avgPressure.toFixed(2)) : null,
    totalRecords: weatherList.length,
    validCounts: {
      tempMax: validTempMaxRaw.length,
      tempMin: validTempMinRaw.length,
      humidity: validHumidityRaw.length,
      precip: validPrecipRaw.length,
      pressure: validPressureRaw.length,
    },
    filteredCounts: {
      tempMax: filteredTempMax.length,
      tempMin: filteredTempMin.length,
      humidity: filteredHumidity.length,
      precip: filteredPrecip.length,
      pressure: filteredPressure.length,
    },
  };
}
module.exports = { getLatLon, getAvg};
