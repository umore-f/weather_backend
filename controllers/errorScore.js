const { Op, where } = require("sequelize");
const express = require("express");
const { DailyError, TrustScore } = require("../models");
const { get_yesterday_formatted } = require("../utils/helpers");
const router = express.Router();
const dayjs = require('dayjs');
// 查找字段误差
async function getError(cityName, source) {
  const dateStr = get_yesterday_formatted();
  const DailyErrorList = await DailyError.findAll({
    where: {
      city: cityName,
      source: source,
      target_date: {
        [Op.like]: dateStr,
      },
    },
  });
  if (DailyErrorList.length === 0) {
    console.log("未找到记录");
    return [];
  }
  return DailyErrorList.map((record) => ({
    cityName: record.city,
    source: record.source,
    targetDate: record.target_date,
    errorType: record.error_type,
    errorValue: record.error_value,
  }));
}
async function getAllError(cityName, source) {
  const DailyErrorList = await DailyError.findAll({
    where: {
      city: cityName,
      source: source,
    },
  });
  if (DailyErrorList.length === 0) {
    console.log("未找到记录");
    return [];
  }
  return DailyErrorList.map((record) => ({
    cityName: record.city,
    source: record.source,
    targetDate: record.target_date,
    errorType: record.error_type,
    errorValue: record.error_value,
  }));
}
async function getOneError(city, src, field) {
  const DailyErrorLatest = await DailyError.findOne({
    where: { city, source: src, error_type: field },
    order: [['target_date', 'DESC']]
  });
  if (!DailyErrorLatest) {
    console.log("未找到记录");
    return null;
  }
  return DailyErrorLatest
}
async function getEWMAError(city,target_date) {
  const record = await DailyError.findAll({
    where: { city, target_date }
    // source, error_type: field, target_date
  });
  if (record.length == 0) return null
  return record
}
router.get('/errors', async (req, res) => {
  try {
    let { location, date, source } = req.query;
    let locations = [];

    // location 字符串（逗号分隔）
    if (req.query.location) {
      if (typeof req.query.location === 'string') {
        locations = req.query.location.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(req.query.location)) {
        locations = req.query.location.map(s => s.trim()).filter(Boolean);
      }
    }
    // location[] 数组（axios 传数组时自动生成）
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
    if (req.query['source[]']) {
      const arr = req.query['source[]'];
      if (typeof arr === 'string') sources = [arr];
      else if (Array.isArray(arr)) sources = arr;
      sources = sources.map(s => s.trim()).filter(Boolean);
    }
    if (!sources.length) sources = ['QWeather'];

    // ---------- 日期处理 ----------
    let startDate, endDate;
    if (!date && !req.query['date[start]']) {
      // 默认查询最近7天（从昨天开始往前推6天，共7天）
      startDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD'); // 昨天
      endDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD');   // 6天前
    } else if (req.query['date[start]'].length !== 0) {
      endDate = req.query['date[start]']
      startDate = req.query['date[end]']
    }
    else {
      const parsed = dayjs(date);
      if (!parsed.isValid()) {
        return res.status(400).json({ code: 400, message: '日期格式错误，请使用 YYYY-MM-DD' });
      }
      startDate = parsed.format('YYYY-MM-DD');
      endDate = startDate;
    }

    const errorsList = await DailyError.findAll({
      where: {
        city: { [Op.in]: locations },
        source: { [Op.in]: sources },
        target_date: {
          [Op.gte]: endDate,
          [Op.lte]: startDate
        }
      },
      order: [['target_date', 'ASC']]
    });

    res.json({ code: 200, message: 'success', data: errorsList });
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});
router.get('/score', async (req, res) => {
  try {
    let { location, date, source } = req.query;
    let locations
    // location 字符串（逗号分隔）
    if (location) {
      if (typeof location === 'string') {
        locations = location.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(location)) {
        locations = location.map(s => s.trim()).filter(Boolean);
      }
    }
    // location[] 数组（axios 传数组时自动生成）
    if (req.query['location[]']) {
      const arr = req.query['location[]'];
      if (typeof arr === 'string') locations = [arr];
      else if (Array.isArray(arr)) locations = arr;
      locations = locations.map(s => s.trim()).filter(Boolean);
    }
    // 3. 默认
    if (!locations.length) locations = ['北京'];

    // ---------- 处理 source 同理（可选） ----------
    let sources = [];
    if (source) {
      if (typeof source === 'string') {
        sources = source.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(source)) {
        sources = source.map(s => s.trim()).filter(Boolean);
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
    const startParam = req.query['date[start]'];
    const endParam = req.query['date[end]'];

    if (startParam && endParam) {
      const start = dayjs(startParam);
      const end = dayjs(endParam);
      if (!start.isValid() || !end.isValid()) {
        return res.status(400).json({ code: 400, message: '日期格式错误，请使用 YYYY-MM-DD' });
      }
      if (start.isBefore(end)) {
        endDate = start.format('YYYY-MM-DD');
        startDate = end.format('YYYY-MM-DD');
      } else {
        endDate = end.format('YYYY-MM-DD');
        startDate = start.format('YYYY-MM-DD');
      }
    }
    else if (date) {
      const parsed = dayjs(date);
      if (!parsed.isValid()) {
        return res.status(400).json({ code: 400, message: '日期格式错误，请使用 YYYY-MM-DD' });
      }
      startDate = parsed.format('YYYY-MM-DD');
      endDate = startDate;
    }
    else {
      startDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');   // 昨天
      endDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD');     // 6 天前
    }


    const scoreList = await TrustScore.findAll({
      where: {
        city: { [Op.in]: locations },
        source: { [Op.in]: sources },
        target_date: {
          [Op.gte]: endDate,
          [Op.lte]: startDate
        }
      },
      order: [['target_date', 'ASC']]
    });

    res.json({ code: 200, message: 'success', data: scoreList });
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});
module.exports = {
  getError,
  getOneError,
  getAllError,
  getEWMAError,
  router
};
