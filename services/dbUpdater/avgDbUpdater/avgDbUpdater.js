const { getRobustRealValue } = require("../../fetcher/processingData");
const { getHistoryWeather, getHistoryWeatherTest } = require('../../../controllers/weatherController')
const { CITY_LIST, FIELDS_CAL } = require("../../../utils/constants");
const { DailyAvg } = require("../../../models");
const {
    get_yesterday_formatted,
} = require("../../../utils/helpers");
require("dotenv").config({ path: "../../.env" });

async function setAverage(cityName) {

    const historyData = await getHistoryWeather(cityName)

    const realData = FIELDS_CAL.map(field => historyData.map(item => item[field])).map(item=>getRobustRealValue(item))
    
    const dateStr =  get_yesterday_formatted()
    
    const obj = Object.fromEntries(FIELDS_CAL.map((field, i) => [field, realData[i]])); // 转换成对象
    
    const obj1 = { ...obj, city: cityName, target_date: dateStr };
    
    const { tempMax: temp_max,tempMin: temp_min, ...rest } = obj1
    
    const updatedObj = { temp_max, temp_min, ...rest }
    await DailyAvg.create(updatedObj)
    // await DailyAvg.create({
    //     city: cityName,
    //     target_date: dateStr,
    //     temp: realData.temp,
    //     temp_max: realData.tempMax,
    //     temp_min: realData.tempMin,
    //     humidity: realData.humidity,
    //     precip: realData.precip,
    //     pressure: realData.pressure,
    //     // total_records: realData.totalRecords,
    //     // temp_valid_count: realData.validCounts.temp,
    //     // temp_max_valid_count: realData.validCounts.tempMax,
    //     // temp_min_valid_count: realData.validCounts.tempMin,
    //     // humidity_valid_count: realData.validCounts.humidity,
    //     // precip_valid_count: realData.validCounts.precip,
    //     // pressure_valid_count: realData.validCounts.pressure,
    //     // temp_filtered_count: realData.filteredCounts.temp,
    //     // temp_max_filtered_count: realData.filteredCounts.tempMax,
    //     // temp_min_filtered_count: realData.filteredCounts.tempMin,
    //     // humidity_filtered_count: realData.filteredCounts.humidity,
    //     // precip_filtered_count: realData.filteredCounts.precip,
    //     // pressure_filtered_count: realData.filteredCounts.pressure,
    // });
}
async function setReal() {
    for (const city of CITY_LIST) {
        await setAverage(city);
    }
}
module.exports = {
    setReal,
    setAverage
}
