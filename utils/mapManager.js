
// ti小时天气api
const { raw } = require("express");

function mapTiWeatherDataHours(rawData, options = {}) {
  const { time, values } = rawData;
  const {
    city = null,
    lat = null,
    lon = null,
    source = null,
    is_valid = 1,
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
    is_valid
  };
}
function mapTiWeatherDataDays(rawData, options = {}) {
  const { time, values } = rawData;
  const {
    city = null,
    lat = null,
    lon = null,
    source = null,
    is_valid = 1,
  } = options;

  // 计算总降水量（累积值），根据你的业务需求调整
  const precipitation =
    (values.rainAccumulationAvg || 0) +
    (values.snowAccumulationAvg || 0) +
    (values.sleetIntensityAvg || 0);

  return {
    id: null,
    city,
    source,
    forecast_time: new Date(time.toLocaleString("en-US", { timeZone: "Asia/Shanghai" })),
    lat,
    lon,
    temp_max: values.temperatureApparentMax,
    temp_min: values.temperatureApparentMin,
    humidity_avg: values.humidityAvg,
    wind_speed_avg: values.windSpeedAvg,
    wind_direction_avg: values.windDirectionAvg,
    precip_total: precipitation,
    precip_prob_avg: values.precipitationProbabilityAvg,
    pressure_avg: values.pressureSeaLevelAvg,
    cloud_cover_avg: values.cloudCoverAvg,
    visibility_avg: values.visibilityAvg,
    uv_index_avg: values.uvIndexAvg,
    dew_avg: values.dewPointAvg,
    wind_gust: values.windGustAvg,
    is_valid,
    sunrise: new Date(values.sunriseTime).toLocaleString("zh-CN", {timeZone: "Asia/Shanghai",}),
    sunset: new Date(values.sunsetTime).toLocaleString("zh-CN", {timeZone: "Asia/Shanghai",}),
    weather_text
  };
}
// 和风天气API映射

function mapHfWeatherDataHours(rawData, options = {}) {
  const {
    city = null,
    lat = null,
    lon = null,
    source = null,
    is_valid = 1,
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
    is_valid,
    visibility: null,
    uv_index: null,
  };
}
function mapHfWeatherDataDays(rawData, options = {}) {
    const {
    city = null,
    lat = null,
    lon = null,
    source = null,
    is_valid = 1,
  } = options;
  return {
    id: null,
    city,
    source,
    forecast_time: rawData.fxDate,
    lat,
    lon,
    temp_max: rawData.tempMax,
    temp_min: rawData.tempMin,
    temp: (rawData.tempMax + rawData.tempMin)/2,
    humidity: rawData.humidity,
    wind_speed: rawData.windSpeedDay,
    wind_direction: rawData.wind360Day,
    precip_total: precip,
    precip_prob: null,
    pressure: rawData.pressure,
    cloud_cover: rawData.cloud,
    visibility: rawData.vis,
    uv_index: rawData.uvIndex,
    dew: null,
    wind_gust: null,
    wind_scale: rawData.windScaleDay,
    is_valid,
    sunrise,
    sunset,
    weather_text: rawData.textDay 
  };
}
// vcAPI映射
function mapVcWeatherDataDays(rawData, options = {}) {
  const {
    city = null,
    lat = null,
    lon = null,
    source = null,
    is_valid = 1,
  } = options;
  return {
    id: null,
    city,
    source,
    forecast_time: rawData.datetime,
    lat,
    lon,
    temp_max: rawData.tempmax,
    temp_min: rawData.tempmin,
    temp: rawData.temp,
    feelslike_max: rawData.feelslikemax,
    feelslike_min: rawData.feelslike_min,
    feelslike: rawData.feelslike,
    precipcover: rawData.precip_cover,
    snow: rawData.snow,
    snow_depth: rawData.snowdepth,
    solar_radiation: rawData.solarradiation,
    solar_energy: rawData.solarenergy,
    severe_risk: rawData.severerisk,
    humidity: rawData.humidity,
    wind_speed: rawData.windspeed,
    wind_direction: rawData.winddir,
    precip_type: rawData.preciptype.join(''),
    precip_total: rawData.precip,
    precip_prob: rawData.precipprob,
    pressure: rawData.pressure,
    cloud_cover: rawData.cloudcover,
    visibility: rawData.visibility,
    uv_index: rawData.uvindex,
    dew: null,
    wind_gust: windgust,
    is_valid,
    sunrise,
    sunset,
    wind_gust: rawData.windgust,
    weather_text: rawData.conditions + rawData.description
  };
}
module.exports = {
  mapTiWeatherData,
  mapTiWeatherDataDay,
  mapHfWeatherData,
  mapVcWeatherData,
};
