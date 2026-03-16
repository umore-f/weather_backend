// 常量
const BASE_API = 'http://127.0.0.1:9000'
// 需要更新的字段
const FIELDS = [
'temperature', 'humidity', 'wind_speed', 'wind_direction',
'precipitation', 'precipitation_probability', 'weather_describe',
'pressure', 'cloud_cover', 'visibility', 'uv_index', 'aqi',
'dew', 'data_version', 'is_valid', 'fetch_time' 
] // 需要更新的字段

module.exports = {
  BASE_API,
  FIELDS
};