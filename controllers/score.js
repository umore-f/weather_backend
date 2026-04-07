const { Op } = require("sequelize");
const { sequelize } = require("../models");
const express = require("express");
const dayjs = require("dayjs");
const { DailyError, TrustScore } = require("../models");
const { get_yesterday_formatted } = require("../utils/helpers");

const router = express.Router();

// ==================== 辅助函数：参数解析 ====================
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

// ==================== 原有的导出函数（保持接口不变，优化内部实现） ====================

// ==================== 路由：/score ====================
router.get("/score", async (req, res) => {
  try {
    const locations = parseMultiParam(req, "location", ["北京"]);
    const sources = parseMultiParam(req, "source", ["QWeather"]);
    const dateFilter = {};
    const { end_date, start_date } = req.query;

    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    } else if (start_date) {
      dateFilter[Op.gte] = start_date;
    } else if (end_date) {
      dateFilter[Op.lte] = end_date;
    }

    const scoreList = await TrustScore.findAll({
      where: {
        city: { [Op.in]: locations },
        source: { [Op.in]: sources },
        target_date: dateFilter,
      },
      order: [["target_date", "ASC"]],
    });

    res.json({ code: 200, message: "success", data: scoreList });
  } catch (error) {
    console.error("[GET /score] 查询失败:", error);
    const status = error.message.includes("日期格式") ? 400 : 500;
    res.status(status).json({ code: status, message: error.message || "服务器内部错误" });
  }
});
/**
 * 获取多城市、多来源、日期范围内的总分平均值排序（按来源分组）
 * GET /api/score/avg-by-source
 * Query参数:
 *   city         string|array  必填，支持逗号分隔或 city[] 形式
 *   source       string|array  可选，支持逗号分隔或 source[]，默认查询所有来源
 *   date         string        可选，单日期 YYYY-MM-DD
 *   date[start]  string        可选，开始日期
 *   date[end]    string        可选，结束日期
 * 日期处理规则与 /score 完全一致
 * 返回数据按 avg_total_score 从高到低排序
 */
