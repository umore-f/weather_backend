const { Op } = require("sequelize");
const { sequelize } = require("../models");
const express = require("express");
const dayjs = require("dayjs");
const { DailyError, TrustScore } = require("../models");
const { get_yesterday_formatted } = require("../utils/helpers");

const router = express.Router();

/**
 * 解析查询参数中的多值字段（支持逗号分隔字符串或数组）
 * @param {Object} req - Express请求对象
 * @param {string} key - 参数名
 * @param {Array} defaultValue - 默认值
 * @returns {Array} 解析后的数组
 */
function parseMultiParam(req, key, defaultValue = []) {
  let values = [];
  const param = req.query[key];
  const arrayParam = req.query[`${key}[]`];

  if (param) {
    if (typeof param === "string") {
      values = param.split(",").map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(param)) {
      values = param.map(s => s.trim()).filter(Boolean);
    }
  }

  if (!values.length && arrayParam) {
    if (typeof arrayParam === "string") values = [arrayParam];
    else if (Array.isArray(arrayParam)) values = arrayParam;
    values = values.map(s => s.trim()).filter(Boolean);
  }

  return values.length ? values : defaultValue;
}

/**
 * 解析日期范围参数，返回 { startDate, endDate } 两个 YYYY-MM-DD 字符串
 * 规则：
 * - 若提供 date[start] 和 date[end] → 使用该范围（自动交换使 start ≤ end）
 * - 否则若提供 date → 单日查询（start = end = date）
 * - 否则默认最近7天（从昨天往前推6天）
 * @param {Object} req - Express请求对象
 * @returns {{ startDate: string, endDate: string }}
 */
function parseDateRange(req) {
  const startParam = req.query["start_date"];
  const endParam = req.query["end_date"];
  const singleDateParam = req.query.date;

  // 情况1：明确的范围参数
  if (startParam && endParam) {
    const start = dayjs(startParam);
    const end = dayjs(endParam);
    if (!start.isValid() || !end.isValid()) {
      throw new Error("日期格式错误，请使用 YYYY-MM-DD");
    }
    // 确保 startDate ≤ endDate
    const startDate = start.isBefore(end) ? start.format("YYYY-MM-DD") : end.format("YYYY-MM-DD");
    const endDate = start.isBefore(end) ? end.format("YYYY-MM-DD") : start.format("YYYY-MM-DD");
    return { startDate, endDate };
  }

  // 情况2：单一日期的查询
  if (singleDateParam) {
    const parsed = dayjs(singleDateParam);
    if (!parsed.isValid()) {
      throw new Error("日期格式错误，请使用 YYYY-MM-DD");
    }
    const dateStr = parsed.format("YYYY-MM-DD");
    return { startDate: dateStr, endDate: dateStr };
  }

  // 情况3：默认最近7天（从昨天往前推6天，共7天）
  const yesterday = dayjs().subtract(1, "day");
  const sixDaysAgo = yesterday.subtract(6, "day");
  return {
    startDate: sixDaysAgo.format("YYYY-MM-DD"),
    endDate: yesterday.format("YYYY-MM-DD"),
  };
}

/**
 * 获取指定城市、来源、昨天日期的误差记录（宽表）
 * @returns {Promise<Object[]>} 满足条件的 DailyError 实例数组（plain object）
 */
async function getError(cityName, source) {
  const dateStr = get_yesterday_formatted();
  const records = await DailyError.findAll({
    where: {
      city: cityName,
      source,
      target_date: dateStr,
    },
    raw: true,
  });
  if (!records.length) {
    console.log(`[getError] 未找到记录: ${cityName}, ${source}, ${dateStr}`);
    return [];
  }
  return records;
}

/**
 * 获取指定城市、来源的全部误差记录（宽表）
 * @returns {Promise<Object[]>} 按日期升序排列的 plain object 数组
 */
async function getAllError(cityName, source) {
  const records = await DailyError.findAll({
    where: { city: cityName, source },
    order: [["target_date", "ASC"]],
    raw: true,
  });
  if (!records.length) {
    console.log(`[getAllError] 未找到记录: ${cityName}, ${source}`);
    return [];
  }
  return records;
}

/**
 * 获取指定城市、来源的最新一条记录（宽表）
 * @returns {Promise<Object|null>} plain object 或 null
 */
async function getOneError(city, source) {
  const record = await DailyError.findOne({
    where: { city, source },
    order: [["target_date", "DESC"]],
    raw: true,
  });
  if (!record) {
    console.log(`[getOneError] 未找到记录: ${city}, ${source}`);
    return null;
  }
  return record;
}

