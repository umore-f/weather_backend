// 常量
const BASE_API = 'http://127.0.0.1:9000'
// 需要更新的字段
const FIELDS_HOURS = [
'temperature', 'humidity', 'wind_speed', 'wind_direction',
'precipitation', 'precipitation_probability', 'weather_describe',
'pressure', 'cloud_cover', 'visibility', 'uv_index',
'dew', 'is_valid', 'fetch_time', 'feelslike', 'wind_gust' 
]
// 需要更新的字段
const FIELDS_DAYS = [
'temp_max', 'temp_min','temp', 'humidity', 'wind_speed', 'wind_direction',
'precip_type', 'precip_total', 'precip_prob', 'weather_text',
'pressure', 'cloud_cover', 'visibility', 'uv_index', 
'dew', 'is_valid', 'fetch_time', 'wind_gust', 'sunrise', 'sunset',
] 
const CITY_LIST = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '重庆', '苏州',
    '天津', '长沙', '青岛', '西安', '郑州', '合肥', '宁波', '无锡', '济南', '福州',
    '厦门', '东莞', '佛山', '大连', '沈阳', '昆明', '南昌', '哈尔滨', '泉州', '常州',
];
module.exports = {
  BASE_API,
  FIELDS,
  CITY_LIST,
  FIELDS2
};
