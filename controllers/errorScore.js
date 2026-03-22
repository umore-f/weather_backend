const { Op, where } = require("sequelize");
const { DailyError } = require("../models");
const { get_yesterday_formatted } = require("../utils/helpers");
// 查找字段误差
async function getSingleError(cityName) {
  const date = get_yesterday_formatted();
  const dailyError = await DailyError.findOne({
    where: {
      name: cityName,
      target_date: '2026-03-22',
    },
  });
  if (!dailyError) {
    return null;
  }
  return {
    cityName: cityName,
    source: dailyError.source,
    targetDate: dailyError.target_date,
    errorType: dailyError.error_type,
    errorValue: dailyError.error_value,
  };
}
getSingleError('北京')
module.exports = {
  getSingleError
};
