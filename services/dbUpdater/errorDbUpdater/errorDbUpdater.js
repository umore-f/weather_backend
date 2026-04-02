const {
    evaluateFieldCredibility,
    computeNewEWMA
} = require("../../fetcher/processingData");
const { getError } = require("../../../controllers/errorScore");
const { CITY_LIST, FIELDS_CAL, FIELD_CONFIGS, SOURCE_LIST } = require("../../../utils/constants");
const { getNextWeather } = require("../../../controllers/weatherController");
const { getRealData } = require('../../../controllers/realData')
const { DailyError, TrustScore } = require("../../../models");
const {
    calculateNormalizedAverageError,
    weightedAverage
} = require("../../../utils/helpers");
require("dotenv").config({ path: "../../.env" });



async function getScore(cityName, source) {
    const errorList = await getError(cityName, source)
    const errors = errorList.map(item => ({
        city_name: item.cityName,
        source: item.source,
        target_date: item.targetDate,
        error_type: item.errorType,
        error_value: item.errorValue
    }))
    const realDataErrors = errors.reduce((acc, cur) => {
        if (!acc.source) {
            acc.source = cur.source;
            acc.target_date = cur.target_date;
            acc.city = cur.city_name;
            acc.errors = {};
        }
        acc.errors[cur.error_type] = cur.error_value;
        return acc;
    }, {});

    const compreError = calculateNormalizedAverageError(realDataErrors, FIELD_CONFIGS);
    const result = transformToScoreRecords(compreError)
    // console.log("!!!!!!!!!!!", result);

    await TrustScore.bulkCreate(result, { updateOnDuplicate: ['score'] });
}
async function setScore() {
    for (const source of SOURCE_LIST) {
        for (const city of CITY_LIST) {
            await getScore(city, source);
        }
    }
}
// 一般传日期,使用默认昨天
async function calError(city) {
    const next = await getNextWeather(city)
    const real = await getRealData(city)
    const results = [];
    for (const field of FIELDS_CAL) {
        const result = evaluateFieldCredibility(field, real, next)
        results.push(result)
    }
    return results.flat();
}


// 误差计算
async function setErrors() {
    const alpha = 0.3
        for (const city of CITY_LIST) {
            const errorResults = await calError(city);
            for (const errorResult of errorResults) {
                const defaultMaxError = FIELD_CONFIGS[errorResult.error_type].maxError
                await insertDailyErrorWithEWMA(errorResult.city, errorResult.source, errorResult.error_type, errorResult.target_date, errorResult.error_value, alpha, defaultMaxError);
            }
        }
}
// 插入一条新误差记录（自动计算 EWMA）
async function insertDailyErrorWithEWMA(city, source, field, targetDate, newError, alpha, defaultMaxError) {
    // 1. 取该（源,字段）上一次的 EWMA
    const last = await DailyError.findOne({
        where: { city, source, error_type: field },
        order: [['target_date', 'DESC']]
    });
    const prevEWMA = last ? last.ewma_error : null;

    // 2. 计算新的 EWMA
    const newEWMA = computeNewEWMA(newError, prevEWMA, alpha, defaultMaxError);

    // 3. 存入数据库（同时保存 error_value 和 ewma_error）
    await DailyError.create({
        city, source, target_date: targetDate, error_type: field,
        error_value: newError, ewma_error: newEWMA
    });
}

// 计算权重 -> 融合数据 -> 不再使用中位数 
async function getSourceWeights(city, sources, field) {
  const weights = [];
  for (const src of sources) {
    const latest = await DailyError.findOne({
      where: { city, source: src, error_type: field },
      order: [['target_date', 'DESC']]
    });
    const ewma = latest ? latest.ewma_error : (FIELD_CONFIGS[field].maxError / 2);
    weights.push(1 / (ewma + 1e-6));
  }
  return weights;
}


// 自恰迭代估计真实值
async function selfConsistentBaseline(city, field, maxIter = 5) {
  const forecasts = await getNextWeather(city)
  // forecasts: [{ source, value }]
  const sources = forecasts.map(f => f.source);
  let weights = await getSourceWeights(city, sources, field);
  let baseline = weightedAverage(forecasts.map(f => f[field]), weights);
  
  for (let iter = 0; iter < maxIter; iter++) {
    const errors = forecasts.map(f => Math.abs(f[field] - baseline));
    const newWeights = errors.map(e => 1 / (e + 1e-6));
    const newBaseline = weightedAverage(forecasts.map(f => f[field]), newWeights);
    if (Math.abs(newBaseline - baseline) < 0.01) break;
    baseline = newBaseline;
  }
  return baseline;
}


function transformToScoreRecords(data) {
    const { source, target_date, city, totalScore, fieldScores, window_days } = data;
    const records = [];

    // 1. 添加总分记录
    if (totalScore !== undefined) {
        records.push({
            source,
            target_date,
            city,
            score_type: 'totalScore',
            score: totalScore,
            window_days
        });
    }

    // 2. 添加各字段分数记录
    if (fieldScores) {
        for (const [score_type, score] of Object.entries(fieldScores)) {
            records.push({
                source,
                target_date,
                city,
                score_type,
                score,
                window_days
            });
        }
    }

    return records;
}
module.exports = {
    getScore,
    setErrors,
    setScore,
    getSourceWeights,
    selfConsistentBaseline
}

// getSingleError("北京");
// getCompreError("北京");