/**
 * 获取指定城市、日期的所有误差记录（宽表，用于 EWMA 计算）
 * @returns {Promise<Object[]|null>} plain object 数组或 null
 */
async function getEWMAError(city, target_date) {
  const records = await DailyError.findAll({
    where: { city, target_date },
    order: [["source", "ASC"]],
    raw: true,
  });
  if (!records.length) return null;
  return records;
}

// ==================== 路由：/errors ====================
router.get("/errors", async (req, res) => {
  try {
    const locations = parseMultiParam(req, "location", ["北京"]);
    const sources = parseMultiParam(req, "source", ["QWeather"]);
    const { startDate, endDate } = parseDateRange(req);

    const errorsList = await DailyError.findAll({
      where: {
        city: { [Op.in]: locations },
        source: { [Op.in]: sources },
        target_date: { [Op.between]: [startDate, endDate] },
      },
      order: [["target_date", "ASC"]],
    });

    res.json({ code: 200, message: "success", data: errorsList });
  } catch (error) {
    console.error("[GET /errors] 查询失败:", error);
    const status = error.message.includes("日期格式") ? 400 : 500;
    res.status(status).json({ code: status, message: error.message || "服务器内部错误" });
  }
});

/**
 * 获取指定 sources 和 metric 的误差值统计（按 source 分组）
 * GET /api/errors/statistics
 * Query参数:
 *   source       string|array 必填
 *   metric       string       必填 (humidity, precip, pressure, temp, temp_max, temp_min)
 *   city         string|array 可选
 *   start_date   string       可选
 *   end_date     string       可选
 */
