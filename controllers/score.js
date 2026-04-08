const { Op } = require("sequelize");
const { sequelize } = require("../models");
const express = require("express");
const { TrustScore } = require("../models");

const router = express.Router();

// ==================== 公共辅助函数 ====================
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

function parseDateFilter(req) {
  const { start_date, end_date } = req.query;
  const filter = {};
  if (start_date && end_date) {
    filter[Op.between] = [start_date, end_date];
  } else if (start_date) {
    filter[Op.gte] = start_date;
  } else if (end_date) {
    filter[Op.lte] = end_date;
  }
  return filter;
}

function parseCities(req, required = false) {
  const cities = parseMultiParam(req, "city", []);
  if (required && !cities.length) throw new Error("缺少必要参数: city");
  return cities;
}

function parseSources(req) {
  return parseMultiParam(req, "source", []);
}

const SCORE_FIELDS = [
  'total_score',
  'humidity_score',
  'precip_score',
  'pressure_score',
  'temp_score',
  'temp_max_score',
  'temp_min_score'
];

function buildAvgAttributes(groupFields = []) {
  const attrs = [...groupFields];
  SCORE_FIELDS.forEach(field => {
    attrs.push([sequelize.fn("AVG", sequelize.col(field)), `avg_${field}`]);
  });
  return attrs;
}

function handleError(res, error, defaultMsg = "服务器内部错误") {
  console.error(`[ERROR] ${error.message}`);
  const status = error.message.includes("缺少必要参数") ? 400 : 500;
  res.status(status).json({ code: status, message: error.message || defaultMsg });
}

// ==================== 路由 ====================
router.get("/score", async (req, res) => {
  try {
    const locations = parseCities(req);
    const sources = parseSources(req);
    const dateFilter = parseDateFilter(req);

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
    handleError(res, error);
  }
});

