
const cron = require('node-cron');
const { syncTiWeatherData, syncHfWeatherData, syncVcWeatherData } = require('../utils/weatherUpdater')
// 计时循环任务 更新数据库数据
cron.schedule('*0 * * * *', () => {
  syncTiWeatherData(),
  syncHfWeatherData(),
  syncVcWeatherData()
});