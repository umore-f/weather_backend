import db from "../../../models";

const {
    computeNewEWMA,
    calculateNormalizedAverageError,
    evaluateFieldCredibility
} = require("../../fetcher/processingData");
const { getError,getOneError } = require("../../../controllers/errorScore");
const { CITY_LIST, FIELDS_CAL, FIELD_CONFIGS, SOURCE_LIST } = require("../../../utils/constants");
const { getNextWeather } = require("../../../controllers/weatherController");
const { getRealData } = require('../../../controllers/realData')
const db = require("../../../models");
const { DailyError, TrustScore } = db
const {
    get_yesterday_formatted
} = require("../../../utils/helpers");
require("dotenv").config({ path: "../../.env" });

async function getScore(cityName, source) {
    const errorList = await getError(cityName, source)
    const errors = errorList.map(item => ({
        city_name: item.cityName,
        source: item.source,
        target_date: item.targetDate,
        error_type: item.errorType,
        error_value: item.errorValue
    }))
    const realDataErrors = errors.reduce((acc, cur) => {
        if (!acc.source) {
            acc.source = cur.source;
            acc.target_date = cur.target_date;
            acc.city = cur.city_name;
            acc.errors = {};
        }
        acc.errors[cur.error_type] = cur.error_value;
        return acc;
    }, {});

    const compreError = calculateNormalizedAverageError(realDataErrors, FIELD_CONFIGS);
    const result = transformToScoreRecords(compreError)
    await TrustScore.bulkCreate(result, { updateOnDuplicate: ['score'] });
}
async function setScore() {
    for (const source of SOURCE_LIST) {
        for (const city of CITY_LIST) {
            await getScore(city, source);
        }
    }
}
// 默认昨天
async function calError(city) {
    const dateStr = get_yesterday_formatted
    const next = await getNextWeather(city, dateStr)
    const real = await getRealData(city, dateStr)
    const results = [];
    for (const field of FIELDS_CAL) {
        const result = evaluateFieldCredibility(field, real, next)
        results.push(result)
    }
    return results.flat();
}


// 误差计算
async function setErrors() {
    const alpha = 0.3
    for (const city of CITY_LIST) {
        const errorResults = await calError(city);
        for (const errorResult of errorResults) {
            const defaultMaxError = FIELD_CONFIGS[errorResult.error_type].maxError
            await insertDailyErrorWithEWMA(errorResult.city, errorResult.source, errorResult.error_type, errorResult.target_date, errorResult.error_value, alpha, defaultMaxError);
        }
    }
}


async function insertDailyErrorWithEWMA(city, source, field, targetDate, newError, alpha, defaultMaxError) {

    const last = await getOneError(city, source, field)
    const prevEWMA = last ? last.ewma_error : null;

    const newEWMA = computeNewEWMA(newError, prevEWMA, alpha, defaultMaxError);

    await DailyError.create({
        city, source, target_date: targetDate, error_type: field,
        error_value: newError, ewma_error: newEWMA
    });
}

module.exports = {
    getScore,
    setErrors,
    setScore,
}

// getSingleError("北京");
// getCompreError("北京");
