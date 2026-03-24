const { City } = require("../models");
const express = require("express");
const router = express.Router();
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
router.get('/city', async (req, res) => {
  try {
    let { location } = req.query;
    location = location
    if (!location) {
      return
    }
    const city = await City.findOne({
      where: {
        name: location,
      },
    });
    res.json({ code: 200, message: 'success', data: city });
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});
module.exports = {
    getLatLon,
    router
}