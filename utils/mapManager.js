// ti小时天气api
// 天气代码 -> 文字描述映射（示例，请根据实际代码表扩展）
// const weatherCodeMap = {
//   1101: '部分多云',
//   
// };

const { raw } = require("express");

/**
 * 将原始天气数据映射到目标字段格式
 * @param {Object} rawData - 原始数据对象，包含 time 和 values
 * @param {Object} options - 额外的字段，如 city, lat, lon, source 等
 * @returns {Object} 映射后的对象
 */
function mapTiWeatherData(rawData, options = {}) {
  const { time, values } = rawData;
  const {
    city = null,
    source = null,
    lat = null,
    lon = null,
    fetch_time = new Date().toString(), // 默认当前时间
    // aqi = null,
    // data_version = 'v1',
    // is_valid = true,
    // created_at = new Date().toString(),
  } = options;

  // 计算总降水量（累积值），根据你的业务需求调整
  const precipitation = (values.rainAccumulation || 0) +
                        (values.snowAccumulation || 0) +
                        (values.sleetAccumulation || 0);

  // 天气描述
//   const weather_describe = weatherCodeMap[values.weatherCode] || '未知';

  return {
    id: null, // 通常由数据库自增，这里可传入或设为 null
    city,
    source,
    forecast_time: new Date(time).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),                // 原数据中的 time
    fetch_time,
    lat,
    lon,
    temperature: values.temperature,
    humidity: values.humidity,
    wind_speed: values.windSpeed,
    wind_direction: values.windDirection,
    precipitation,                       // 累积降水量
    precipitation_probability: values.precipitationProbability,
    // weather_describe,
    pressure: values.pressureSeaLevel,   // 使用海平面气压
    cloud_cover: values.cloudCover,
    visibility: values.visibility,
    uv_index: values.uvIndex,
    // aqi,
    dew: values.dewPoint,
    // data_version,
    // is_valid,
    // created_at,
    feelslike: values.temperatureApparent,
    wind_gust: values.windGust
  };
}

// 和风天气API映射

function mapHfWeatherData(rawData, options = {}) {
  const {
    city = null,
    source = null,
    lat = null,
    lon = null,
    fetch_time = new Date().toString(), // 默认当前时间
    // aqi = null,
    // data_version = 'v7',
    // is_valid = true,
    created_at = new Date().toString(),
    visibility = null,
    uv_index = null,
  } = options;

  // 天气描述
//   const weather_describe = weatherCodeMap[values.weatherCode] || '未知';

  return {
    id: null, // 通常由数据库自增，这里可传入或设为 null
    city,
    source,
    forecast_time: rawData.fxTime,                // 原数据中的 time
    // fetch_time,
    lat,
    lon,
    temperature: rawData.temp,
    humidity: rawData.humidity,
    wind_speed: rawData.windSpeed,
    wind_direction: rawData.wind360,
    precipitation: rawData.precip,                       // 累积降水量
    precipitation_probability: rawData.pop,
    // weather_describe,
    pressure: rawData.pressure,   
    cloud_cover: rawData.cloud,
    dew: rawData.dew,
    // is_valid,
    // created_at,
  };
}

// vcAPI映射
function mapVcWeatherData(rawData, options = {}) {
  const {
    city = null,
    lat = null,
    lon = null,
    // fetch_time = new Date().toString(), 
    // aqi = null,
    // data_version = 'v1',
    is_valid = true,
    // created_at = new Date().toString(),
    datetime
  } = options;

  // 天气描述
//   const weather_describe = weatherCodeMap[values.weatherCode] || '未知';

  return {
    id: null, // 通常由数据库自增，这里可传入或设为 null
    city,
    source: rawData.source,
    forecast_time: datetime+'T'+rawData.datetime,                // 原数据中的 time
    // fetch_time,
    lat,
    lon,
    temperature: rawData.temp,
    feelslike:rawData.feelslike,
    humidity: rawData.humidity,
    wind_speed: rawData.windspeed,
    wind_direction: rawData.winddir,
    wind_gust: rawData.windgust,
    precipitation: rawData.precip,                       // 累积降水量
    precipitation_probability: rawData.precipprob,
    // weather_describe,
    pressure: rawData.pressure,   
    cloud_cover: rawData.cloudcover,
    dew: rawData.dew,
    is_valid,
    // created_at,
    uv_index: rawData.uvindex,
    visibility: rawData.visibility,
    // data_version
  };
}
module.exports = {
    mapTiWeatherData,
    mapHfWeatherData,
    mapVcWeatherData,
}