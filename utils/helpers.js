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
// 使用
console.log(getYesterdayFormatted()); // 例如：20260320（假设今天是2026-03-21）
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
function filterOutliersByMaxDeviation(values, thresholdRatio = 0.5) {
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
module.exports = { getYesterdayFormatted, isEmptyValue, filterOutliersByMaxDeviation}