router.get("/score/avg-by-source", async (req, res) => {
  try {
    // 解析城市数组（必填）
    let cities = parseMultiParam(req, "city", []);
    if (!cities.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: city" });
    }

    // 解析来源数组（可选）
    let sources = parseMultiParam(req, "source", []);

    const dateFilter = {};
    const { end_date, start_date } = req.query;

    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    } else if (start_date) {
      dateFilter[Op.gte] = start_date;
    } else if (end_date) {
      dateFilter[Op.lte] = end_date;
    }

    // 构建 where 条件
    const where = {
      city: { [Op.in]: cities },
      target_date: dateFilter
    };
    if (sources.length) {
      where.source = { [Op.in]: sources };
    }

    // 聚合查询：按 source 分组，计算 total_score 平均值
    const results = await TrustScore.findAll({
      where,
      attributes: [
        "source",
        [sequelize.fn("AVG", sequelize.col("total_score")), "avg_total_score"]
      ],
      group: ["source"],
      order: [[sequelize.fn("AVG", sequelize.col("total_score")), "DESC"]],
      raw: true
    });

    // 格式化输出
    const formatted = results.map(item => ({
      source: item.source,
      avg_total_score: parseFloat(item.avg_total_score)
    }));

    res.json({ code: 200, message: "success", data: formatted });
  } catch (error) {
    console.error("[GET /score/avg-by-source] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});
/**
 * 获取多城市、多来源、日期范围内的总分平均值（按来源+日期分组）
 * GET /api/score/avg-by-source-date
 * Query参数:
 *   city         string|array  必填，支持逗号分隔或 city[] 形式
 *   source       string|array  可选，支持逗号分隔或 source[]，默认查询所有来源
 *   date         string        可选，单日期 YYYY-MM-DD
 *   date[start]  string        可选，开始日期
 *   date[end]    string        可选，结束日期
 * 日期处理规则与 /score 完全一致
 * 返回数据按 source, target_date 升序排列
 */
router.get("/score/avg-by-source-date", async (req, res) => {
  try {
    // 解析城市数组（必填）
    let cities = parseMultiParam(req, "city", []);
    if (!cities.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: city" });
    }

    // 解析来源数组（可选）
    let sources = parseMultiParam(req, "source", []);

    // 解析日期范围

    const dateFilter = {};
    const { end_date, start_date } = req.query;

    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    } else if (start_date) {
      dateFilter[Op.gte] = start_date;
    } else if (end_date) {
      dateFilter[Op.lte] = end_date;
    }

    // 构建 where 条件
    const where = {
      city: { [Op.in]: cities },
      target_date: dateFilter
    };
    if (sources.length) {
      where.source = { [Op.in]: sources };
    }

    // 需要计算平均值的字段列表
    const scoreFields = [
      'total_score',
      'humidity_score',
      'precip_score',
      'pressure_score',
      'temp_score',
      'temp_max_score',
      'temp_min_score'
    ];

    // 构建 attributes，为每个字段添加 AVG 聚合
    const attributes = [
      "source",
      "target_date",
      ...scoreFields.map(field => [
        sequelize.fn("AVG", sequelize.col(field)),
        `avg_${field}`
      ])
    ];

    // 执行聚合查询
    const results = await TrustScore.findAll({
      where,
      attributes,
      group: ["source", "target_date"],
      order: [
        ["source", "ASC"],
        ["target_date", "ASC"]
      ],
      raw: true
    });

    // 格式化输出，将平均值转为数字
    const formatted = results.map(item => {
      const resultItem = { source: item.source, target_date: item.target_date };
      scoreFields.forEach(field => {
        const avgKey = `avg_${field}`;
        resultItem[avgKey] = parseFloat(item[avgKey]) ?? null;
      });
      return resultItem;
    });

    res.json({ code: 200, message: "success", data: formatted });
  } catch (error) {
    console.error("[GET /score/avg-by-source-date] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});
/**
 * 获取每个数据来源在日期范围内的总体平均得分（跨城市、跨日期）
 * GET /score/avg-by-source-all
 * Query参数:
 *   city         string|array  必填，支持逗号分隔或 city[] 形式
 *   source       string|array  可选，支持逗号分隔或 source[]，默认查询所有来源
 *   date         string        可选，单日期 YYYY-MM-DD
 *   date[start]  string        可选，开始日期
 *   date[end]    string        可选，结束日期
 * 日期处理规则与其他接口一致
 * 返回数据：每个 source 的 avg_total_score, avg_humidity_score, ... 等字段
 */
router.get("/score/avg-by-source-all", async (req, res) => {
  try {
    // 解析城市数组（必填）
    let cities = parseMultiParam(req, "city", []);
    if (!cities.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: city" });
    }

    // 解析来源数组（可选）
    let sources = parseMultiParam(req, "source", []);

    // 解析日期范围
    const dateFilter = {};
    const { end_date, start_date } = req.query;

    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    } else if (start_date) {
      dateFilter[Op.gte] = start_date;
    } else if (end_date) {
      dateFilter[Op.lte] = end_date;
    }

    // 构建 where 条件
    const where = {
      city: { [Op.in]: cities },
      target_date: dateFilter
    };
    if (sources.length) {
      where.source = { [Op.in]: sources };
    }

    // 需要计算平均值的字段列表
    const scoreFields = [
      'total_score',
      'humidity_score',
      'precip_score',
      'pressure_score',
      'temp_score',
      'temp_max_score',
      'temp_min_score'
    ];

    // 构建 attributes，为每个字段添加 AVG 聚合
    const attributes = [
      "source",
      ...scoreFields.map(field => [
        sequelize.fn("AVG", sequelize.col(field)),
        `avg_${field}`
      ])
    ];

    // 聚合查询：只按 source 分组，不按日期分组
    const results = await TrustScore.findAll({
      where,
      attributes,
      group: ["source"],
      order: [["source", "ASC"]],
      raw: true
    });

    // 格式化输出，将平均值转为数字
    const formatted = results.map(item => {
      const obj = { source: item.source };
      scoreFields.forEach(field => {
        const avgKey = `avg_${field}`;
        obj[avgKey] = parseFloat(item[avgKey]) ?? null;
      });
      return obj;
    });

    res.json({ code: 200, message: "success", data: formatted });
  } catch (error) {
    console.error("[GET /score/avg-by-source-all] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});
/**
 * 获取每个城市、来源、日期下的各维度得分（用于平行坐标图）
 * GET /score/detail
 * Query参数:
 *   city         string|array  可选，默认所有城市
 *   source       string|array  可选，默认所有来源
 *   date         string        可选
 *   date[start]  string        可选
 *   date[end]    string        可选
 * 返回数据：每条记录包含 city, source, target_date, total_score, humidity_score, ...
 */
router.get("/score/detail", async (req, res) => {
  try {
    let cities = parseMultiParam(req, "city", []);
    let sources = parseMultiParam(req, "source", []);
    let startDate, endDate;
    // 解析日期范围
    const dateFilter = {};
    const { end_date, start_date } = req.query;

    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    } else if (start_date) {
      dateFilter[Op.gte] = start_date;
    } else if (end_date) {
      dateFilter[Op.lte] = end_date;
    }

    const where = {
      target_date: dateFilter
    };
    if (cities.length) where.city = { [Op.in]: cities };
    if (sources.length) where.source = { [Op.in]: sources };

    const results = await TrustScore.findAll({
      where,
      order: [["target_date", "ASC"], ["city", "ASC"], ["source", "ASC"]],
      raw: true
    });

    res.json({ code: 200, message: "success", data: results });
  } catch (error) {
    console.error("[GET /score/detail] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});
/**
 * 多条件查询得分数据（支持排序和分页）
 * GET /score/list
 * Query参数:
 *   city         string|array  可选，支持逗号分隔或 city[]，默认所有城市
 *   source       string|array  可选，支持逗号分隔或 source[]，默认所有来源
 *   date         string        可选，单日期 YYYY-MM-DD
 *   date[start]  string        可选，开始日期
 *   date[end]    string        可选，结束日期
 *   sortField    string        可选，排序字段，默认 'target_date'
 *   sortOrder    string        可选，'asc' 或 'desc'，默认 'desc'
 *   page         number        可选，页码，默认 1
 *   pageSize     number        可选，每页条数，默认 20
 * 日期处理规则与 /score 一致
 */
router.get("/score/list", async (req, res) => {
  try {
    // 1. 解析筛选参数
    let cities = parseMultiParam(req, "city", []);
    let sources = parseMultiParam(req, "source", []);

    // 2. 解析日期范围
    const dateFilter = {};
    const { end_date, start_date } = req.query;

    if (start_date && end_date) {
      dateFilter[Op.between] = [start_date, end_date];
    } else if (start_date) {
      dateFilter[Op.gte] = start_date;
    } else if (end_date) {
      dateFilter[Op.lte] = end_date;
    }

    // 3. 解析排序参数
    let sortField = req.query.sortField || "target_date";
    let sortOrder = req.query.sortOrder === "asc" ? "ASC" : "DESC";
    // 白名单验证，防止 SQL 注入
    const allowedSortFields = [
      "id", "city", "source", "target_date", "total_score",
      "humidity_score", "precip_score", "pressure_score",
      "temp_score", "temp_max_score", "temp_min_score"
    ];
    if (!allowedSortFields.includes(sortField)) {
      sortField = "target_date";
    }

    // 4. 解析分页参数
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize) || 20);
    const offset = (page - 1) * pageSize;

    // 5. 构建 where 条件
    const where = {};
    if (cities.length) where.city = { [Op.in]: cities };
    if (sources.length) where.source = { [Op.in]: sources };
    where.target_date = dateFilter;

    // 6. 执行分页查询
    const { count, rows } = await TrustScore.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      offset,
      limit: pageSize,
      raw: true
    });

    const totalPages = Math.ceil(count / pageSize);

    res.json({
      code: 200,
      message: "success",
      data: {
        list: rows,
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error("[GET /score/list] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});
/**
 * 按城市、来源分组，返回指定得分字段的平均值（聚合所有日期）
 * GET /score/avg-by-city-source
 * Query参数:
 *   city         string|array  必填
 *   source       string|array  必填
 *   field        string        必填，得分字段名
 *   date         string        可选
 *   date[start]  string        可选
 *   date[end]    string        可选
 */
router.get("/score/avg-by-city-source", async (req, res) => {
  try {
    let cities = parseMultiParam(req, "city", []);
    if (!cities.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: city" });
    }
    let sources = parseMultiParam(req, "source", []);
    if (!sources.length) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: source" });
    }
    const field = req.query.field;
    if (!field) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: field" });
    }
    const allowedFields = [
      'total_score', 'humidity_score', 'precip_score', 'pressure_score',
      'temp_score', 'temp_max_score', 'temp_min_score'
    ];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ code: 400, message: "不支持的字段名" });
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

    const where = {
      city: { [Op.in]: cities },
      source: { [Op.in]: sources },
      target_date: dateFilter
    };

    const results = await TrustScore.findAll({
      where,
      attributes: [
        "city",
        "source",
        [sequelize.fn("AVG", sequelize.col(field)), "avg_value"]
      ],
      group: ["city", "source"],
      order: [["city", "ASC"], ["source", "ASC"]],
      raw: true
    });

    const formatted = results.map(item => ({
      city: item.city,
      source: item.source,
      avg_value: parseFloat(item.avg_value)
    }));

    // 在响应中加入请求的字段名
    res.json({
      code: 200,
      message: "success",
      field: field,        // 添加字段名
      data: formatted
    });
  } catch (error) {
    console.error("[GET /score/avg-by-city-source] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});
// ==================== 导出 ====================
module.exports = {
  router,
};