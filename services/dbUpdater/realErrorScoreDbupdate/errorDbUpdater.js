const {
    computeNewEWMA,
    calculateNormalizedAverageError,
    evaluateFieldCredibility
} = require("../../fetcher/processingData");
const { getError, getOneError } = require("../../../controllers/errors");
const { CITY_LIST, FIELDS_CAL, FIELD_CONFIGS, SOURCE_LIST } = require("../../../utils/constants");
const { getNextWeather } = require("../../../controllers/weatherController");
const { getRealData } = require('../../../controllers/realData');
const db = require("../../../models");
const { DailyError, TrustScore } = db;
const { get_yesterday_formatted } = require("../../../utils/helpers");
require("dotenv").config({ path: "../../.env" });

// ==================== 常量配置 ====================
const EWMA_ALPHA = 0.3;                     // EWMA 平滑因子
// ==================== 核心函数 ====================

/**
 * 计算单个城市所有数据源、所有评估字段的误差值
 * @param {string} city - 城市名称
 * @returns {Promise<Array>} 误差对象数组，每个元素包含：city, source, error_type, target_date, error_value
 */
async function computeCityErrors(city) {
    const targetDate = get_yesterday_formatted(); // 固定处理昨天的数据
    // 获取预测数据（各数据源的预报）和实况数据
    const forecastData = await getNextWeather(city, targetDate);
    const observedData = await getRealData(city, targetDate);

    const errorPromises = [];

    for (const field of FIELDS_CAL) {
        // evaluateFieldCredibility 可能返回数组（多个数据源的结果），直接收集
        const fieldErrors = evaluateFieldCredibility(field, observedData, forecastData);
        errorPromises.push(fieldErrors);
    }

    // 扁平化所有误差结果
    const allErrors = (await Promise.all(errorPromises)).flat();
    return allErrors;
}

/**
 * 插入或更新单条日误差记录，并计算 EWMA 误差
 * @param {Object} errorInfo - 误差信息
 * @param {string} errorInfo.city
 * @param {string} errorInfo.source
 * @param {string} errorInfo.error_type
 * @param {string} errorInfo.target_date
 * @param {number} errorInfo.error_value
 */
async function upsertDailyErrorWithEWMA({ city, source, error_type, target_date, error_value }) {
    // 获取该城市、数据源、误差类型的上一条记录（按 target_date 倒序）
    const lastRecord = await getOneError(city, source, error_type);
    const prevEWMA = lastRecord ? lastRecord.ewma_error : null;

    const defaultMaxError = FIELD_CONFIGS[error_type]?.maxError;
    if (defaultMaxError === undefined) {
        console.warn(`⚠️ 未找到字段 ${error_type} 的 maxError 配置，使用默认值 100`);
    }

    const newEWMA = computeNewEWMA(
        error_value,
        prevEWMA,
        EWMA_ALPHA,
        defaultMaxError || 100
    );

    // 使用 upsert 避免重复插入（基于唯一约束：city, source, error_type, target_date）
    await DailyError.upsert({
        city,
        source,
        target_date,
        error_type,
        error_value,
        ewma_error: newEWMA,
    });

    console.log(`✅ 误差存储 | 城市: ${city} | 数据源: ${source} | 字段: ${error_type} | EWMA: ${newEWMA.toFixed(4)}`);
}

/**
 * 处理单个城市的所有误差计算和存储
 * @param {string} city
 */
async function processCityErrors(city) {
    console.log(`🚀 开始处理城市: ${city}`);
    const errors = await computeCityErrors(city);

    if (!errors.length) {
        console.log(`⚠️ 城市 ${city} 无误差数据`);
        return;
    }

    // 并发存储所有误差记录（可根据数据库连接池调整并发数）
    await Promise.all(errors.map(error => upsertDailyErrorWithEWMA(error)));

    console.log(`✨ 城市 ${city} 处理完成，共 ${errors.length} 条误差记录`);
}

/**
 * 主入口：批量计算所有城市的误差并写入 DailyError 表
 */
async function setErrors() {
    console.log('========== 日误差 EWMA 批量计算开始 ==========');
    const startTime = Date.now();

    // 顺序处理城市（避免同时过多请求导致接口超时或数据库压力过大）
    for (const city of CITY_LIST) {
        await processCityErrors(city);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`========== 任务结束，耗时 ${duration} 秒 ==========`);
}

module.exports = {
    setErrors,
};