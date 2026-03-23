// 从其他api那获取数据存到本地数据库
const {    
    syncHfWeatherDataHours,
    syncHfNextWeatherDataDays,
    syncHfLastWeatherDataDays
} = require('./heWeather')
const {
    syncTiNextWeatherData,
    syncTiLastWeatherData
} = require('./tomorrowIo')
const  {
    syncVcNextWeatherDataDay,
    syncVcLastWeatherDataDay
} = require('./visualCrossing')


async function fetchAllDays(cityName) {
    const promises = [
        // syncHfNextWeatherDataDays(cityName),
        // syncHfLastWeatherDataDays(cityName),
        // syncTiNextWeatherData(cityName),
        // syncTiLastWeatherData(cityName),
        // syncVcNextWeatherDataDay(cityName),
        syncVcLastWeatherDataDay(cityName),
    ]
    const results = await Promise.all(promises)
    // 结果顺序与 promises 数组一致
    console.log(results)
}
async function fetchAllHours(cityName) {
    const promises = [
        syncHfWeatherDataHours(cityName),
        syncTiNextWeatherData(cityName),
    ]
    const results = await Promise.all(promises)
    console.log(results)
}
module.exports = {
    fetchAllDays,
    fetchAllHours
}
