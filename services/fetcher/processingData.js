
const { filterOutliersByMaxDeviation, isEmptyValue} = require('../../utils/helpers')
const { getHistoryWeather } = require('../../controllers/weatherController')

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
// ========================= 单日评估 =========================
/**
 * 计算各预报源相对于真实值的误差（单日）总值
 * @param {Object} realData - 真实值 { temp, tempMax, tempMin, humidity, precip, pressure }
 * @param {Array} sources - 预报源列表，每个元素为 { sourceName, temp, tempMax, tempMin, humidity, precip, pressure }
 * @param {Object} weights - 可选，各字段权重（默认等权）
 * @returns {Array} 排序后的误差列表（误差小的排在前面）
 */
function evaluateSources(realData, sources, weights = null) {
  const defaultWeights = { temp: 3, tempMax: 2, tempMin: 2, humidity: 2, precip: 2, pressure: 1 };
  const w = weights || defaultWeights;

  const absError = (pred, real) => {
    if (pred === null || real === null) return null;
    return Math.abs(pred - real);
  };

  const results = sources.map(source => {
    let totalError = 0;
    let validCount = 0;
    const fields = ['temp', 'tempMax', 'tempMin', 'humidity', 'precip', 'pressure'];

    for (const field of fields) {
      const err = absError(source[field], realData[field]);
      if (err !== null) {
        totalError += err * w[field];
        validCount++;
      }
    }

    const avgError = validCount > 0 ? totalError / validCount : Infinity;
    return { city:source.cityName, target_date:source.forecastTime, source: source.source, total_error: Number(totalError.toFixed(2)), avg_error: Number(avgError.toFixed(2)), valid_fields: validCount };
  });

  results.sort((a, b) => a.avg_error - b.avg_error);
  return results;
}
/**
 * 评估单个字段的可信度（单日）单个字段的误差值
 * @param {string} field - 字段名
 * @param {Object} realData - 真实值（需包含该字段）
 * @param {Array} sources - 预报源列表
 * @returns {Array} 按误差升序排列的预报源列表，每个元素包含 sourceName 和 error
 */
function evaluateFieldCredibility(field, realData, sources) {
  const realValue = realData[0][field];
  if (realValue === null || realValue === undefined) {
    throw new Error(`真实数据中缺少字段 ${field} 或值为 null`);
  }

  const results = sources.map(source => {
    const pred = source[field];
    let error = null;
    if (pred !== null && pred !== undefined) {
      error = Number(Math.abs(pred - realValue).toFixed(2));
    }
    return { city:source.cityName, target_date: source.forecastTime, source: source.source, error_value: error, error_type:field };
  }).filter(item => item.error !== null); // 只保留有预报值的源

  results.sort((a, b) => a.error - b.error);
  return results;
}

// 计算新的 EWMA 值（纯函数）
function computeNewEWMA(newError, previousEWMA, alpha, defaultMaxError) {
  if (previousEWMA === null) {   // 第一条记录
    const initEWMA = defaultMaxError / 2;
    return alpha * newError + (1 - alpha) * initEWMA;
  }
  return alpha * newError + (1 - alpha) * previousEWMA;
}

module.exports = {
  evaluateSources,
  evaluateFieldCredibility,
  getRobustRealValue,
  computeNewEWMA
}