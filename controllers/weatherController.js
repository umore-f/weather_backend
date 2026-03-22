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
  dailyWeatherList.forEach((record, index) => {
    console.log(`记录 ${index + 1}:`, record.get({ plain: true }));
  });

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

/**
 * 获取某城市历史天气的统计平均值（用于拟合真实值）
 * @param {string} cityName
 * @returns {Promise<Object|null>} 返回平均值对象或 null
 */
async function getAvg(cityName) {
  const weatherList = await getHistoryWeather(cityName); 
  if (weatherList.length === 0) return null;

  // 提取各字段的有效数值（原始有效值）
  const extractValid = (field) => weatherList
    .filter(item => !isEmptyValue(item[field]))
    .map(item => Number(item[field]));

  const validTemp = extractValid('temp');
  const validTempMax = extractValid('tempMax');
  const validTempMin = extractValid('tempMin');
  const validHumidity = extractValid('humidity');
  const validPrecip = extractValid('precip');
  const validPressure = extractValid('pressure');

  // 异常值过滤
  const filteredTemp = filterOutliersByMaxDeviation(validTemp, 0.5);
  const filteredTempMax = filterOutliersByMaxDeviation(validTempMax, 0.5);
  const filteredTempMin = filterOutliersByMaxDeviation(validTempMin, 0.5);
  const filteredHumidity = filterOutliersByMaxDeviation(validHumidity, 0.5);
  const filteredPrecip = filterOutliersByMaxDeviation(validPrecip, 0.5);
  const filteredPressure = filterOutliersByMaxDeviation(validPressure, 0.5);

  const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;

  return {
    cityName,
    avgTemp: avg(filteredTemp),
    avgTempMax: avg(filteredTempMax),
    avgTempMin: avg(filteredTempMin),
    avgHumidity: avg(filteredHumidity),
    avgPrecip: avg(filteredPrecip),
    avgPressure: avg(filteredPressure),
    totalRecords: weatherList.length,
    validCounts: {
      temp: validTemp.length,
      tempMax: validTempMax.length,
      tempMin: validTempMin.length,
      humidity: validHumidity.length,
      precip: validPrecip.length,
      pressure: validPressure.length,
    },
    filteredCounts: {
      temp: filteredTemp.length,
      tempMax: filteredTempMax.length,
      tempMin: filteredTempMin.length,
      humidity: filteredHumidity.length,
      precip: filteredPrecip.length,
      pressure: filteredPressure.length,
    }
  };
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
        [Op.like]: '2026-3-22',
      },
    },
  });
  if (dailyWeatherList.length === 0) {
    console.log("未找到记录");
    return [];
  }
  dailyWeatherList.forEach((record, index) => {
    console.log(`记录 ${index + 1}:`, record.get({ plain: true }));
  });

  return dailyWeatherList.map((record) => ({
    cityName: record.city,
    tempMax: record.temp_max,
    tempMin: record.temp_min,
    temp: record.temp,
    humidity: record.humidity,
    precip: record.precip_total,
    pressure: record.pressure,
    source: record.source,
  }));
}
getNextWeather("北京");
// getHistoryWeather('北京')

module.exports = { getLatLon };
