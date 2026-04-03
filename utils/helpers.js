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


// 计算加权平均值
function weightedAverage(values, weights) {
  const sumWeight = weights.reduce((a, b) => a + b, 0);
  if (sumWeight === 0) return values.reduce((a, b) => a + b, 0) / values.length;
  return +(values.reduce((sum, v, i) => sum + v * weights[i], 0) / sumWeight).toFixed(2);
}

/**
 * 将误差线性映射为 0-100 分
 * @param {number} error - 误差值（>=0）
 * @param {number} maxError - 最大可接受误差，当 error >= maxError 时得 0 分
 * @returns {number} 分数（0-100，保留两位小数）
 */
function fieldErrorToScore(error, maxError) {
  if (maxError <= 0) return error === 0 ? 100 : 0;
  if (error >= maxError) return 0;
  if (error <= 0) return 100;
  const score = 100 * (1 - error / maxError);
  return Math.round(score * 100) / 100;
}
/**
 * 将误差通过指数衰减映射为 0-100 分
 * 公式：score = 100 * exp(-steepness * error / maxError)
 * @param {number} error - 误差值（>=0）
 * @param {number} maxError - 最大可接受误差（当 error >= maxError 时返回 0）
 * @param {number} steepness - 衰减陡峭程度，默认 5。值越大，小误差得分下降越快
 * @returns {number} 分数（0-100，保留两位小数）
 */
function fieldErrorToScoreExp(error, maxError, steepness = 5) {
  if (maxError <= 0) return error === 0 ? 100 : 0;
  if (error >= maxError) return 0;
  if (error <= 0) return 100;
  const score = 100 * Math.exp(-steepness * error / maxError);
  return Math.round(score * 100) / 100;
}
module.exports = { 
  getYesterdayFormatted, 
  isEmptyValue, 
  get_yesterday_formatted, 
  weightedAverage,
  fieldErrorToScore,
  fieldErrorToScoreExp
 }

