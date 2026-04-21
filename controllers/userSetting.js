const express = require('express');
const router = express.Router();
const { UserSetting } = require('../models');
const authMiddleware = require('../middleware/auth');


async function upsertUserSetting(userId, settings) {
  const [setting, created] = await UserSetting.findOrCreate({
    where: { user_id: userId },
    defaults: {
      display_cities: settings.display_cities || [],
      weather_fields: settings.weather_fields || [],
      data_sources: settings.data_sources || [],
      date_start: settings.date_start || null,
      date_end: settings.date_end || null,
    },
  });
  if (!created) {
    await setting.update(settings);
  }
  return setting;
}

async function getUserSetting(userId) {
  const setting = await UserSetting.findOne({ where: { user_id: userId } });
  if (!setting) {
    // 返回默认设置
    return {
      display_cities: [],
      weather_fields: [],
      data_sources: [],
      date_start: null,
      date_end: null,
    };
  }
  return setting;
}

// 获取当前用户的设置
router.get('/user/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // 从 JWT 解析的用户ID
    let setting = await UserSetting.findOne({ where: { user_id: userId } });
    
    if (!setting) {
      // 返回空默认设置
      return res.json({
        display_cities: [],
        weather_fields: [],
        data_sources: [],
        date_start: null,
        date_end: null
      });
    }
    
    res.json({
      display_cities: setting.display_cities || [],
      weather_fields: setting.weather_fields || [],
      data_sources: setting.data_sources || [],
      date_start: setting.date_start,
      date_end: setting.date_end
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取设置失败' });
  }
});

// 更新用户设置（创建或更新）
router.put('/user/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { display_cities, weather_fields, data_sources, date_start, date_end } = req.body;
    
    // 基本验证
    if (!Array.isArray(display_cities) || !Array.isArray(weather_fields) || !Array.isArray(data_sources)) {
      return res.status(400).json({ message: '参数格式错误，期望数组' });
    }
    
    // 使用 findOrCreate 然后更新
    const [setting, created] = await UserSetting.findOrCreate({
      where: { user_id: userId },
      defaults: {
        display_cities: display_cities || [],
        weather_fields: weather_fields || [],
        data_sources: data_sources || [],
        date_start: date_start || null,
        date_end: date_end || null
      }
    });
    
    if (!created) {
      await setting.update({
        display_cities: display_cities || [],
        weather_fields: weather_fields || [],
        data_sources: data_sources || [],
        date_start: date_start || null,
        date_end: date_end || null
      });
    }
    
    res.json({ message: '设置保存成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '保存设置失败' });
  }
});

module.exports = { router };