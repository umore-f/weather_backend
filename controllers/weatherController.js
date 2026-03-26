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
    // 1. 解析参数，支持复数
    let { location, date, source } = req.query;

    // 解析 location 为数组，默认 ['北京']
    let locations = location
      ? location.split(',').map(s => s.trim()).filter(Boolean)
      : ['北京'];

    // 解析 source 为数组，默认 ['QWeather']
    let sources = source
      ? source.split(',').map(s => s.trim()).filter(Boolean)
      : ['QWeather'];

    // 日期范围逻辑不变
    let startTime, endTime;
    if (!date) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;
      startTime = new Date(`${todayStr} 00:00:00`);
      endTime = new Date(`${todayStr} 23:59:59`);
    } else {
      const dateStr = date.split(' ')[0];
      startTime = new Date(`${dateStr} 00:00:00`);
      endTime = new Date(`${dateStr} 23:59:59`);
    }

    // 2. 查询数据库，使用 IN 条件
    const hoursList = await HoursForecast.findAll({
      where: {
        city: { [Op.in]: locations },
        source: { [Op.in]: sources },
        forecast_time: { [Op.between]: [startTime, endTime] }
      },
      order: [['forecast_time', 'ASC']]
    });

    res.json({ code: 200, message: 'success', data: hoursList });
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

router.get('/days', async (req, res) => {
  try {
    let { date, source } = req.query;
    
    // ---------- 兼容多种 location 传参方式 ----------
    let locations = [];

    // 1. 尝试 location 字符串（逗号分隔）
    if (req.query.location) {
      if (typeof req.query.location === 'string') {
        locations = req.query.location.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(req.query.location)) {
        locations = req.query.location.map(s => s.trim()).filter(Boolean);
      }
    }
    // 2. 尝试 location[] 数组（axios 传数组时自动生成）
    if (!locations.length && req.query['location[]']) {
      const arr = req.query['location[]'];
      if (typeof arr === 'string') locations = [arr];
      else if (Array.isArray(arr)) locations = arr;
      locations = locations.map(s => s.trim()).filter(Boolean);
    }
    // 3. 默认
    if (!locations.length) locations = ['北京'];

    // ---------- 处理 source 同理（可选） ----------
    let sources = [];
    if (req.query.source) {
      if (typeof req.query.source === 'string') {
        sources = req.query.source.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(req.query.source)) {
        sources = req.query.source.map(s => s.trim()).filter(Boolean);
      }
    }
    if (!sources.length && req.query['source[]']) {
      const arr = req.query['source[]'];
      if (typeof arr === 'string') sources = [arr];
      else if (Array.isArray(arr)) sources = arr;
      sources = sources.map(s => s.trim()).filter(Boolean);
    }
    if (!sources.length) sources = ['QWeather'];

    // ---------- 日期处理 ----------
    let startDate, endDate;
    if (!date) {
      startDate = dayjs().format('YYYY-MM-DD');
      endDate = dayjs().add(5, 'day').format('YYYY-MM-DD');
    } else {
      const parsed = dayjs(date);
      if (!parsed.isValid()) {
        return res.status(400).json({ code: 400, message: '日期格式错误，请使用 YYYY-MM-DD' });
      }
      startDate = parsed.format('YYYY-MM-DD');
      endDate = startDate;
    }

    // ---------- 查询数据库 ----------
    const daysList = await DailyWeather.findAll({
      where: {
        city: { [Op.in]: locations },
        source: { [Op.in]: sources },
        forecast_time: { [Op.gte]: startDate, [Op.lte]: endDate }
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
