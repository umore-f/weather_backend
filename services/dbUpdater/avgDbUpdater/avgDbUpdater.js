const { getRobustRealValue } = require("../../fetcher/processingData");
const { getHistoryWeather, getNextWeather } = require('../../../controllers/weatherController')
const { getRealDataList } = require('../../../controllers/realData')
const { getSourceWeights } = require('../../fetcher/processingData')
const { CITY_LIST, FIELDS_CAL, FIELD_CONFIGS } = require("../../../utils/constants");
const { DailyAvg } = require("../../../models");
const {
    get_yesterday_formatted,
    weightedAverage
} = require("../../../utils/helpers");
require("dotenv").config({ path: "../../.env" });


// 中位数真值方法
async function getRobustBaseline(cityName) {

    const historyData = await getHistoryWeather(cityName)

    const realData = FIELDS_CAL.map(field => historyData.map(item => item[field])).map(item => getRobustRealValue(item))

    const dateStr = get_yesterday_formatted()

    const obj = Object.fromEntries(FIELDS_CAL.map((field, i) => [field, realData[i]])); // 转换成对象

    const obj1 = { ...obj, city: cityName, target_date: dateStr };

    const { tempMax: temp_max, tempMin: temp_min, ...rest } = obj1

    const updatedObj = { temp_max, temp_min, ...rest }
    await DailyAvg.create(updatedObj)

}
// 自恰迭代估计真实值
async function selfConsistentBaseline(city, field, maxIter = 5) {
    const forecasts = await getNextWeather(city)
    // forecasts: [{ source, value }]
    const sources = forecasts.map(f => f.source);
    let weights = await getSourceWeights(city, sources, field, FIELD_CONFIGS);
    let baseline = weightedAverage(forecasts.map(f => f[field]), weights);

    for (let iter = 0; iter < maxIter; iter++) {
        const errors = forecasts.map(f => Math.abs(f[field] - baseline));
        const newWeights = errors.map(e => 1 / (e + 1e-6));
        const newBaseline = weightedAverage(forecasts.map(f => f[field]), newWeights);
        if (Math.abs(newBaseline - baseline) < 0.01) break;
        baseline = newBaseline;
    }
    return baseline;
}
// 自洽真值方法
async function getSelfConsistentBaseline(city) {
    const resultMap = {};
    const dateStr = get_yesterday_formatted()
    for (const field of FIELDS_CAL) {
        const result = await selfConsistentBaseline(city, field);
        resultMap[field] = result;
    }
    const obj = {
        city: city,
        target_date: dateStr,
        ...resultMap
    };
    const { tempMax: temp_max, tempMin: temp_min, ...rest } = obj
    const updatedObj = { temp_max, temp_min, ...rest }
    await DailyAvg.create(updatedObj)

}
async function setReal() {
    const realDataList = getRealDataList('福州') //最后一个城市
    const realDataCount = realDataList.length
    const isColdStart = realDataCount < 7
    if (isColdStart) {
        for (const city of CITY_LIST) {
            await getRobustBaseline(city);
        }
    } else {
        for (const city of CITY_LIST) {
            await getSelfConsistentBaseline(city);
        }
    }

}
module.exports = {
    setReal,
    selfConsistentBaseline
}
