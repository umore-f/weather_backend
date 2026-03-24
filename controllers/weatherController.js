// 查询本地数据库
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Op, where } = require("sequelize");
const { City, DailyWeather, HoursForecast } = require("../models");
const dayjs = require('dayjs');
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
    console.log("未找到记录!!!!!!");
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

// 接口

router.get('/current', async (req, res) => {
  try {
    // 1. 获取参数，设置默认值
    let { location, date, source } = req.query;
    
    // 默认 location
    if (!location) {
      location = '北京';
    }
    // 默认 source
    if (!source) {
      source = 'QWeather';
    }
    // 默认 date 为今天，并构造一天的查询范围
    let startTime, endTime;
    if (!date) {
      // 获取当前日期（不带时间），例如 '2025-01-01'
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      
      startTime = new Date(`${todayStr} 00:00:00`);
      endTime = new Date(`${todayStr} 23:59:59`);
    } else {
      // 用户传入了日期，格式应为 YYYY-MM-DD（或 YYYY-MM-DD HH:MM:SS）
      // 我们只取日期部分，构造当天的 00:00:00 到 23:59:59
      const dateStr = date.split(' ')[0]; // 去除可能的时间部分
      startTime = new Date(`${dateStr} 00:00:00`);
      endTime = new Date(`${dateStr} 23:59:59`);
    }
    
    // 2. 查询数据库
    const hoursList = await HoursForecast.findAll({
      where: {
        city: location,
        source: source,
        forecast_time: {
          [Op.between]: [startTime, endTime]  // 范围查询
        }
      },
      order: [['forecast_time', 'ASC']]       // 按时间排序
    });
    
    // 3. 返回结果
    res.json({
      code: 200,
      message: 'success',
      data: hoursList
    });
    
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
});
router.get('/days', async (req, res) => {
  try {
    let { location, date, source } = req.query;
    location = location || '北京';
    source = source || 'QWeather';

    let startDate, endDate;
    if (!date) {
      // 默认查询今天到未来5天
      startDate = dayjs().format('YYYY-MM-DD');
      endDate = dayjs().add(5, 'day').format('YYYY-MM-DD');
    } else {
      // 用户传入指定日期（格式 YYYY-MM-DD），只查当天
      const parsed = dayjs(date);
      if (!parsed.isValid()) {
        return res.status(400).json({ code: 400, message: '日期格式错误，请使用 YYYY-MM-DD' });
      }
      startDate = parsed.format('YYYY-MM-DD');
      endDate = startDate; // 同一天
    }

    const daysList = await DailyWeather.findAll({
      where: {
        city: location,
        source: source,
        forecast_time: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },
      order: [['forecast_time', 'ASC']]
    });

    res.json({ code: 200, message: 'success', data: daysList });
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});
module.exports = { getHistoryWeather, getNextWeather, router};
