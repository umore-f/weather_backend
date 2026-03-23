const axios = require('axios'); // 用于发送HTTP请求
const { getLatLon } = require('../../../controllers/cityController')
const { BASE_API, FIELDS_HOURS, FIELDS_DAYS } = require('../../../utils/constants')
const {
  mapHfWeatherDataHours,
  mapHfWeatherDataDays0,
  mapHfWeatherDataDays1,
} = require('../../../utils/mapManager')
const { HoursForecast, DailyWeather } = require('../../../models')
require('dotenv').config({ path: '../../.env' })
async function syncHfWeatherDataHours(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        console.log('从数据库获取经纬度...');
        const response = await axios.get(`${BASE_API}/hf_hours`, {
            timeout: 10000,
            params: {
                location: `${location.lon},${location.lat}`,
            } // 设置10秒超时，防止请求卡死
        });
        if (response.data.code == '200') {
            // console.log("!!!!!!!!!",JSON.stringify(response.data, null, 2));
            const commonOptions = {
                city: location.cityName,
                source: 'QWeather',
                lat: location.lat,
                lon: location.lon,
            };
            // 数据清洗与映射：将API数据转换为模型需要的格式
            console.log(`正在将${cityName}和风的数据写入数据库...`);
            // 3. 存入数据库
            const hfMappedArray = response.data.hourly.map(item => mapHfWeatherDataHours(item, commonOptions));
            // console.log("!!!!!!!!!",JSON.stringify(hfMappedArray[0], null, 2));
            await WeatherForecast.bulkCreate(hfMappedArray, {
                updateOnDuplicate: FIELDS_HOURS 
            });
            
        } else {
            console.log("和风API返回错误");
        }
       
        console.log(`成功将${cityName}和风的数据写入数据库...`);

    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
// 和风天气未来7天
async function syncHfNextWeatherDataDays(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        console.log('从数据库获取经纬度...');
        const response = await axios.get(`${BASE_API}/hf_next_days`, {
            timeout: 10000,
            params: {
                location: `${location.lon},${location.lat}`,
            } // 设置10秒超时，防止请求卡死
        });
        if (response.data.code == '200') {
            // console.log("!!!!!!!!!",JSON.stringify(response.data, null, 2));
            const commonOptions = {
                city: location.cityName,
                source: 'QWeather',
                lat: location.lat,
                lon: location.lon,
            };
            // 数据清洗与映射：将API数据转换为模型需要的格式
            console.log(`正在将${cityName}和风的数据写入数据库...`);
            // 3. 存入数据库
            const hfMappedArray = response.data.daily.map(item => mapHfWeatherDataDays1(item, commonOptions));
            // console.log("!!!!!!!!!",JSON.stringify(hfMappedArray[0], null, 2));
            await DailyWeather.bulkCreate(hfMappedArray, {
                updateOnDuplicate: FIELDS_HOURS 
            });
            
        } else {
            console.log("和风API返回错误");
        }
       
        console.log(`成功将${cityName}和风的数据写入数据库...`);

    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
// 和风历史
async function syncHfLastWeatherDataDays(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        console.log('从数据库获取经纬度...');
        const response = await axios.get(`${BASE_API}/hf_last_days`, {
            timeout: 10000,
            params: {
                location: location.cityId,
            } // 设置10秒超时，防止请求卡死
        });
        if (response.data.code == '200') {
            // console.log("!!!!!!!!!",JSON.stringify(response.data, null, 2));
            const commonOptions = {
                city: location.cityName,
                source: 'QWeather',
                lat: location.lat,
                lon: location.lon,
            };
            // 数据清洗与映射：将API数据转换为模型需要的格式
            console.log(`正在将${cityName}和风的数据写入数据库...`);
            // 3. 存入数据库
            const hfMappedArray = mapHfWeatherDataDays0(response.data.weatherDaily, commonOptions);
            // console.log("!!!!!!!!!",JSON.stringify(hfMappedArray[0], null, 2));
            await DailyWeather.bulkCreate([hfMappedArray], {
                updateOnDuplicate: FIELDS_DAYS 
            });
            
        } else {
            console.log("和风API返回错误");
        }
       
        console.log(`成功将${cityName}和风的数据写入数据库...`);

    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
module.exports = {
    syncHfWeatherDataHours,
    syncHfNextWeatherDataDays,
    syncHfLastWeatherDataDays
}