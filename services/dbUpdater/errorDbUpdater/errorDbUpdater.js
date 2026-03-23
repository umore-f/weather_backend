const {
    evaluateFieldCredibility,
    getAvg,
    evaluateSources,
} = require("../../fetcher/processingData");
const { getError, getCompreErrorFromDb } = require("../../../controllers/errorScore");
const { CITY_LIST, FIELDS_CAL, FIELDCONFIGS, SOURCE_LIST } = require("../../../utils/constants");
const { getNextWeather } = require("../../../controllers/weatherController");
const { DailyError, DailyCompreError, TrustScore } = require("../../../models");
const {
    getYesterdayFormatted,
    isEmptyValue,
    filterOutliersByMaxDeviation,
    get_yesterday_formatted,
    calculateNormalizedAverageError,
    errorToScore,
    fieldErrorToScore
} = require("../../../utils/helpers");
require("dotenv").config({ path: "../../.env" });

async function getSingleError(cityName) {
    let allErrors = [];
    const realData = await getAvg(cityName); // 基准值
    const forecastData = await getNextWeather(cityName);
    for (let i = 0; i < FIELDS_CAL.length; i++) {
        const singleError = evaluateFieldCredibility(
            FIELDS_CAL[i],
            realData,
            forecastData,
        );
        // console.log("@@@@@@@@@@@",singleError);

        allErrors.push(...singleError);
    }
    console.log(
        "!!!!!!!!!!!!!!!真实值:",
        realData,
        "!!!!!!!!!!!!预测值:",
        forecastData,
        "!!!!!!!!!!!!!!误差值",
        allErrors,
    );
    // console.log('!!!!!!!!!!!!!!误差值',allErrors);
    await DailyError.bulkCreate(allErrors, { updateOnDuplicate: ['error_value'] });
}
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
        // 第一次迭代时初始化 acc
        if (!acc.source) {
            acc.source = cur.source;
            acc.target_date = cur.target_date;
            acc.city = cur.city_name;
            acc.errors = {};
        }
        acc.errors[cur.error_type] = cur.error_value;
        return acc;
    }, {});

    const compreError = calculateNormalizedAverageError(realDataErrors, FIELDCONFIGS);
    const result = transformToScoreRecords(compreError)
    console.log("!!!!!!!!!!!", result);

    await TrustScore.bulkCreate(result, { updateOnDuplicate: ['score'] });
}
async function getErrors() {
    for (const source of SOURCE_LIST) {
        for (const city of CITY_LIST) {
            await getScore(city, source);
        }
    }
}
function transformToScoreRecords(data) {
  const { source, target_date, city, totalScore, fieldScores, window_days } = data;
  const records = [];

  // 1. 添加总分记录
  if (totalScore !== undefined) {
    records.push({
      source,
      target_date,
      city,
      score_type: 'totalScore',
      score: totalScore,
      window_days
    });
  }

  // 2. 添加各字段分数记录
  if (fieldScores) {
    for (const [score_type, score] of Object.entries(fieldScores)) {
      records.push({
        source,
        target_date,
        city,
        score_type,
        score,
        window_days
      });
    }
  }

  return records;
}
module.exports = {
    getSingleError,
    getScore,
    getErrors,
}

// getSingleError("北京");
// getCompreError("北京");
