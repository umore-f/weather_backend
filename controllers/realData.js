const { Op, where } = require("sequelize");
const express = require("express");
const { DailyAvg } = require("../models");
const router = express.Router();
const dayjs = require('dayjs');

async function getRealData(cityName, dateParam) {
const dateStr = dateParam || get_yesterday_formatted();
  const DailyAvgList = await DailyAvg.findAll({
    where: {
      city: cityName,
      target_date: {
        [Op.like]: dateStr,
      },
    },
  });
  if (DailyAvgList.length === 0) {
    console.log("未找到记录");
    return [];
  }
  return DailyAvgList.map((record) => ({
    cityName: record.city,
    targetDate: record.target_date,
    temp: record.temp,
    tempMax: record.temp_max,
    tempMin: record.temp_min,
    humidity: record.humidity,
    precip: record.precip,
    pressure: record.pressure
  }));
}

module.exports = { getRealData };