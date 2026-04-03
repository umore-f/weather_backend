import { getEWMAError } from '../../../controllers/errorScore';

const { SOURCE_LIST, CITY_LIST, FIELD_CONFIGS } = require('../../../utils/constants');
const { get_yesterday_formatted } = require('../../../utils/helpers');
const db = require('../../../models');
const { TrustScore } = db
const { calculateNormalizedAverageError } = require('../../fetcher/processingData')
// 只处理昨天这一天
const targetDate = get_yesterday_formatted();

/**
 * 获取指定城市单个日期的误差数据（按数据源聚合）
 * @param {string} city - 城市名称
 * @returns {Promise<Array>} 返回格式：
 *   [{ target_date, source, city, error: { temp: number, humidity: number, ... } }]
 */
async function fetchErrorsByCity(city) {
    const rawErrors = await getEWMAError(city, targetDate); // 返回所有数据源的误差数组
    const errorsByDateAndSource = [];

    for (const source of SOURCE_LIST) {
        // 提取该数据源下各个误差类型的 EWMA 值
        const errorMap = rawErrors
            .filter(item => item.source === source)
            .reduce((acc, item) => {
                acc[item.error_type] = item.ewma_error;
                return acc;
            }, {});

        errorsByDateAndSource.push({
            target_date: targetDate,
            source,
            city,
            error: errorMap,
        });
    }

    return errorsByDateAndSource;
}

/**
 * 计算并存储单个误差项的信任分
 * @param {Object} errorItem - fetchErrorsByCity 返回的单项数据
 */
async function computeAndStoreScore(errorItem) {
    const { error, source, target_date, city } = errorItem;

    const scoreResult = calculateNormalizedAverageError(
        { errors: error, source, target_date, city },
        FIELD_CONFIGS
    );

    const {
        source: resultSource,
        target_date: resultDate,
        city: resultCity,
        totalScore,
        fieldScores: {
            humidity,
            precip,
            pressure,
            temp,
            tempMax,
            tempMin,
        },
        window_days = 7,
    } = scoreResult;

    await TrustScore.upsert({
        city: resultCity,
        source: resultSource,
        target_date: resultDate,
        window_days,
        total_score: totalScore,
        humidity_score: humidity,
        precip_score: precip,
        pressure_score: pressure,
        temp_score: temp,
        temp_max_score: tempMax,
        temp_min_score: tempMin,
    });

    console.log(`✅ 存储成功 | 城市: ${resultCity} | 日期: ${resultDate} | 数据源: ${resultSource}`);
}

/**
 * 处理单个城市的所有数据（拉取误差 → 计算分数 → 存储）
 * @param {string} city - 城市名称
 */
async function processCity(city) {
    console.log(`🚀 开始处理城市: ${city}`);
    const errorItems = await fetchErrorsByCity(city);
    await Promise.all(errorItems.map(item => computeAndStoreScore(item)));
    console.log(`✨ 城市 ${city} 处理完成，共 ${errorItems.length} 条记录`);
}

/**
 * 主入口：处理所有城市（仅昨天日期）
 */
async function setScore() {
    console.log('========== 信任分批量计算任务开始 ==========');
    const startTime = Date.now();

    for (const city of CITY_LIST) {
        await processCity(city);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`========== 任务结束，耗时 ${duration} 秒 ==========`);
}

module.exports = {
    setScore,
};