const { getOneError } = require('../../controllers/errorScore')
const { fieldErrorToScoreExp, fieldErrorToScore } = require('../../utils/helpers')
// 先取中位数获得基本真实值
function getRobustRealValue(values) {
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

// 计算权重 -> 融合数据 -> 不再使用中位数 
async function getSourceWeights(city, sources, field, fieldConfigs) {
  const weights = [];
  for (const src of sources) {
    const latest = await getOneError(city, src, field)
    const ewma = latest ? latest.ewma_error : (fieldConfigs[field].maxError / 2);
    weights.push(1 / (ewma + 1e-6));
  }
  return weights;
}

// 计算新的 EWMA 值（纯函数）
function computeNewEWMA(newError, previousEWMA, alpha, defaultMaxError) {
  if (previousEWMA === null) {   // 第一条记录
    const initEWMA = defaultMaxError / 2;
    return alpha * newError + (1 - alpha) * initEWMA;
  }
  return alpha * newError + (1 - alpha) * previousEWMA;
}
// 判断字段是否为空且极值是否合理
function isValidWeatherValue(field, value) {
  if (value === null || value === undefined || isNaN(value)) return false;
  switch (field) {
    case 'temp':
    case 'tempMax':
    case 'tempMin':
      return value > -50 && value < 60;
    case 'humidity':
      return value >= 0 && value <= 100;
    case 'precip':
      return value >= 0 && value < 500;
    case 'pressure':
      return value > 800 && value < 1100;
    default:
      return true;
  }
}
// 计算得分
function calculateNormalizedAverageError({ errors, source, target_date, city }, fieldConfigs, options = {}) {
  const { mode = 'linear', steepness = 5, window_days = 7 } = options;
  let totalScore = 0, totalWeight = 0;
  const fieldScores = {};

  for (const [field, error] of Object.entries(errors)) {
    const config = fieldConfigs[field];
    if (!config) {
      console.warn(`缺少字段: ${field}`);
      continue;
    }
    const { maxError, weight = 1 } = config;
    let score;
    if (mode === 'exponential') {
      score = fieldErrorToScoreExp(error, maxError, steepness);
    } else {
      score = fieldErrorToScore(error, maxError);
    }
    fieldScores[field] = score;
    totalScore += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return { source, target_date, city, totalScore: 0, fieldScores: {}, window_days };
  const total = totalScore / totalWeight;
  return { source, target_date, city, totalScore: Math.round(total * 100) / 100, fieldScores, window_days };
}
// 误差计算
function evaluateFieldCredibility(field, realData, sources) {
  const realValue = realData[field];
  if (realValue === null || realValue === undefined) {
    throw new Error(`真实数据中缺少字段 ${field} 或值为 null`);
  }

  const results = sources.map(source => {
    const pred = source[field];
    let error = null;
    if (pred !== null && pred !== undefined) {
      error = Number(Math.abs(pred - realValue).toFixed(2));
    }
    return {
      city: source.cityName,
      target_date: source.forecastTime,
      source: source.source,
      error_value: error,
      error_type: field
    };
  }).filter(item => item.error_value !== null); // 只保留有预报值的源

  results.sort((a, b) => a.error_value - b.error_value);
  return results;
}
module.exports = {
  getRobustRealValue,
  computeNewEWMA,
  getSourceWeights,
  isValidWeatherValue,
  calculateNormalizedAverageError,
  evaluateFieldCredibility
}