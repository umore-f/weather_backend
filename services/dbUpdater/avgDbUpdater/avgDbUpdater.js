const { getAvg } = require("../../fetcher/processingData");
const { CITY_LIST } = require("../../../utils/constants");
const { DailyAvg } = require("../../../models");
const {
    get_yesterday_formatted,
} = require("../../../utils/helpers");
require("dotenv").config({ path: "../../.env" });

async function setAverage(cityName) {
    const realData = await getAvg(cityName); // 基准值
    const dateStr =  get_yesterday_formatted()
    await DailyAvg.create({
        city: realData.cityName,
        target_date: dateStr,
        temp: realData.temp,
        temp_max: realData.tempMax,
        temp_min: realData.tempMin,
        humidity: realData.humidity,
        precip: realData.precip,
        pressure: realData.pressure,
        total_records: realData.totalRecords,
        temp_valid_count: realData.validCounts.temp,
        temp_max_valid_count: realData.validCounts.tempMax,
        temp_min_valid_count: realData.validCounts.tempMin,
        humidity_valid_count: realData.validCounts.humidity,
        precip_valid_count: realData.validCounts.precip,
        pressure_valid_count: realData.validCounts.pressure,
        temp_filtered_count: realData.filteredCounts.temp,
        temp_max_filtered_count: realData.filteredCounts.tempMax,
        temp_min_filtered_count: realData.filteredCounts.tempMin,
        humidity_filtered_count: realData.filteredCounts.humidity,
        precip_filtered_count: realData.filteredCounts.precip,
        pressure_filtered_count: realData.filteredCounts.pressure,
    });
}
async function setAvg() {
    for (const city of CITY_LIST) {
        await setAverage(city);
    }
}
module.exports = {
    setAvg
}
