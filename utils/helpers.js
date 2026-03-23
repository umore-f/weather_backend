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
// 线性计算分数
function errorToScore(error, maxErrorBound = 1) {
  // 线性映射：error >= maxErrorBound 得0分，error=0得100分
  if (error >= maxErrorBound) return 0;
  return 100 * (1 - error / maxErrorBound);
}
/**
 * 根据各字段误差计算综合平均误差（归一化后）
 * @param {Object} errors - 各字段误差值，例如 { temp: 1.5, tempMax: 2.0, tempMin: 1.8, humidity: 5, precip: 0.2, pressure: 3 }
 * @param {Object} fieldConfigs - 各字段的配置，包括 maxError（该字段允许的最大误差，用于归一化）和 weight（权重）
 * @returns {number} 综合平均误差（值越小越好，通常在0-1之间，但可能超过1如果误差超过maxError）
 */
function calculateNormalizedAverageError({ errors, source, target_date, city }, fieldConfigs) {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [field, error] of Object.entries(errors)) {
    let totalScore = 0;
    let totalWeight = 0;
    const fieldScores = {};

    for (const [field, error] of Object.entries(errors)) {
      const config = fieldConfigs[field];
      if (!config) continue;
      const { maxError, weight = 1 } = config;
      // 使用线性映射计算该字段分数（假设 fieldErrorToScore 已定义）
      const score = fieldErrorToScore(error, maxError);
      fieldScores[field] = score;          // 记录单个字段分数
      totalScore += score * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) {
      return { totalScore: 0, fieldScores: {} };
    }
    const total = totalScore / totalWeight;
    // 可选：保留两位小数
    const roundedTotal = Math.round(total * 100) / 100;
    return { source, target_date, city, totalScore: roundedTotal, fieldScores, window_days:7 };
  }
}
  /**
   * 将单个字段的误差映射为分数（0-100）
   * @param {number} error - 该字段的误差（例如平均绝对误差）
   * @param {number} maxError - 最大可接受误差，误差 ≥ 此值得 0 分
   * @returns {number} 分数（0-100，保留两位小数）
   */
  function fieldErrorToScore(error, maxError) {
    if (maxError <= 0) return error === 0 ? 100 : 0;  // 边界处理
    if (error >= maxError) return 0;
    if (error <= 0) return 100;
    const score = 100 * (1 - error / maxError);
    return Math.round(score * 100) / 100; // 保留两位小数
  }
  module.exports = { getYesterdayFormatted, isEmptyValue, filterOutliersByMaxDeviation, get_yesterday_formatted, calculateNormalizedAverageError, errorToScore, fieldErrorToScore }

