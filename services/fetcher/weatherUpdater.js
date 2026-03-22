// 从其他api那获取数据存到本地数据库
const axios = require('axios'); // 用于发送HTTP请求
const { getLatLon } = require('../../controllers/weatherController')
const { BASE_API, FIELDS_HOURS, FIELDS_DAYS } = require('../../utils/constants')
const {
  mapHfWeatherDataHours,
  mapTiWeatherDataHours,
  mapTiWeatherDataDays0,
  mapTiWeatherDataDays1, 
  mapHfWeatherDataDays0,
  mapHfWeatherDataDays1,
  mapVcWeatherDataDays0,
  mapVcWeatherDataDays1,
} = require('../../utils/mapManager')
const { HoursForecast, DailyWeather } = require('../../models')
require('dotenv').config({ path: '../../.env' })
// TI预测
async function syncTiNextWeatherData(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        console.log('正在从tomorrow.io获取数据...');
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
            console.log(`正在将${cityName}tomorrow.io的数据写入数据库...`);
            console.log("!!!!!!!!!",JSON.stringify(tiMappedArrayDays[0], null, 2));
            await HoursForecast.bulkCreate(tiMappedArrayHours, {
                updateOnDuplicate: FIELDS_HOURS
            });
            await DailyWeather.bulkCreate(tiMappedArrayDays, {
                updateOnDuplicate: FIELDS_DAYS
            });
            // console.log("",Object.keys(DailyWeather.rawAttributes));
            console.log(`成功将${cityName}tomorrow.io的数据写入数据库...`);
        }
        // console.log("!!!!!!!!!",JSON.stringify(response.data.timelines.hourly[0], null, 2));
    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
// TI历史
async function syncTiLastWeatherData(cityName) {
    try {
        // 从外部API获取数据
        const location = await getLatLon(cityName)
        console.log('正在从tomorrow.io获取数据...');
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
            // const tiMappedArrayHours = response.data.timelines.hourly.map(item => mapTiWeatherDataHours(item, commonOptions));
            // const tiMappedArrayDays = response.data.timelines.daily.map(item => mapTiWeatherDataDays0(item, commonOptions));
            // console.log("!!!!!!!!!",JSON.stringify(response.data.timelines.daily[0], null, 2));
            const tiMappedArrayDays = mapTiWeatherDataDays0(response.data.timelines.daily[0], commonOptions);
            // 存入数据库
            console.log(`正在将${cityName}tomorrow.io的数据写入数据库...`);

            // await HoursForecast.bulkCreate(tiMappedArrayHours, {
            //     updateOnDuplicate: FIELDS_HOURS
            // });
            await DailyWeather.bulkCreate([tiMappedArrayDays], {
                updateOnDuplicate: FIELDS_DAYS
            });
            console.log(`成功将${cityName}tomorrow.io的数据写入数据库...`);
            console.log("!!!!!!!!!",JSON.stringify(tiMappedArrayDays, null, 2));
        }
        
    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}

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
            const hfMappedArray = response.data.hourly.map(item => mapHfWeatherData(item, commonOptions));
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
// 并发小时执行
async function syncWeatherData(cityName) {
    const [result1, result2, result3] = await Promise.all([syncTiWeatherData(cityName), syncHfWeatherData(cityName)]);
    return [result1, result2, result3];
}
// 并发日执行
async function syncWeatherDataDay(cityName) {
    const [result1, result2, result3] = await Promise.all([syncTiWeatherData(cityName), syncHfWeatherData(cityName)]);
    return [result1, result2, result3];
}
module.exports = {
    syncWeatherData
}
// syncTiNextWeatherData('北京')
// syncVcNextWeatherDataDay('北京')
// syncHfNextWeatherDataDays('北京')

// syncTiLastWeatherData('北京')
// syncHfLastWeatherDataDays('北京')
syncVcLastWeatherDataDay('北京')