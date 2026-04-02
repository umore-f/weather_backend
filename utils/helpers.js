// 通用辅助函数

// 转化为和风天气需要的日期格式
function getYesterdayFormatted() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
function get_yesterday_formatted() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
// 判断空值工具函数
function isEmptyValue(value) {
  return value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value));
}
/**
 * 剔除数组中离均值最远的一个值（如果该值与均值的绝对差超过阈值比例）
 * @param {number[]} values - 数值数组
 * @param {number} thresholdRatio - 与均值的差占均值的比例，例如0.5表示偏差超过50%则剔除
 * @returns {number[]} 过滤后的数组
 */
function filterOutliersByMaxDeviation(values, thresholdRatio = 0.4) {
  if (values.length < 3) return values; // 样本太少，不过滤
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  // 找出偏离最大的索引
  let maxDev = -Infinity;
  let maxIdx = -1;
  values.forEach((v, idx) => {
    const dev = Math.abs(v - mean);
    if (dev > maxDev) {
      maxDev = dev;
      maxIdx = idx;
    }
  });
  // 如果最大偏差超过阈值，则剔除该点
  if (maxDev > Math.abs(mean) * thresholdRatio) {
    return values.filter((_, idx) => idx !== maxIdx);
  }
  return values;
}
/**
 * 校验单个天气字段的值是否在合理范围内
 * @param {string} field - 字段名 (temp, humidity, precip, pressure 等)
 * @param {number} value - 待校验的值
 * @returns {boolean}
 */
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
// 线性计算分数
function errorToScore(error, maxErrorBound = 1) {
  // 线性映射：error >= maxErrorBound 得0分，error=0得100分
  if (error >= maxErrorBound) return 0;
  return 100 * (1 - error / maxErrorBound);
}
/**
 * 根据各字段误差计算综合平均分数（归一化后）
 * @param {Object} param0 - { errors, source, target_date, city }
 * @param {Object} fieldConfigs - 各字段配置：{ maxError, weight }
 * @returns {Object} { source, target_date, city, totalScore, fieldScores, window_days }
 */
function calculateNormalizedAverageError({ errors, source, target_date, city }, fieldConfigs) {
  let totalScore = 0;
  let totalWeight = 0;
  const fieldScores = {};

  for (const [field, error] of Object.entries(errors)) {
    const config = fieldConfigs[field];
    if (!config) continue;
    const { maxError, weight = 1 } = config;
    const score = fieldErrorToScore(error, maxError);
    fieldScores[field] = score;
    totalScore += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return { source, target_date, city, totalScore: 0, fieldScores: {}, window_days: 7 };
  }
  const total = totalScore / totalWeight;
  const roundedTotal = Math.round(total * 100) / 100;
  return { source, target_date, city, totalScore: roundedTotal, fieldScores, window_days: 7 };
}
/**
 * 将单个字段的误差映射为分数（0-100）
 * @param {number} error - 该字段的误差
 * @param {number} maxError - 最大可接受误差，误差 ≥ 此值得 0 分
 * @param {string} mode - 'linear' 或 'exponential'，默认 'linear'
 * @param {number} steepness - 仅当 mode='exponential' 时有效，默认 5
 * @returns {number}
 */
function fieldErrorToScore(error, maxError, mode = 'linear', steepness = 5) {
  if (maxError <= 0) return error === 0 ? 100 : 0;
  if (error >= maxError) return 0;
  if (error <= 0) return 100;
  
  if (mode === 'exponential') {
    // 分数 = 100 * exp(-steepness * error / maxError)
    const score = 100 * Math.exp(-steepness * error / maxError);
    return Math.round(score * 100) / 100;
  } else {
    // 线性
    const score = 100 * (1 - error / maxError);
    return Math.round(score * 100) / 100;
  }
}
function weightedAverage(values, weights) {
  const sumWeight = weights.reduce((a, b) => a + b, 0);
  if (sumWeight === 0) return values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v, i) => sum + v * weights[i], 0) / sumWeight;
}
module.exports = { 
  getYesterdayFormatted, 
  isEmptyValue, 
  filterOutliersByMaxDeviation, 
  get_yesterday_formatted, 
  calculateNormalizedAverageError, 
  errorToScore, 
  fieldErrorToScore,
  weightedAverage
 }

