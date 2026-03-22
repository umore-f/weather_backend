const {
    evaluateFieldCredibility,
    getAvg,
    evaluateSources,
} = require("../../fetcher/processingData");
const { getLonlat } = require("../../../controllers/cityController");
const { getError } = require("../../../controllers/errorScore");
const { CITY_LIST, FIELDS_CAL } = require("../../../utils/constants");
const {
    getHistoryWeather,
    getNextWeather,
} = require("../../../controllers/weatherController");
const { DailyError, DailyCompreError } = require("../../../models");
const {
    getYesterdayFormatted,
    isEmptyValue,
    filterOutliersByMaxDeviation,
    get_yesterday_formatted,
    calculateNormalizedAverageError,
    errorToScore,
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
    await DailyError.bulkCreate(allErrors);
}
async function getCompreError(cityName) {
    const sourceList = []
    const errors = getError(cityName, source)
    const compreError = calculateNormalizedAverageError(realData, forecastData);
    console.log("!!!!!!!!!!!!!", compreError);

    // console.log('!!!!!!!!!!!!!!误差值',allErrors);
    // await DailyError.bulkCreate(allErrors);
    await DailyCompreError.bulkCreate(compreError);
}

// getSingleError("北京");
getCompreError("北京");
