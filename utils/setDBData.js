// 从其他api那获取数据存到本地数据库
const axios = require('axios'); // 用于发送HTTP请求
const getLatLon = require('../controllers/weatherController')
const { BASE_API, FIELDS } = require('./constants')
const mapTiWeatherData = require('./mapManager')
const mapHfWeatherData = require('./mapManager')
const { WeatherForecast } = require('../models')
require('dotenv').config({ path: '../../.env' })

async function syncTiWeatherData(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        console.log('正在从API获取数据...@@@@@@@@@@!!!!!!!!!');
        const response = await axios.get(`${BASE_API}/ti_hours`, {
            timeout: 10000,
            params: {
                location: `${location.lat},${location.lon}`,
            } // 设置10秒超时，防止请求卡死
        });
        console.log("!!!!!!!!!",JSON.stringify(response.data.timelines.hourly[0], null, 2));
        const commonOptions = {
            city: location.cityName,
            source: 'tomorrow.io',
            lat: location.lat,
            lon: location.lon,
        };
        // 数据清洗与映射：将API数据转换为模型需要的格式
        const tiMappedArray = response.data.timelines.hourly.map(item => mapTiWeatherData(item, commonOptions));

        // 3. 存入数据库
        console.log('正在将数据写入数据库...');

        await WeatherForecast.bulkCreate(tiMappedArray, {
            updateOnDuplicate: [
                'temperature', 'humidity', 'wind_speed', 'wind_direction',
                'precipitation', 'precipitation_probability', 'weather_describe',
                'pressure', 'cloud_cover', 'visibility', 'uv_index', 'aqi',
                'dew', 'data_version', 'is_valid', 'fetch_time'  // 需要更新的字段
            ]
        });
        console.log(`成功写入数据`);

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
            const hfMappedArray = response.data.hourly.map(item => mapHfWeatherData(item, commonOptions));
            console.log("!!!!!!!!!",JSON.stringify(hfMappedArray[0], null, 2));
            await WeatherForecast.bulkCreate(hfMappedArray, {
                updateOnDuplicate: FIELDS 
            });
        } else {
            console.log("和风API返回错误");
        }
       

        // 3. 存入数据库
        console.log('正在将数据写入数据库...');


        console.log(`成功写入数据`);

    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
async function syncOpWeatherData(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        console.log('从数据库获取经纬度...');
        const response = await axios.get(`${BASE_API}/op_hours`, {
            timeout: 30000, //这个慢,留一点时间
            params: {
                location: `${location.lon},${location.lat}`,
            } // 设置30秒超时，防止请求卡死
        });
        if (response.data.code == '200') {
            console.log("!!!!!!!!!",JSON.stringify(response.data, null, 2));
            const commonOptions = {
                city: location.cityName,
                source: 'openweathermap',
                lat: location.lat,
                lon: location.lon,
            };
            // 数据清洗与映射：将API数据转换为模型需要的格式
            // const opMappedArray = response.data.hourly.map(item => mapopWeatherData(item, commonOptions));
            // console.log("!!!!!!!!!",JSON.stringify(opMappedArray[0], null, 2));
            // await WeatherForecast.bulkCreate(opMappedArray, {
            //     updateOnDuplicate: FIELDS 
            // });
        } else {
            console.log("和风API返回错误");
        }
       

        // 3. 存入数据库
        console.log('正在将数据写入数据库...');


        console.log(`成功写入数据`);

    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
syncOpWeatherData('北京')