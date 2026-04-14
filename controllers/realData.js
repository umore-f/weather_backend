const { Op, where } = require("sequelize");
const express = require("express");
const { DailyAvg } = require("../models");
const router = express.Router();
const { get_yesterday_formatted } = require('../utils/helpers')

async function getRealData(cityName, dateParam) {
  const dateStr = dateParam || get_yesterday_formatted();

  const record = await DailyAvg.findOne({
    where: {
      city: cityName,
      target_date: dateStr,
    },
  });

  if (!record) {
    console.log("未找到记录");
    return null;
  }
  return {
    city: record.city,
    targetDate: record.target_date,
    temp: record.temp,
    temp_max: record.temp_max,
    temp_min: record.temp_min,
    humidity: record.humidity,
    precip: record.precip,
    pressure: record.pressure,
  };
}
async function getRealDataList(cityName) {
  const DailyAvgList = await DailyAvg.findAll({
    where: {
      city: cityName,
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
module.exports = { getRealData, getRealDataList };