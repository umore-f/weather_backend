// 从其他api那获取数据存到本地数据库
const Bottleneck = require('bottleneck')
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

// ==================== 限流器配置（最保险模式） ====================

// ---------- 1. 和风天气（HeWeather）----------
// 免费版：每秒1次，每日1000次
// 配置：串行 + 1秒间隔 + 每日800次缓冲
const hfLimiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 1000,                           // 1次/秒
    reservoir: 800,                          // 每日最多800次
    reservoirRefreshAmount: 800,
    reservoirRefreshInterval: 24 * 60 * 60 * 1000,
});

const limitedHfHours = hfLimiter.wrap(syncHfWeatherDataHours);
const limitedHfNextDays = hfLimiter.wrap(syncHfNextWeatherDataDays);
const limitedHfLastDays = hfLimiter.wrap(syncHfLastWeatherDataDays);

// ---------- 2. Tomorrow.io ----------
// 官方限制：每小时25次，每秒3次（自动满足）
// 配置：串行 + 144秒间隔 + 每小时25次令牌桶
const tiLimiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 144000,                         // 144秒 = 3600/25
    reservoir: 25,                           // 每小时最多25次
    reservoirRefreshAmount: 25,
    reservoirRefreshInterval: 60 * 60 * 1000,
});

const limitedTiNext = tiLimiter.wrap(syncTiNextWeatherData);
const limitedTiLast = tiLimiter.wrap(syncTiLastWeatherData);

// ---------- 3. Visual Crossing ----------
// 免费版常见限制：每分钟30次，每日1000次
// 配置：串行 + 2秒间隔 + 每日900次缓冲
const vcLimiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 2000,                           // 0.5次/秒
    reservoir: 900,                          // 每日最多900次
    reservoirRefreshAmount: 900,
    reservoirRefreshInterval: 24 * 60 * 60 * 1000,
});

const limitedVcNext = vcLimiter.wrap(syncVcNextWeatherDataDay);
const limitedVcLast = vcLimiter.wrap(syncVcLastWeatherDataDay);

// ==================== 数据处理函数 ====================

/**
 * 获取一个城市的全部日级数据（所有数据源）
 * 顺序执行，严格遵守各限流器的串行要求
 */
async function fetchAllDays(cityName) {
    try {
        await limitedHfNextDays(cityName);
        await limitedHfLastDays(cityName);
        await limitedTiNext(cityName);
        await limitedTiLast(cityName);
        await limitedVcNext(cityName);
        await limitedVcLast(cityName);
        console.log(`[${new Date().toISOString()}] ${cityName} 日级数据处理完成`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] ${cityName} 日级数据处理失败:`, error.message);
        // 不抛出，让其他城市继续
    }
}

/**
 * 获取一个城市的全部小时级数据
 */
async function fetchAllHours(cityName) {
    try {
        await limitedHfHours(cityName);
        await limitedTiNext(cityName);   // Tomorrow.io 小时数据
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
            // 城市之间额外延迟2秒，作为全局缓冲
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`[${new Date().toISOString()}] 所有城市日级数据更新完成，耗时 ${elapsed} 秒`);
    } catch (error) {
        console.error(`[${new Date().toISOString()}] 日级数据更新失败:`, error);
    }
}

/**
 * 更新所有城市的小时级数据
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