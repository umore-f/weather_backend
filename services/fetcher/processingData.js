

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
    return { sourceName: source.sourceName, totalError, avgError, validFields: validCount };
  });

  results.sort((a, b) => a.avgError - b.avgError);
  return results;
}
/**
 * 评估单个字段的可信度（单日）单个字段的误差值
 * @param {string} field - 字段名，如 'temp'
 * @param {Object} realData - 真实值（需包含该字段）
 * @param {Array} sources - 预报源列表
 * @returns {Array} 按误差升序排列的预报源列表，每个元素包含 sourceName 和 error
 */
function evaluateFieldCredibility(field, realData, sources) {
  const realValue = realData[field];
  if (realValue === null || realValue === undefined) {
    throw new Error(`真实数据中缺少字段 ${field} 或值为 null`);
  }

  const results = sources.map(source => {
    const pred = source[field];
    let error = null;
    if (pred !== null && pred !== undefined) {
      error = Math.abs(pred - realValue);
    }
    return { sourceName: source.sourceName, error };
  }).filter(item => item.error !== null); // 只保留有预报值的源

  results.sort((a, b) => a.error - b.error);
  return results;
}
// ========================= 多日累积评估（支持周期） =========================
/**
 * 多日累积评估预报源准确度（支持固定周期或滑动窗口）
 * @param {Array} dailyReal - 真实值列表，格式 [{ date, data: { temp, tempMax, tempMin, humidity, precip, pressure } }]
 * @param {Array} dailyForecasts - 预报值列表，格式 [{ date, sourceName, data: { temp, tempMax, tempMin, humidity, precip, pressure } }]
 * @param {Object} options - 配置项
 * @param {number} options.periodDays - 周期天数，默认7
 * @param {boolean} options.useSliding - 是否使用滑动窗口（true: 每次移动1天计算窗口内平均误差，false: 固定周期分组），默认false
 * @param {Object} options.weights - 字段权重，默认等权
 * @returns {Array} 各源在各周期的平均误差统计
 */
function evaluateMultiDay(dailyReal, dailyForecasts, options = {}) {
  const { periodDays = 7, useSliding = false, weights = null } = options;

  // 建立真实值映射
  const realMap = new Map();
  dailyReal.forEach(item => realMap.set(item.date, item.data));

  // 按预报源分组
  const sourceForecasts = new Map();
  dailyForecasts.forEach(item => {
    if (!sourceForecasts.has(item.sourceName)) {
      sourceForecasts.set(item.sourceName, []);
    }
    sourceForecasts.get(item.sourceName).push({ date: item.date, data: item.data });
  });

  // 获取所有日期并排序
  const allDates = [...new Set([...realMap.keys(), ...dailyForecasts.map(f => f.date)])].sort();

  // 单日误差计算
  const computeDailyError = (realData, forecastData, weights) => {
    const defaultWeights = { temp: 1, tempMax: 1, tempMin: 1, humidity: 1, precip: 1, pressure: 1 };
    const w = weights || defaultWeights;
    let totalError = 0;
    let validCount = 0;
    const fields = ['temp', 'tempMax', 'tempMin', 'humidity', 'precip', 'pressure'];
    for (const field of fields) {
      const pred = forecastData[field];
      const real = realData[field];
      if (pred !== null && real !== null && !isNaN(pred) && !isNaN(real)) {
        totalError += Math.abs(pred - real) * (w[field] || 1);
        validCount++;
      }
    }
    return validCount > 0 ? totalError / validCount : null;
  };

  // 构建每日误差表（source -> [{ date, error }]）
  const dailyErrors = new Map();
  for (const [sourceName, forecasts] of sourceForecasts.entries()) {
    const errList = [];
    for (const { date, data } of forecasts) {
      const realData = realMap.get(date);
      if (realData) {
        const err = computeDailyError(realData, data, weights);
        if (err !== null) {
          errList.push({ date, error: err });
        }
      }
    }
    dailyErrors.set(sourceName, errList);
  }

  // 生成周期
  const periods = [];
  if (!useSliding) {
    // 固定周期分组
    for (let i = 0; i < allDates.length; i += periodDays) {
      const startDate = allDates[i];
      const endDate = allDates[Math.min(i + periodDays - 1, allDates.length - 1)];
      periods.push({ start: startDate, end: endDate, dates: allDates.slice(i, i + periodDays) });
    }
  } else {
    // 滑动窗口
    for (let i = 0; i + periodDays <= allDates.length; i++) {
      const windowDates = allDates.slice(i, i + periodDays);
      periods.push({
        start: windowDates[0],
        end: windowDates[windowDates.length - 1],
        dates: windowDates,
      });
    }
  }

  // 为每个源计算每个周期的平均误差
  const results = [];
  for (const [sourceName, errList] of dailyErrors.entries()) {
    const periodErrors = periods.map(period => {
      const periodErrors = errList
        .filter(item => period.dates.includes(item.date))
        .map(item => item.error);
      if (periodErrors.length === 0) return null;
      const avgError = periodErrors.reduce((a, b) => a + b, 0) / periodErrors.length;
      return {
        period: `${period.start} ~ ${period.end}`,
        avgError,
        daysCount: periodErrors.length,
      };
    }).filter(p => p !== null);
    results.push({ sourceName, periodErrors });
  }

  return results;
}

module.exports = {
  evaluateSources,
  evaluateFieldCredibility,
  evaluateMultiDay
}