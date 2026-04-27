const {
    computeNewEWMA,
    calculateErrors,
    evaluateFieldCredibility
} = require("../../fetcher/processingData");
const { getOneError } = require("../../../controllers/errors");
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
async function computeCityErrors(city, targetDate) {
    // 获取预测数据（各数据源的预报）和实况数据
    const forecastData = await getNextWeather(city, targetDate);
    const observedData = await getRealData(city, targetDate);
    
    const errors = calculateErrors(observedData, forecastData);
    return errors
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
async function upsertDailyErrorBatch({ city, source, target_date, error_values }) {
  // 1. 获取上一条记录（用于 EWMA 计算）
  const prevRecord = await getOneError(city, source);

  // 2. 为每个字段计算新的 EWMA
  const updateData = {
    city,
    source,
    target_date,
  };

  for (const field of FIELDS_CAL) {
    const errorValue = error_values[field] ?? null;
    const prevEWMA = prevRecord ? prevRecord[`${field}_ewma_error`] : null;
    const maxError = FIELD_CONFIGS[field].maxError;
    const newEWMA = computeNewEWMA(errorValue, prevEWMA, EWMA_ALPHA, maxError);

    // 设置误差值字段和 EWMA 字段
    updateData[field] = errorValue;
    updateData[`${field}_ewma_error`] = newEWMA;
  }

  // 3. 执行 upsert（基于 city + source + target_date 唯一约束）
  
  await DailyError.upsert(updateData);

  console.log(`✅ 误差批量存储 | 城市: ${city} | 数据源: ${source} | 日期: ${target_date}`);
}

/**
 * 处理单个城市的所有误差计算和存储
 * @param {string} city
 */
async function processCityErrors(city, targetDate) {
    console.log(`🚀 开始处理城市: ${city}`);
    const errors = await computeCityErrors(city, targetDate);

    if (!errors.length) {
        console.log(`⚠️ 城市 ${city} 无误差数据`);
        return;
    }

    // 并发存储所有误差记录
    await Promise.all(errors.map(error => upsertDailyErrorBatch(error)));

    console.log(`✨ 城市 ${city} 处理完成，共 ${errors.length} 条误差记录`);
}

/**
 * 主入口：批量计算所有城市的误差并写入 DailyError 表
 */
async function setErrors() {
    console.log('========== 日误差 EWMA 批量计算开始 ==========');
    const startTime = Date.now();

    // 顺序处理城市（避免同时过多请求导致接口超时或数据库压力过大）
    const targetDate = get_yesterday_formatted();
    for (const city of CITY_LIST) {
        await processCityErrors(city,targetDate);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`========== 任务结束，耗时 ${duration} 秒 ==========`);
}


async function setErrors1(targetDate) {
    console.log('========== 日误差 EWMA 批量计算开始 ==========');
    const startTime = Date.now();

    // 顺序处理城市（避免同时过多请求导致接口超时或数据库压力过大）
    for (const city of CITY_LIST) {
        await processCityErrors(city, targetDate);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`========== 任务结束，耗时 ${duration} 秒 ==========`);
}
module.exports = {
    setErrors,
    setErrors1
};