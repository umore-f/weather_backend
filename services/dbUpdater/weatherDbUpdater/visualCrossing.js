const axios = require('axios'); // 用于发送HTTP请求
const { getLatLon } = require('../../../controllers/weatherController')
const { BASE_API, FIELDS_DAYS } = require('../../../utils/constants')
const {
  mapVcWeatherDataDays0,
  mapVcWeatherDataDays1,
} = require('../../../utils/mapManager')
const { DailyWeather } = require('../../../models')
require('dotenv').config({ path: '../../.env' })
// VC未来七天
async function syncVcNextWeatherDataDay(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        
        console.log('从数据库获取经纬度...');
        const response = await axios.get(`${BASE_API}/vc_next_value_days`, {
            timeout: 10000,
            params: {
                location: `${location.lon},${location.lat}`,
            } // 设置30秒超时，防止请求卡死
        });
        // const fullUrl = axios.getUri(response.config);
        if (response.status == '200') {

            // 数据清洗与映射：将API数据转换为模型需要的格式
            const vcMappedArray = response.data.days.map(item => mapVcWeatherDataDays1(item, {
                city: location.cityName,
                lat: location.lat,
                lon: location.lon,
                source: 'visualcrossing',
            }))
            // console.log("1111111111",JSON.stringify(vcMappedBigArray[0], null, 2));

            // const vcMappedArray = vcMappedBigArray.flat()
            // // const vcMappedArray = response.data.days[0].hours.map();
            // console.log("22222222222$$$$$$$$$",vcMappedArray.length,JSON.stringify(vcMappedArray[0], null, 2));
            console.log(`正在将${cityName}VC的数据写入数据库...`);
            await DailyWeather.bulkCreate(vcMappedArray, {
                updateOnDuplicate: FIELDS_DAYS 
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
// VC历史
async function syncVcLastWeatherDataDay(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        
        console.log('从数据库获取经纬度...');
        const response = await axios.get(`${BASE_API}/vc_last_value_days`, {
            timeout: 10000,
            params: {
                location: `${location.lon},${location.lat}`,
            } 
        });
        if (response.status == '200') {
            // console.log(JSON.stringify(response.data.days[1], null, 2));

            // 数据清洗与映射：将API数据转换为模型需要的格式
            const vcMappedArray = response.data.days[1].map(item => mapVcWeatherDataDays0(item, {
                city: location.cityName,
                lat: location.lat,
                lon: location.lon,
                source: 'visualcrossing',
            }))
            console.log(`正在将${cityName}VC的数据写入数据库...`);
            await DailyWeather.bulkCreate(vcMappedArray, {
                updateOnDuplicate: FIELDS_DAYS 
            });
        } else {
            console.log("VCAPI返回错误");
        }
    
        // 3. 存入数据库

        console.log(`成功将${cityName}VC的数据写入数据库...`);

    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
module.exports = {
    syncVcNextWeatherDataDay,
    syncVcLastWeatherDataDay
}