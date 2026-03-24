// 从其他api那获取数据存到本地数据库
const Bottleneck = require('bottleneck');
const { CITY_LIST } = require('../../../utils/constants')
const {
    syncHfWeatherDataHours,
    syncHfNextWeatherDataDays,
    syncHfLastWeatherDataDays
} = require('./heWeather')
const {
    syncTiNextWeatherData,
    syncTiLastWeatherData
} = require('./tomorrowIo')
const {
    syncVcNextWeatherDataDay,
    syncVcLastWeatherDataDay
} = require('./visualCrossing')


async function fetchAllDays(cityName) {
    const promises = [
        syncHfNextWeatherDataDays(cityName),
        syncHfLastWeatherDataDays(cityName),
        syncTiNextWeatherData(cityName),
        syncTiLastWeatherData(cityName),
        syncVcNextWeatherDataDay(cityName),
        syncVcLastWeatherDataDay(cityName),
    ]
    const results = await Promise.all(promises)
    // 结果顺序与 promises 数组一致
    console.log(results)
}
async function fetchAllHours(cityName) {
    const promises = [
        syncHfWeatherDataHours(cityName),
        syncTiNextWeatherData(cityName),
    ]
    const results = await Promise.all(promises)
    console.log(results)
}
// 创建限流器：每小时最多 15 次，同时最多并发 1 个请求
const limiter = new Bottleneck({
    reservoir: 15,                     // 初始令牌数（每小时刷新）
    reservoirRefreshAmount: 15,        // 每小时补充 15 个令牌
    reservoirRefreshInterval: 60 * 60 * 1000, // 刷新间隔 1 小时
    maxConcurrent: 1,                  // 串行执行，避免并发抢占
    minTime: 100,                      // 可选：两次调用之间最小间隔（毫秒）
});

// 只包装受限制的两个函数
const limitedSyncTiNext = limiter.wrap(syncTiNextWeatherData);
const limitedSyncTiLast = limiter.wrap(syncTiLastWeatherData);
// 其他四个函数不需要包装
async function fetchAllDays(cityName) {
    // 注意：这六个函数都会执行，但其中两个受限流控制
    const promises = [
        syncHfNextWeatherDataDays(cityName),   // 无限制
        syncHfLastWeatherDataDays(cityName),   // 无限制
        limitedSyncTiNext(cityName),           // 受限
        limitedSyncTiLast(cityName),           // 受限
        syncVcNextWeatherDataDay(cityName),    // 无限制
        syncVcLastWeatherDataDay(cityName),    // 无限制
    ];

    // 等待所有任务完成（无论有无返回值）
    await Promise.all(promises);
    console.log(`${cityName} 数据处理完成`);
}
async function fetchAllHours(cityName) {
    // 注意：这六个函数都会执行，但其中两个受限流控制
    const promises = [
        syncHfWeatherDataHours(cityName),      // 无限制
        limitedSyncTiNext(cityName),           // 受限        
    ];

    // 等待所有任务完成（无论有无返回值）
    await Promise.all(promises);
    console.log(`${cityName} 数据处理完成`);
}
async function updateAllCities() {
    console.log(`[${new Date().toISOString()}] 开始更新所有城市数据...`);
    try {
        // 串行处理每个城市，避免无限制函数同时并发过多（它们虽然无限制，但过多并发可能影响系统）
        for (const city of CITY_LIST) {
            await fetchAllDays(city);
        }
        console.log(`[${new Date().toISOString()}] 所有城市更新完成`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 更新失败:`, error);
    }
}
async function updateAllCitiesHours() {
    console.log(`[${new Date().toISOString()}] 开始更新所有城市小时级别数据...`);
    try {
        // 串行处理每个城市，避免无限制函数同时并发过多
        for (const city of CITY_LIST) {
            await fetchAllHours(city);
        }
        console.log(`[${new Date().toISOString()}] 所有城市小时级别数据更新完成`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 小时级别数据更新失败:`, error);
    }
}
module.exports = {
    updateAllCities,
    updateAllCitiesHours
}