router.get("/errors/statistics", async (req, res) => {
  try {
    const { start_date, end_date, metric } = req.query;

    const metricToField = {
      humidity: 'humidity_ewma_error',
      precip: 'precip_ewma_error',
      pressure: 'pressure_ewma_error',
      temp: 'temp_ewma_error',
      temp_max: 'temp_max_ewma_error',
      temp_min: 'temp_min_ewma_error',
    };
    if (!metric || !metricToField[metric]) {
      return res.status(400).json({
        code: 400,
        message: "参数 metric 必须为 humidity, precip, pressure, temp, temp_max, temp_min 之一",
      });
    }
    const targetField = metricToField[metric];

    let sources = [];
    if (req.query.source) {
      if (typeof req.query.source === 'string') {
        sources = req.query.source.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(req.query.source)) {
        sources = req.query.source.map(s => s.trim()).filter(Boolean);
      }
    }
    if (!sources.length && req.query['source[]']) {
      const arr = req.query['source[]'];
      if (typeof arr === 'string') sources = [arr];
      else if (Array.isArray(arr)) sources = arr;
      sources = sources.map(s => s.trim()).filter(Boolean);
    }
    if (!sources.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: source 至少需要一个值" });
    }

    let cities = [];
    if (req.query.city) {
      if (typeof req.query.city === 'string') {
        cities = req.query.city.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(req.query.city)) {
        cities = req.query.city.map(s => s.trim()).filter(Boolean);
      }
    }
    if (!cities.length && req.query['city[]']) {
      const arr = req.query['city[]'];
      if (typeof arr === 'string') cities = [arr];
      else if (Array.isArray(arr)) cities = arr;
      cities = cities.map(s => s.trim()).filter(Boolean);
    }

    const dateFilter = {};
    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    } else if (start_date) {
      dateFilter[Op.gte] = start_date;
    } else if (end_date) {
      dateFilter[Op.lte] = end_date;
    }

    function getQuantile(sortedArr, q) {
      if (sortedArr.length === 0) return null;
      const pos = (sortedArr.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (sortedArr[base + 1] !== undefined) {
        return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
      }
      return sortedArr[base];
    }

    const promises = sources.map(async (source) => {
      const where = { source };
      if (Object.keys(dateFilter).length) {
        where.target_date = dateFilter;
      }
      if (cities.length) {
        where.city = { [Op.in]: cities };
      }

      const records = await DailyError.findAll({
        where,
        attributes: [targetField],
        raw: true,
      });

      let values = records
        .map(record => record[targetField])
        .filter(v => v !== null && v !== undefined);

      if (values.length === 0) {
        return { source, data: [] };
      }

      values.sort((a, b) => a - b);
      const min = values[0];
      const max = values[values.length - 1];
      const median = getQuantile(values, 0.5);
      const q1 = getQuantile(values, 0.25);
      const q3 = getQuantile(values, 0.75);

      return { source, data: [min, q1, median, q3, max] };
    });

    const results = await Promise.all(promises);
    res.json({ code: 200, message: "success", data: results });
  } catch (error) {
    console.error("[GET /errors/statistics] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

/**
 * 聚合查询：按来源分组，返回各气象要素的平均 EWMA 误差
 * GET /api/errors/avg-by-fields
 * Query参数:
 *   city         string|array 必填
 *   source       string|array 必填
 *   日期参数使用 parseDateRange 规则（date, date[start]/date[end], 或默认最近7天）
 */
router.get("/errors/avg-by-fields", async (req, res) => {
  try {
    const cities = parseMultiParam(req, "city", []);
    if (!cities.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: city" });
    }

    const sources = parseMultiParam(req, "source", []);
    if (!sources.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: source" });
    }

    // 获取日期范围并转换为 Sequelize 条件
    const { startDate, endDate } = parseDateRange(req);
    const dateCondition = { [Op.between]: [startDate, endDate] };
  
    const metricFields = {
      humidity: 'humidity_ewma_error',
      precip: 'precip_ewma_error',
      pressure: 'pressure_ewma_error',
      temp: 'temp_ewma_error',
      temp_max: 'temp_max_ewma_error',
      temp_min: 'temp_min_ewma_error',
    };

    const attributes = ['source'];
    for (const [metric, field] of Object.entries(metricFields)) {
      attributes.push([sequelize.fn('AVG', sequelize.col(field)), metric]);
    }

    const where = {
      city: { [Op.in]: cities },
      source: { [Op.in]: sources },
      target_date: dateCondition,
    };

    const results = await DailyError.findAll({
      where,
      attributes,
      group: ['source'],
      raw: true,
    });

    const formatted = results.map(row => {
      const source = row.source;
      const data = {};
      for (const metric of Object.keys(metricFields)) {
        const val = row[metric];
        data[metric] = val !== null && !isNaN(val) ? parseFloat(val) : null;
      }
      return { source, data };
    });

    res.json({ code: 200, message: "success", data: formatted });
  } catch (error) {
    console.error("[GET /errors/avg-by-fields] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});
/**
 * 折线图数据：按数据源分组，每天每个数据源下多城市的平均误差值（聚合）
 * GET /api/errors/trend
 * Query参数:
 *   cities       string|array 必填，支持逗号分隔或 city[]
 *   sources      string|array 必填，支持逗号分隔或 source[]
 *   metric       string       必填，humidity, precip, pressure, temp, temp_max, temp_min
 *   start_date   string       可选，YYYY-MM-DD
 *   end_date     string       可选，YYYY-MM-DD
 *   日期参数也可使用 date/date[start]/date[end] 规则（复用 parseDateRange）
 */
router.get("/errors/trend", async (req, res) => {
  try {
    // 1. 解析必填参数
    const cities = parseMultiParam(req, "city", []);
    if (!cities.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: cities" });
    }

    const sources = parseMultiParam(req, "source", []);
    if (!sources.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: sources" });
    }

    const { metric } = req.query;
    const metricToField = {
      humidity: 'humidity_ewma_error',
      precip: 'precip_ewma_error',
      pressure: 'pressure_ewma_error',
      temp: 'temp_ewma_error',
      temp_max: 'temp_max_ewma_error',
      temp_min: 'temp_min_ewma_error',
    };
    if (!metric || !metricToField[metric]) {
      return res.status(400).json({
        code: 400,
        message: "参数 metric 必须为 humidity, precip, pressure, temp, temp_max, temp_min 之一",
      });
    }
    const targetField = metricToField[metric];

    // 2. 日期范围
    const { startDate, endDate } = parseDateRange(req);
    const dateCondition = { [Op.between]: [startDate, endDate] };
    // 3. 聚合查询：按 source 和 target_date 分组，计算平均值
    const results = await DailyError.findAll({
      where: {
        city: { [Op.in]: cities },
        source: { [Op.in]: sources },
        target_date: dateCondition,
      },
      attributes: [
        'source',
        'target_date',
        [sequelize.fn('AVG', sequelize.col(targetField)), 'avg_value'],
      ],
      group: ['source', 'target_date'],
      order: [['source', 'ASC'], ['target_date', 'ASC']],
      raw: true,
    });

    // 4. 重组数据：按 source 分组，每个 source 下为 { date, value } 数组
    const grouped = new Map(); // source -> array of { date, value }
    for (const row of results) {
      const source = row.source;
      const date = row.target_date;
      const value = row.avg_value !== null ? parseFloat(row.avg_value) : null;
      if (!grouped.has(source)) {
        grouped.set(source, []);
      }
      grouped.get(source).push({ date, value });
    }

    // 5. 转换为最终数组格式
    const data = Array.from(grouped.entries()).map(([source, points]) => ({
      source,
      data: points,
    }));

    res.json({ code: 200, message: "success", data });
  } catch (error) {
    console.error("[GET /errors/trend] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

/**
 * 热力图数据：按城市和来源分组，返回指定指标的平均误差值
 * GET /api/errors/heatmap
 * Query参数:
 *   cities       string|array 必填，支持逗号分隔或 city[]
 *   sources      string|array 必填，支持逗号分隔或 source[]
 *   metric       string       必填，humidity, precip, pressure, temp, temp_max, temp_min
 *   日期参数可选，复用 parseDateRange 规则（默认最近7天）
 */
router.get("/errors/heatmap", async (req, res) => {
  try {
    // 1. 解析必填参数
    const cities = parseMultiParam(req, "city", []);
    if (!cities.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: cities" });
    }

    const sources = parseMultiParam(req, "source", []);
    if (!sources.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: sources" });
    }

    const { metric } = req.query;
    const metricToField = {
      humidity: 'humidity_ewma_error',
      precip: 'precip_ewma_error',
      pressure: 'pressure_ewma_error',
      temp: 'temp_ewma_error',
      temp_max: 'temp_max_ewma_error',
      temp_min: 'temp_min_ewma_error',
    };
    if (!metric || !metricToField[metric]) {
      return res.status(400).json({
        code: 400,
        message: "参数 metric 必须为 humidity, precip, pressure, temp, temp_max, temp_min 之一",
      });
    }
    const targetField = metricToField[metric];

    // 2. 日期范围
    const { startDate, endDate } = parseDateRange(req);
    const dateCondition = { [Op.between]: [startDate, endDate] };

    // 3. 聚合查询：按 city 和 source 分组，计算平均值
    // 聚合查询：按 city 和 source 分组，计算绝对值后的平均值
    const results = await DailyError.findAll({
      where: {
        city: { [Op.in]: cities },
        source: { [Op.in]: sources },
        target_date: dateCondition,
      },
      attributes: [
        'city',
        'source',
        [sequelize.fn('AVG', sequelize.fn('ABS', sequelize.col(targetField))), 'avg_value'],
      ],
      group: ['city', 'source'],
      order: [['city', 'ASC'], ['source', 'ASC']],
      raw: true,
    });

    // 4. 格式化输出：过滤掉 avg_value 为 null 的记录（如果某组全部为 null）
    const data = results
      .filter(row => row.avg_value !== null)
      .map(row => ({
        city: row.city,
        source: row.source,
        avg_value: parseFloat(row.avg_value),
      }));

    res.json({ code: 200, message: "success", data });
  } catch (error) {
    console.error("[GET /errors/heatmap] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

/**
 * 多条件查询误差数据（支持分页，返回宽表原始数据）
 * GET /api/errors/list
 * Query参数:
 *   city         string|array 可选
 *   source       string|array 可选
 *   page         number       默认1
 *   pageSize     number       默认20
 *   sortField    string       可选，模型中的任意字段
 *   sortOrder    ASC/DESC     可选
 *   日期参数使用 parseDateRange 规则
 */
router.get("/errors/list", async (req, res) => {
  try {
    const cities = parseMultiParam(req, "city", []);
    const sources = parseMultiParam(req, "source", []);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize) || 20);
    const offset = (page - 1) * pageSize;

    const where = {};
    if (cities.length) where.city = { [Op.in]: cities };
    if (sources.length) where.source = { [Op.in]: sources };

    // 日期范围处理
    const { startDate, endDate } = parseDateRange(req);
    where.target_date = { [Op.between]: [startDate, endDate] };

    const sortField = req.query.sortField;
    const sortOrder = req.query.sortOrder;
    let order = [['target_date', 'DESC'], ['city', 'ASC'], ['source', 'ASC']];
    if (sortField && sortOrder) {
      const modelAttributes = Object.keys(DailyError.getAttributes());
      if (modelAttributes.includes(sortField)) {
        const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        order = [[sortField, direction]];
      }
    }

    const { count, rows } = await DailyError.findAndCountAll({
      where,
      order,
      offset,
      limit: pageSize,
      raw: true,
    });

    res.json({
      code: 200,
      message: "success",
      data: {
        list: rows,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("[GET /errors/list] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

module.exports = {
  getError,
  getOneError,
  getAllError,
  getEWMAError,
  router,
};