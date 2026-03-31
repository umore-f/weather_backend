const axios = require('axios'); 
const { getLatLon } = require('../../../controllers/cityController')
const { BASE_API, FIELDS_HOURS, FIELDS_DAYS } = require('../../../utils/constants')
const {
  mapTiWeatherDataHours,
  mapTiWeatherDataDays0,
  mapTiWeatherDataDays1, 
} = require('../../../utils/mapManager')
const { HoursForecast, DailyWeather } = require('../../../models')
require('dotenv').config({ path: '../../.env' })
// TI预测
async function syncTiNextWeatherData(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        const response = await axios.get(`${BASE_API}/ti_next_hours_days`, {
            timeout: 10000,
            params: {
                location: `${location.lat},${location.lon}`,
            } // 设置10秒超时，防止请求卡死
        });
        const commonOptions = {
            city: location.cityName,
            source: 'tomorrow.io',
            lat: location.lat,
            lon: location.lon,
        };
        if (response.status == 200) {
            // 数据清洗与映射：将API数据转换为模型需要的格式
            const tiMappedArrayHours = response.data.timelines.hourly.map(item => mapTiWeatherDataHours(item, commonOptions));
            const tiMappedArrayDays = response.data.timelines.daily.map(item => mapTiWeatherDataDays1(item, commonOptions));
            // 存入数据库
            console.log(`正在将${cityName}tomorrow.io,5天120小时数据写入数据库...`);
            await HoursForecast.bulkCreate(tiMappedArrayHours, {
                updateOnDuplicate: FIELDS_HOURS
            });
            await DailyWeather.bulkCreate(tiMappedArrayDays, {
                updateOnDuplicate: FIELDS_DAYS
            });
        } else {
            console.log("tomorrow.ioAPI返回错误");
            
        }
        console.log(`成功将${cityName}tomorrow.io,5天120小时数据写入数据库`);
    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
    
}
// TI历史
async function syncTiLastWeatherData(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        const response = await axios.get(`${BASE_API}/ti_last_hours_days`, {
            timeout: 10000,
            params: {
                location: `${location.lat},${location.lon}`,
            } // 设置10秒超时，防止请求卡死
        });
        const commonOptions = {
            city: location.cityName,
            source: 'tomorrow.io',
            lat: location.lat,
            lon: location.lon,
        };
        if (response.status == 200) {
            // 数据清洗与映射：将API数据转换为模型需要的格式
            const tiMappedArrayDays = mapTiWeatherDataDays0(response.data.timelines.daily[0], commonOptions);
            // 存入数据库
            console.log(`正在将${cityName}tomorrow.io历史数据写入数据库...`);
            await DailyWeather.bulkCreate([tiMappedArrayDays], {
                updateOnDuplicate: FIELDS_DAYS
            });
            
        } else {
            console.log("tomorrow.ioAPI返回错误");
        }
        console.log(`成功将${cityName}tomorrow.io历史数据写入数据库`);
    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
module.exports = {
    syncTiNextWeatherData,
    syncTiLastWeatherData
}