// 从其他api那获取数据存到本地数据库
const axios = require('axios'); // 用于发送HTTP请求
const getLatLon = require('../controllers/weatherController')
const { BASE_API, FIELDS } = require('./constants')
const { mapTiWeatherData, mapHfWeatherData, mapVcWeatherData} = require('./mapManager')
const { WeatherForecast } = require('../models')
require('dotenv').config({ path: '../../.env' })

async function syncTiWeatherData(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        console.log('正在从API获取数据...');
        const response = await axios.get(`${BASE_API}/ti_hours`, {
            timeout: 10000,
            params: {
                location: `${location.lat},${location.lon}`,
            } // 设置10秒超时，防止请求卡死
        });
        // console.log("!!!!!!!!!",JSON.stringify(response.data.timelines.hourly[0], null, 2));
        const commonOptions = {
            city: location.cityName,
            source: 'tomorrow.io',
            lat: location.lat,
            lon: location.lon,
        };
        // 数据清洗与映射：将API数据转换为模型需要的格式
        const tiMappedArray = response.data.timelines.hourly.map(item => mapTiWeatherData(item, commonOptions));

        // 3. 存入数据库
        console.log(`正在将${cityName}tomorrow.io的数据写入数据库...`);

        await WeatherForecast.bulkCreate(tiMappedArray, {
            updateOnDuplicate: FIELDS
        });
        console.log(`成功将${cityName}tomorrow.io的数据写入数据库...`);

    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
async function syncHfWeatherData(cityName) {
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
            const hfMappedArray = response.data.hourly.map(item => mapHfWeatherData(item, commonOptions));
            // console.log("!!!!!!!!!",JSON.stringify(hfMappedArray[0], null, 2));
            await WeatherForecast.bulkCreate(hfMappedArray, {
                updateOnDuplicate: FIELDS 
            });
            
        } else {
            console.log("和风API返回错误");
        }
       
        console.log(`成功将${cityName}和风的数据写入数据库...`);

    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
async function syncVcWeatherData(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        
        console.log('从数据库获取经纬度...');
        const response = await axios.get(`${BASE_API}/vc_hours`, {
            timeout: 10000,
            params: {
                location: `${location.lon},${location.lat}`,
            } // 设置30秒超时，防止请求卡死
        });
        // const fullUrl = axios.getUri(response.config);
        if (response.status == '200') {

            // 数据清洗与映射：将API数据转换为模型需要的格式
            const vcMappedBigArray = response.data.days.map(item1 => item1['hours'].map(item => mapVcWeatherData(item, {
                city: location.cityName,
                lat: location.lat,
                lon: location.lon,
                datetime: item1.datetime,
            })))
            // console.log("1111111111",JSON.stringify(vcMappedBigArray[0], null, 2));

            const vcMappedArray = vcMappedBigArray.flat()
            // // const vcMappedArray = response.data.days[0].hours.map();
            // console.log("22222222222$$$$$$$$$",vcMappedArray.length,JSON.stringify(vcMappedArray[0], null, 2));
            console.log(`正在将${cityName}VC的数据写入数据库...`);
            await WeatherForecast.bulkCreate(vcMappedArray, {
                updateOnDuplicate: FIELDS 
            });
        } else {
            console.log("和风API返回错误");
        }
       

        // 3. 存入数据库
        // 


        console.log(`成功将${cityName}VC的数据写入数据库...`);

    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
// 并发执行
async function syncWeatherData(cityName) {
    const [result1, result2, result3] = await Promise.all([syncTiWeatherData(cityName), syncHfWeatherData(cityName), syncVcWeatherData(cityName)]);
    return [result1, result2, result3];
}
module.exports = {
    syncWeatherData
}