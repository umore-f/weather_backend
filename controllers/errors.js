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

  const startParam = req.query["date[start]"];
  const endParam = req.query["date[end]"];
  const singleDateParam = req.query.date;

  // 情况1：明确的范围参数
  if (startParam && endParam) {
    const start = dayjs(startParam);
    const end = dayjs(endParam);
    if (!start.isValid() || !end.isValid()) {
      throw new Error("日期格式错误，请使用 YYYY-MM-DD");
    }
    // 确保 startDate ≤ endDate（数据库查询时使用 BETWEEN startDate AND endDate）
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
 * 获取指定城市、来源、昨天日期的误差记录
 */
async function getError(cityName, source) {
  const dateStr = get_yesterday_formatted();
  const records = await DailyError.findAll({
    where: {
      city: cityName,
      source,
      target_date: dateStr,
    },
  });
  if (!records.length) {
    console.log(`[getError] 未找到记录: ${cityName}, ${source}, ${dateStr}`);
    return [];
  }
  return records.map(record => record.get({ plain: true }));
}

/**
 * 获取指定城市、来源的全部误差记录
 */
async function getAllError(cityName, source) {
  const records = await DailyError.findAll({
    where: { city: cityName, source },
    order: [["target_date", "ASC"]],
  });
  if (!records.length) {
    console.log(`[getAllError] 未找到记录: ${cityName}, ${source}`);
    return [];
  }
  return records.map(record => ({
    cityName: record.city,
    source: record.source,
    targetDate: record.target_date,
    errorType: record.error_type,
    errorValue: record.error_value,
  }));
}

/**
 * 获取指定城市、来源、误差类型的最新一条记录
 */
async function getOneError(city, source) {
  const record = await DailyError.findOne({
    where: { city, source },
    order: [["target_date", "DESC"]],
  });
  if (!record) {
    console.log(`[getOneError] 未找到记录: ${city}, ${source}`);
    return null;
  }
  return record;
}

/**
 * 获取指定城市、日期的所有误差记录（用于 EWMA 计算）
 */
async function getEWMAError(city, target_date) {
  const records = await DailyError.findAll({
    where: { city, target_date },
    order: [["source", "ASC"]],
  });
  if (!records.length) return null;
  return records;
}

// ==================== 路由：/errors ====================
router.get("/errors", async (req, res) => {
  try {
    // 解析参数
    const locations = parseMultiParam(req, "location", ["北京"]);
    const sources = parseMultiParam(req, "source", ["QWeather"]);
    const { startDate, endDate } = parseDateRange(req);

    // 查询数据库
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
 * 获取指定 sources 和 error_type 的误差值统计（按 source 分组）
 * GET /api/errors/statistics
 * Query参数:
 *   source       string|array 必填，支持逗号分隔或多次传入（如 source=QWeather&source=CMA）
 *   error_type   string       必填
 *   start_date   string       可选，开始日期 YYYY-MM-DD
 *   end_date     string       可选，结束日期 YYYY-MM-DD
 */
router.get("/errors/statistics", async (req, res) => {
  try {
    const { error_type, start_date, end_date } = req.query;

    // 1. 解析 source 为数组
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
    if (!error_type) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: error_type" });
    }

    // 2. 解析 city 为数组（可选）
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
    // 如果 cities 有值，则作为过滤条件；否则不限制城市

    // 3. 构建日期过滤条件
    const dateFilter = {};
    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    } else if (start_date) {
      dateFilter[Op.gte] = start_date;
    } else if (end_date) {
      dateFilter[Op.lte] = end_date;
    }

    // 4. 分位数计算函数
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

    // 5. 并发查询每个 source
    const promises = sources.map(async (source) => {
      const where = { source, error_type };
      if (Object.keys(dateFilter).length) {
        where.target_date = dateFilter;
      }
      if (cities.length) {
        where.city = { [Op.in]: cities };
      }

      const records = await DailyError.findAll({
        where,
        attributes: ["error_value"],
        order: [["error_value", "ASC"]],
        raw: true,
      });

      if (!records.length) {
        return { source, data: [] };
      }

      const values = records.map(r => r.error_value);
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
 * 根据城市数组、来源数组、日期范围获取每个来源下各误差类型的平均误差值（聚合所有城市）
 * GET /api/errors/avg-by-fields
 * Query参数:
 *   city         string|array  必填，支持逗号分隔或 city[] 形式
 *   source       string|array  必填，支持逗号分隔或 source[] 形式
 *   date         string        可选，单日期 YYYY-MM-DD
 *   date[start]  string        可选，开始日期 YYYY-MM-DD
 *   date[end]    string        可选，结束日期 YYYY-MM-DD
 * 日期处理规则与 /errors、/score 完全一致
 */
router.get("/errors/avg-by-fields", async (req, res) => {
  try {
    // 解析城市数组（必填）
    let cities = parseMultiParam(req, "city", []);
    if (!cities.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: city" });
    }

    // 解析来源数组（必填）
    let sources = parseMultiParam(req, "source", []);
    if (!sources.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: source" });
    }

    const dateFilter = {};
    const { end_date, start_date } = req.query;
    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    } else if (start_date) {
      dateFilter[Op.gte] = start_date;
    } else if (end_date) {
      dateFilter[Op.lte] = end_date;
    }

    // 聚合查询：按 source 和 error_type 分组，计算平均值（不按 city 分组，实现跨城市聚合）
    const results = await DailyError.findAll({
      where: {
        city: { [Op.in]: cities },
        source: { [Op.in]: sources },
        target_date: dateFilter,
      },
      attributes: [
        "source",
        "error_type",
        [sequelize.fn("AVG", sequelize.col("error_value")), "avg_error_value"],
      ],
      group: ["source", "error_type"],
      raw: true,
    });

    // 转换为按 source 分组的对象：{ source: { error_type: avg_value } }
    const sourceMap = {};
    results.forEach(item => {
      const src = item.source;
      const errorType = item.error_type;
      const avgVal = parseFloat(item.avg_error_value);
      if (!sourceMap[src]) {
        sourceMap[src] = {};
      }
      sourceMap[src][errorType] = avgVal;
    });

    // 转换为最终数组格式
    const formatted = Object.keys(sourceMap).map(source => ({
      source: source,
      data: sourceMap[source]
    }));

    res.json({ code: 200, message: "success", data: formatted });
  } catch (error) {
    console.error("[GET /errors/avg-by-fields] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

/**
 * 多条件查询误差数据（支持分页）
 * GET /api/errors/list
 * Query参数:
 *   city         string|array  可选，支持逗号分隔或 city[]，默认查询所有城市
 *   source       string|array  可选，支持逗号分隔或 source[]，默认查询所有来源
 *   error_type   string|array  可选，支持逗号分隔或 error_type[]，默认查询所有误差类型
 *   date         string        可选，单日期 YYYY-MM-DD
 *   date[start]  string        可选，开始日期 YYYY-MM-DD
 *   date[end]    string        可选，结束日期 YYYY-MM-DD
 *   page         number        可选，页码，默认 1
 *   pageSize     number        可选，每页条数，默认 20
 * 日期处理规则与 /errors、/score 完全一致
 */
router.get("/errors/list", async (req, res) => {
  try {
    // 解析城市、来源、字段、分页、日期（复用之前的代码）
    let cities = parseMultiParam(req, "city", []);
    let sources = parseMultiParam(req, "source", []);
    let errorTypes = parseMultiParam(req, "error_type", []);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize) || 20);
    const offset = (page - 1) * pageSize;
    const dateFilter = {};
    const { end_date, start_date } = req.query;
    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    } else if (start_date) {
      dateFilter[Op.gte] = start_date;
    } else if (end_date) {
      dateFilter[Op.lte] = end_date;
    }
    const where = {};
    if (cities.length) where.city = { [Op.in]: cities };
    if (sources.length) where.source = { [Op.in]: sources };
    if (errorTypes.length) where.error_type = { [Op.in]: errorTypes };
    where.target_date = dateFilter;

    // 排序参数
    const sortField = req.query.sortField;
    const sortOrder = req.query.sortOrder;
    let order = [["target_date", "DESC"], ["city", "ASC"], ["source", "ASC"]];
    if (sortField && sortOrder) {
      const allowed = ['error_value', 'ewma_error', 'city', 'source', 'target_date', 'error_type'];
      if (allowed.includes(sortField)) {
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
        pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) }
      }
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