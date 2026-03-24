const { Op, where } = require("sequelize");
const express = require("express");
const { DailyError, TrustScore } = require("../models");
const { get_yesterday_formatted } = require("../utils/helpers");
const router = express.Router();
// 查找字段误差
async function getError(cityName,source) {
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
  // DailyErrorList.forEach((record, index) => {
  //   console.log(`记录 ${index + 1}:`, record.get({ plain: true }));
  // });

  return DailyErrorList.map((record) => ({
    cityName: record.city,
    source: record.source,
    targetDate: record.target_date,
    errorType: record.error_type,
    errorValue: record.error_value,
  }));
}
router.get('/errors', async (req, res) => {
  try {
    let { location, date, source } = req.query;
    location = location || '北京';
    source = source || 'QWeather';

    let startDate, endDate;
    if (!date) {
      // 默认查询今天到未来7天
      startDate = dayjs().format('YYYY-MM-DD');
      endDate = dayjs().add(7, 'day').format('YYYY-MM-DD');
    } else {
      // 用户传入指定日期（格式 YYYY-MM-DD），只查当天
      const parsed = dayjs(date);
      if (!parsed.isValid()) {
        return res.status(400).json({ code: 400, message: '日期格式错误，请使用 YYYY-MM-DD' });
      }
      startDate = parsed.format('YYYY-MM-DD');
      endDate = startDate; // 同一天
    }

    const errorsList = await DailyError.findAll({
      where: {
        city: location,
        source: source,
        target_date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
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
    location = location || '北京';
    source = source || 'QWeather';

    let startDate, endDate;
    if (!date) {
      // 默认查询今天到未来7天
      startDate = dayjs().format('YYYY-MM-DD');
      endDate = dayjs().add(7, 'day').format('YYYY-MM-DD');
    } else {
      // 用户传入指定日期（格式 YYYY-MM-DD），只查当天
      const parsed = dayjs(date);
      if (!parsed.isValid()) {
        return res.status(400).json({ code: 400, message: '日期格式错误，请使用 YYYY-MM-DD' });
      }
      startDate = parsed.format('YYYY-MM-DD');
      endDate = startDate; // 同一天
    }

    const scoreList = await TrustScore.findAll({
      where: {
        city: location,
        source: source,
        target_date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
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
  router
};
