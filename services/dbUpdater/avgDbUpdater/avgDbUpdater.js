const {
    evaluateFieldCredibility,
    getAvg,
} = require("../../fetcher/processingData");
const { getError } = require("../../../controllers/errorScore");
const { CITY_LIST, FIELDS_CAL, FIELDCONFIGS, SOURCE_LIST } = require("../../../utils/constants");
const { DailyAvg } = require("../../../models");
const {
    calculateNormalizedAverageError,
} = require("../../../utils/helpers");
require("dotenv").config({ path: "../../.env" });

async function getSingleError(cityName) {
    const realData = await getAvg(cityName); // 基准值
    console.log("!!!!!!!!!!", realData);
    await DailyAvg.create({
        city: realData.cityName,
        temp: realData.temp,
        tempMax: realData.tempMax,
        tempMin: realData.tempMin,
        humidity: realData.humidity,
        precip: realData.precip,
        pressure: realData.pressure,
        total_records: realData.totalRecords,
        temp_valid_count: realData.validCounts.temp,
        tempMax_valid_count: realData.validCounts.tempMax,
        tempMin_valid_count: realData.validCounts.tempMin,
        humidity_valid_count: realData.validCounts.humidity,
        precip_valid_count: realData.validCounts.precip,
        pressure_valid_count: realData.validCounts.pressure,
        temp_filtered_count: realData.filteredCounts.temp,
        tempMax_filtered_count: realData.filteredCounts.tempMax,
        tempMin_filtered_count: realData.filteredCounts.tempMin,
        humidity_filtered_count: realData.filteredCounts.humidity,
        precip_filtered_count: realData.filteredCounts.precip,
        pressure_filtered_count: realData.filteredCounts.pressure,
    });
}

module.exports = {
}
getSingleError('北京')