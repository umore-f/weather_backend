
const cron = require('node-cron');
const { syncWeatherData } = require('../utils/weatherUpdater')
const { CITY_LIST } = require('../utils/constants')
// 计时循环任务 更新数据库数据
// 每小时的第 0 分钟执行
cron.schedule('0 * * * *', async () => {
    console.log('开始定时更新所有城市天气...');
    
    for (const city of CITY_LIST) {
        try {
            await syncWeatherData(city); // 顺序等待每个城市更新完成
            console.log(`✅ ${city} 更新成功`);
        } catch (error) {
            console.error(`❌ ${city} 更新失败:`, error.message);
        }
    }
    
    console.log('所有城市更新完毕');
});