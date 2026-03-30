// 从其他api那获取数据存到本地数据库
const Bottleneck = require('bottleneck');
const { CITY_LIST } = require('../../../utils/constants');
const {
    syncHfWeatherDataHours,
    syncHfNextWeatherDataDays,
    syncHfLastWeatherDataDays
} = require('./heWeather');
const {
    syncTiNextWeatherData,
    syncTiLastWeatherData
} = require('./tomorrowIo');
const {
    syncVcNextWeatherDataDay,
    syncVcLastWeatherDataDay
} = require('./visualCrossing');

// ==================== 限流器配置 ====================

// 1. Tomorrow.io 限流器
const tiLimiter = new Bottleneck({
    reservoir: 20,                     // 每小时最多 20 个令牌
    reservoirRefreshAmount: 20,
    reservoirRefreshInterval: 60 * 60 * 1000,
    maxConcurrent: 1,                  // 串行执行
    minTime: 1000,                     // 两次调用之间最小间隔 1 秒
});

// 2. Visual Crossing 限流器（新增）
// 配置说明：
//   - maxConcurrent: 2   => 最多同时发起 2 个请求（VC 并发限制通常为 5-10，保守设 2）
//   - minTime: 1500      => 两次请求之间至少间隔 1.5 秒（避免触发每分钟速率限制）
//   - 若免费套餐每日仅 1000 次，可开启 reservoir 限制（下面已注释示例）
const vcLimiter = new Bottleneck({
    maxConcurrent: 2,
    minTime: 1500,
    // 可选：如果担心每日总调用量超过 1000，可启用以下配置（每小时补充 42 次，约 1000/24）
    // reservoir: 42,
    // reservoirRefreshAmount: 42,
    // reservoirRefreshInterval: 60 * 60 * 1000,
});

// 包装受限制的函数
const limitedSyncTiNext = tiLimiter.wrap(syncTiNextWeatherData);
const limitedSyncTiLast = tiLimiter.wrap(syncTiLastWeatherData);
const limitedSyncVcNext = vcLimiter.wrap(syncVcNextWeatherDataDay);
const limitedSyncVcLast = vcLimiter.wrap(syncVcLastWeatherDataDay);

// ==================== 数据处理函数 ====================

/**
 * 获取一个城市的全部日级数据（所有数据源）
 */
async function fetchAllDays(cityName) {
    // 注意：6 个函数会并发执行，但受限流器控制
    const promises = [
        syncHfNextWeatherDataDays(cityName),   // 和风（无限制）
        syncHfLastWeatherDataDays(cityName),   // 和风（无限制）
        limitedSyncTiNext(cityName),           // Tomorrow.io（受限）
        limitedSyncTiLast(cityName),           // Tomorrow.io（受限）
        limitedSyncVcNext(cityName),           // Visual Crossing（新增受限）
        limitedSyncVcLast(cityName),           // Visual Crossing（新增受限）
    ];

    try {
        await Promise.all(promises);
        console.log(`[${new Date().toISOString()}] ${cityName} 日级数据处理完成`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ${cityName} 日级数据处理失败:`, error.message);
        // 可根据需要决定是否抛出，这里仅记录错误，不影响其他城市继续
    }
}

/**
 * 获取一个城市的全部小时级数据
 */
async function fetchAllHours(cityName) {
    const promises = [
        syncHfWeatherDataHours(cityName),      // 和风（无限制）
        limitedSyncTiNext(cityName),           // Tomorrow.io（受限）
    ];

    try {
        await Promise.all(promises);
        console.log(`[${new Date().toISOString()}] ${cityName} 小时级数据处理完成`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ${cityName} 小时级数据处理失败:`, error.message);
    }
}

/**
 * 更新所有城市的日级数据（串行 + 城市间延迟）
 */
async function updateAllCities() {
    console.log(`[${new Date().toISOString()}] 开始更新所有城市日级数据...`);
    const startTime = Date.now();

    try {
        for (const city of CITY_LIST) {
            await fetchAllDays(city);
            // 城市之间延迟 2 秒，降低对 API 的总请求频率，避免触发每小时总量限制
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[${new Date().toISOString()}] 所有城市日级数据更新完成，耗时 ${elapsed} 秒`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 日级数据更新失败:`, error);
    }
}

/**
 * 更新所有城市的小时级数据（串行 + 城市间延迟）
 */
async function updateAllCitiesHours() {
    console.log(`[${new Date().toISOString()}] 开始更新所有城市小时级数据...`);
    const startTime = Date.now();

    try {
        for (const city of CITY_LIST) {
            await fetchAllHours(city);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[${new Date().toISOString()}] 所有城市小时级数据更新完成，耗时 ${elapsed} 秒`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 小时级数据更新失败:`, error);
    }
}

module.exports = {
    updateAllCities,
    updateAllCitiesHours,
};