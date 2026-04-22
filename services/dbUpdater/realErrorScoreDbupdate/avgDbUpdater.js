const { getRobustRealValue } = require("../../fetcher/processingData");
const { getHistoryWeather, getNextWeather } = require('../../../controllers/weatherController');
const { getRealDataList } = require('../../../controllers/realData');
const { getSourceWeights } = require('../../fetcher/processingData');
const { CITY_LIST, FIELDS_CAL, FIELD_CONFIGS } = require("../../../utils/constants");
const { DailyAvg } = require("../../../models");
const {
    get_yesterday_formatted,
    weightedAverage
} = require("../../../utils/helpers");
require("dotenv").config({ path: "../../.env" });

// ==================== 常量配置 ====================
const COLD_START_THRESHOLD = 7;          // 冷启动阈值：实况数据少于该天数时使用中位数法

const MAX_ITERATIONS = 8;                // 自洽迭代最大次数
const CONVERGENCE_TOLERANCE = 0.01;      // 收敛容差

// ==================== 辅助函数 ====================

/**
 * 将字段名中的 tempMax/tempMin 转换为数据库字段 temp_max/temp_min
 * @param {Object} obj - 原始对象（包含 tempMax, tempMin 等）
 * @returns {Object} 转换后的对象
 */
function normalizeFieldNames(obj) {
    const { tempMax, tempMin, ...rest } = obj;
    return {
        temp_max: tempMax,
        temp_min: tempMin,
        ...rest
    };
}

/**
 * 判断指定城市是否处于冷启动状态（实况数据天数 < 阈值）
 * @param {string} city - 城市名称
 * @returns {Promise<boolean>} true 表示冷启动
 */
async function isColdStartCity(city) {
    const realDataList = await getRealDataList(city);
    const dataCount = realDataList?.length || 0;
    return dataCount < COLD_START_THRESHOLD;
}

// ==================== 真值计算方法 ====================

/**
 * 方法一：中位数稳健估计（冷启动时使用）
 * 基于历史天气数据中各字段的中位数作为基准真值
 * @param {string} city - 城市名称
 */
async function getRobustBaseline(city, targetDate) {
    console.log(`📊 [稳健中位数] 开始处理城市: ${city}`);
    // const targetDate = get_yesterday_formatted(); // 统一处理昨天日期
    const historyData = await getHistoryWeather(city, targetDate);
    if (!historyData || historyData.length === 0) {
        console.warn(`⚠️ 城市 ${city} 无历史数据，跳过中位数真值计算`);
        return;
    }

    // 对每个字段计算中位数
    const medianValues = FIELDS_CAL.map(field => {
        const fieldValues = historyData.map(day => day[field]).filter(v => v != null);
        return getRobustRealValue(fieldValues);
    });

    // 构建存储对象
    const fieldObj = Object.fromEntries(FIELDS_CAL.map((field, idx) => [field, medianValues[idx]]));
    const normalizedObj = normalizeFieldNames({
        city,
        target_date: targetDate,
        ...fieldObj
    });

    await DailyAvg.upsert(normalizedObj, {
        conflictFields: ['city', 'target_date']  
    });

    console.log(`✅ [稳健中位数] 城市 ${city} 存储完成`);
}

/**
 * 方法二：自洽迭代估计（非冷启动时使用）
 * 通过迭代调整权重，使各预报源加权平均收敛到真实值
 * @param {string} city - 城市名称
 * @param {string} field - 气象字段
 * @returns {Promise<number>} 各个数据源的历史值
 */
async function selfConsistentBaseline(city, field ,targetDate) {
    const historys = await getHistoryWeather(city, targetDate);

    if (!historys || historys.length === 0) {
        throw new Error(`城市 ${city} 无历史数据，无法计算自洽真值`);
    }

    // 提取各数据源的该字段值
    const sources = historys.map(f => f.source);
    const values = historys.map(f => f[field]);
    let weights = await getSourceWeights(city, sources, field, FIELD_CONFIGS);
    let baseline = weightedAverage(values, weights);

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
        // 使用绝对值误差,不能使用ewma误差
        const errors = values.map(v => Math.abs(v - baseline));
        const newWeights = errors.map(e => 1 / (e + 1e-6));
        const newBaseline = weightedAverage(values, newWeights);
        if (Math.abs(newBaseline - baseline) < CONVERGENCE_TOLERANCE) break;
        baseline = newBaseline;
    }
    return baseline;
}

/**
 * 自洽真值方法（对所有字段计算并存储）
 * @param {string} city - 城市名称
 */
async function getSelfConsistentBaseline(city, targetDate) {
    console.log(`🔄 [自洽迭代] 开始处理城市: ${city}`);
    const fieldBaselines = {};
    for (const field of FIELDS_CAL) {
        try {
            fieldBaselines[field] = await selfConsistentBaseline(city, field, targetDate);
        } catch (error) {
            console.error(`❌ 城市 ${city} 字段 ${field} 自洽计算失败:`, error.message);
            fieldBaselines[field] = null; // 或使用降级策略，例如中位数
        }
    }

    const normalizedObj = normalizeFieldNames({
        city,
        target_date: targetDate,
        ...fieldBaselines
    });

    await DailyAvg.upsert(normalizedObj, {
        conflictFields: ['city', 'target_date']
    });

    console.log(`✅ [自洽迭代] 城市 ${city} 存储完成`);
}

// ==================== 主入口 ====================

/**
 * 批量设置所有城市的基准真值（根据冷启动状态自动选择方法）
 */
async function setReal() {
    console.log('========== 基准真值计算任务开始 ==========');
    const startTime = Date.now();
    const targetDate = get_yesterday_formatted();
    // 顺序处理城市（避免并发请求过多导致接口压力）
    for (const city of CITY_LIST) {
        const isCold = await isColdStartCity(city);
        console.log(`🌆 城市 ${city} | 冷启动状态: ${isCold ? '是（使用中位数法）' : '否（使用自洽迭代法）'}`);
        try {
            if (isCold) {
                await getRobustBaseline(city, targetDate);
            } else {
                await getSelfConsistentBaseline(city, targetDate);
            }
        } catch (error) {
            console.error(`❌ 城市 ${city} 处理失败:`, error.message);
            // 继续处理下一个城市，不中断整个任务
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`========== 基准真值计算结束，耗时 ${duration} 秒 ==========`);
}


async function setReal1(targetDate) {
    console.log('========== 基准真值计算任务开始 ==========');
    const startTime = Date.now();

    // 顺序处理城市（避免并发请求过多导致接口压力）
    for (const city of CITY_LIST) {
        const isCold = await isColdStartCity(city);
        console.log(`🌆 城市 ${city} | 冷启动状态: ${isCold ? '是（使用中位数法）' : '否（使用自洽迭代法）'}`);
        try {
            if (isCold) {
                await getRobustBaseline(city, targetDate);
            } else {
                await getSelfConsistentBaseline(city, targetDate);
            }
        } catch (error) {
            console.error(`❌ 城市 ${city} 处理失败:`, error.message);
            // 继续处理下一个城市，不中断整个任务
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`========== 基准真值计算结束，耗时 ${duration} 秒 ==========`);
}
module.exports = {
    setReal,
};