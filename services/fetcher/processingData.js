const { getOneError } = require('../../controllers/errors')
const { fieldErrorToScoreExp, fieldErrorToScore } = require('../../utils/helpers')
// 先取中位数获得基本真实值
function getRobustRealValue(values) {
  // 转换为数字，过滤掉无法转换的（如 null, undefined, 非数字字符串）
  const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
  
  if (numericValues.length === 0) return null;
  if (numericValues.length === 1) return numericValues[0];
  
  const sorted = [...numericValues].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    if (sorted[mid - 1] + sorted[mid] === 0) return 0;
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  
  return sorted[mid];
}
// 计算权重 -> 融合数据 -> 不再使用中位数 
async function getSourceWeights(city, sources, field, fieldConfigs) {
  const weights = [];
  for (const source of sources) {
    const latest = await getOneError(city, source)
    const ewma = latest ? latest[`${field}_ewma_error`] : (fieldConfigs[field].maxError / 2);
    weights.push(1 / (ewma + 1e-6));
  }
  return weights;
}

// 计算新的 EWMA 值（纯函数）
function computeNewEWMA(newError, previousEWMA, alpha, defaultEWMA) {
  console.log("!!!!!!!!!!!!!!",previousEWMA);
  
  if (previousEWMA === null) {
    // 默认初始值是最大值的一半
    const initEWMA = defaultEWMA / 2;
    
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
    const { maxError, weight } = config;
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
function calculateErrors(realData, forecastDataArray) {
  const { city: realCity, targetDate: realTargetDate } = realData;

  const diff = (pred, real) => (pred != null && real != null ? pred - real : null);

  const errors = [];
  for (const fc of forecastDataArray) {
    if (fc.city !== realCity || fc.forecast_time !== realTargetDate) continue;

    errors.push({
      city: fc.city,
      source: fc.source,
      target_date: fc.forecast_time,
      error_values: {
        temp: diff(fc.temp, realData.temp),
        temp_ewma_error: null,
        temp_max: diff(fc.temp_max, realData.temp_max),
        temp_max_ewma_error: null,
        temp_min: diff(fc.temp_min, realData.temp_min),
        temp_min_ewma_error: null,
        humidity: diff(fc.humidity, realData.humidity),
        humidity_ewma_error: null,
        precip: diff(fc.precip, realData.precip),
        precip_ewma_error: null,
        pressure: diff(fc.pressure, realData.pressure),
        pressure_ewma_error: null,
      }

    });
  }
  return errors;
}

module.exports = {
  getRobustRealValue,
  computeNewEWMA,
  getSourceWeights,
  isValidWeatherValue,
  calculateNormalizedAverageError,
  calculateErrors
}