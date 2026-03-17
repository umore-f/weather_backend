// ti小时天气api
const { raw } = require("express");

function mapTiWeatherData(rawData, options = {}) {
  const { time, values } = rawData;
  const {
    city = null,
    source = null,
    lat = null,
    lon = null,
    fetch_time = new Date().toString(), // 默认当前时间
  } = options;

  // 计算总降水量（累积值），根据你的业务需求调整
  const precipitation =
    (values.rainAccumulation || 0) +
    (values.snowAccumulation || 0) +
    (values.sleetAccumulation || 0);

  return {
    id: null,
    city,
    source,
    forecast_time: new Date(time).toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
    }),
    fetch_time,
    lat,
    lon,
    temperature: values.temperature,
    humidity: values.humidity,
    wind_speed: values.windSpeed,
    wind_direction: values.windDirection,
    precipitation,
    precipitation_probability: values.precipitationProbability,
    pressure: values.pressureSeaLevel,
    cloud_cover: values.cloudCover,
    visibility: values.visibility,
    uv_index: values.uvIndex,
    dew: values.dewPoint,
    feelslike: values.temperatureApparent,
    wind_gust: values.windGust,
  };
}

// 和风天气API映射

function mapHfWeatherData(rawData, options = {}) {
  const {
    city = null,
    source = null,
    lat = null,
    lon = null,
    visibility = null,
    uv_index = null,
  } = options;

  return {
    id: null,
    city,
    source,
    forecast_time: rawData.fxTime,
    lat,
    lon,
    temperature: rawData.temp,
    humidity: rawData.humidity,
    wind_speed: rawData.windSpeed,
    wind_direction: rawData.wind360,
    precipitation: rawData.precip,
    precipitation_probability: rawData.pop,
    pressure: rawData.pressure,
    cloud_cover: rawData.cloud,
    dew: rawData.dew,
  };
}

// vcAPI映射
function mapVcWeatherData(rawData, options = {}) {
  const {
    city = null,
    lat = null,
    lon = null,
    is_valid = true,
    datetime,
  } = options;

  return {
    id: null,
    city,
    source: rawData.source,
    forecast_time: datetime + "T" + rawData.datetime,
    lat,
    lon,
    temperature: rawData.temp,
    feelslike: rawData.feelslike,
    humidity: rawData.humidity,
    wind_speed: rawData.windspeed,
    wind_direction: rawData.winddir,
    wind_gust: rawData.windgust,
    precipitation: rawData.precip,
    precipitation_probability: rawData.precipprob,
    pressure: rawData.pressure,
    cloud_cover: rawData.cloudcover,
    dew: rawData.dew,
    is_valid,
    uv_index: rawData.uvindex,
    visibility: rawData.visibility,
  };
}
module.exports = {
  mapTiWeatherData,
  mapHfWeatherData,
  mapVcWeatherData,
};
