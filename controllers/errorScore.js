const { Op, where } = require("sequelize");
const { DailyError } = require("../models");
const { get_yesterday_formatted } = require("../utils/helpers");
// 查找字段误差
async function getError(cityName,source) {
  const dateStr = get_yesterday_formatted();
  const DailyErrorList = await DailyError.findAll({
    where: {
      city: cityName,
      source: source,
      target_date: {
        [Op.like]: '2026-03-22',
      },
    },
  });
  if (DailyErrorList.length === 0) {
    console.log("未找到记录");
    return [];
  }
  DailyErrorList.forEach((record, index) => {
    console.log(`记录 ${index + 1}:`, record.get({ plain: true }));
  });

  return DailyErrorList.map((record) => ({
    cityName: record.city,
    source: record.source,
    targetDate: record.target_date,
    errorType: record.error_type,
    errorValue: record.error_value,
  }));
}
getError('北京','QWeather')
module.exports = {
  getError
};