router.get("/score/avg-by-source", async (req, res) => {
  try {
    const cities = parseCities(req, true);
    const sources = parseSources(req);
    const dateFilter = parseDateFilter(req);

    const where = { city: { [Op.in]: cities }, target_date: dateFilter };
    if (sources.length) where.source = { [Op.in]: sources };

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

    const formatted = results.map(item => ({
      source: item.source,
      avg_total_score: parseFloat(item.avg_total_score)
    }));

    res.json({ code: 200, message: "success", data: formatted });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/score/avg-by-source-date", async (req, res) => {
  try {
    const cities = parseCities(req, true);
    const sources = parseSources(req);
    const dateFilter = parseDateFilter(req);

    const where = { city: { [Op.in]: cities }, target_date: dateFilter };
    if (sources.length) where.source = { [Op.in]: sources };

    const attributes = [
      "source",
      "target_date",
      ...SCORE_FIELDS.map(field => [
        sequelize.fn("AVG", sequelize.col(field)),
        `avg_${field}`
      ])
    ];

    const results = await TrustScore.findAll({
      where,
      attributes,
      group: ["source", "target_date"],
      order: [["source", "ASC"], ["target_date", "ASC"]],
      raw: true
    });

    const formatted = results.map(item => {
      const obj = { source: item.source, target_date: item.target_date };
      SCORE_FIELDS.forEach(field => {
        obj[`avg_${field}`] = parseFloat(item[`avg_${field}`]) ?? null;
      });
      return obj;
    });

    res.json({ code: 200, message: "success", data: formatted });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/score/avg-by-source-all", async (req, res) => {
  try {
    const cities = parseCities(req, true);
    const sources = parseSources(req);
    const dateFilter = parseDateFilter(req);

    const where = { city: { [Op.in]: cities }, target_date: dateFilter };
    if (sources.length) where.source = { [Op.in]: sources };

    const attributes = [
      "source",
      ...SCORE_FIELDS.map(field => [
        sequelize.fn("AVG", sequelize.col(field)),
        `avg_${field}`
      ])
    ];

    const results = await TrustScore.findAll({
      where,
      attributes,
      group: ["source"],
      order: [["source", "ASC"]],
      raw: true
    });

    const formatted = results.map(item => {
      const obj = { source: item.source };
      SCORE_FIELDS.forEach(field => {
        obj[`avg_${field}`] = parseFloat(item[`avg_${field}`]) ?? null;
      });
      return obj;
    });

    res.json({ code: 200, message: "success", data: formatted });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/score/detail", async (req, res) => {
  try {
    const cities = parseCities(req);
    const sources = parseSources(req);
    const dateFilter = parseDateFilter(req);

    const where = { target_date: dateFilter };
    if (cities.length) where.city = { [Op.in]: cities };
    if (sources.length) where.source = { [Op.in]: sources };

    const results = await TrustScore.findAll({
      where,
      order: [["target_date", "ASC"], ["city", "ASC"], ["source", "ASC"]],
      raw: true
    });

    res.json({ code: 200, message: "success", data: results });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/score/list", async (req, res) => {
  try {
    const cities = parseCities(req);
    const sources = parseSources(req);
    const dateFilter = parseDateFilter(req);

    let sortField = req.query.sortField || "target_date";
    const sortOrder = req.query.sortOrder === "asc" ? "ASC" : "DESC";
    const allowedSortFields = [
      "id", "city", "source", "target_date", "total_score",
      "humidity_score", "precip_score", "pressure_score",
      "temp_score", "temp_max_score", "temp_min_score"
    ];
    if (!allowedSortFields.includes(sortField)) sortField = "target_date";

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize) || 20);
    const offset = (page - 1) * pageSize;

    const where = { target_date: dateFilter };
    if (cities.length) where.city = { [Op.in]: cities };
    if (sources.length) where.source = { [Op.in]: sources };

    const { count, rows } = await TrustScore.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      offset,
      limit: pageSize,
      raw: true
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
    handleError(res, error);
  }
});

router.get("/score/avg-by-city-source", async (req, res) => {
  try {
    const cities = parseCities(req, true);
    const sources = parseSources(req);
    if (!sources.length) throw new Error("缺少必要参数: source");

    const field = req.query.field;
    if (!field) throw new Error("缺少必要参数: field");
    const allowedFields = [
      'total_score', 'humidity_score', 'precip_score', 'pressure_score',
      'temp_score', 'temp_max_score', 'temp_min_score'
    ];
    if (!allowedFields.includes(field)) throw new Error("不支持的字段名");

    const dateFilter = parseDateFilter(req);

    const results = await TrustScore.findAll({
      where: {
        city: { [Op.in]: cities },
        source: { [Op.in]: sources },
        target_date: dateFilter
      },
      attributes: [
        "city",
        "source",
        [sequelize.fn("AVG", sequelize.col(field)), "avg_value"]
      ],
      group: ["city", "source"],
      order: [],
      raw: true
    });

    const formatted = results.map(item => ({
      city: item.city,
      source: item.source,
      avg_value: parseFloat(item.avg_value)
    }));

    res.json({ code: 200, message: "success", field, data: formatted });
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/score/source-avg-by-city", async (req, res) => {
  try {
    const { city, date, start_date, end_date } = req.query;

    if (!city) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: city" });
    }

    let dateFilter = {};
    if (start_date && end_date) {
      dateFilter = { [Op.between]: [start_date, end_date] };
    } else if (start_date) {
      dateFilter = { [Op.gte]: start_date };
    } else if (end_date) {
      dateFilter = { [Op.lte]: end_date };
    } else if (date) {
      dateFilter = { [Op.eq]: date };
    }

    const where = {
      city,
      target_date: dateFilter
    };

    const attributes = [
      "source",
      ...SCORE_FIELDS.map(field => [
        sequelize.fn("AVG", sequelize.col(field)),
        `avg_${field}`
      ])
    ];

    const results = await TrustScore.findAll({
      where,
      attributes,
      group: ["source"],
      order: [["source", "ASC"]],
      raw: true
    });

    const formatted = results.map(item => {
      const obj = { source: item.source };
      SCORE_FIELDS.forEach(field => {
        const avgKey = `avg_${field}`;
        obj[avgKey] = item[avgKey] !== null ? parseFloat(item[avgKey]) : null;
      });
      return obj;
    });

    res.json({ code: 200, message: "success", data: formatted });
  } catch (error) {
    console.error("[GET /score/source-avg-by-city] 查询失败:", error);
    res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
});

router.get("/score/city_detail", async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ code: 400, message: "缺少必要参数: city" });
    }
    const dateFilter = parseDateFilter(req);

    const where = { target_date: dateFilter, city };
    const results = await TrustScore.findAll({
      where,
      order: [["target_date", "ASC"], ["source", "ASC"]],
      raw: true
    });

    res.json({ code: 200, message: "success", data: results });
  } catch (error) {
    handleError(res, error);
  }
});
module.exports = { router };