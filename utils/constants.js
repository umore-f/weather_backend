// 常量
const BASE_API = 'http://127.0.0.1:9000'
// 需要更新的字段
const FIELDS_HOURS = [
'temperature', 'humidity', 'wind_speed', 'wind_direction',
'precipitation', 'precipitation_probability', 'weather_describe',
'pressure', 'cloud_cover', 'visibility', 'uv_index',
'dew', 'is_valid', 'feelslike', 'wind_gust' 
]
// 需要更新的字段
const FIELDS_DAYS = [
'temp_max', 'temp_min', 'temp', 'humidity', 'wind_speed', 'wind_direction',
'precip_type', 'precip_total', 'precip_prob', 'weather_text',
'pressure', 'cloud_cover', 'visibility', 'uv_index', 
'dew', 'is_valid', 'wind_gust', 'sunrise', 'sunset', 'type'
] 
// const CITY_LIST = [
//     '北京'
// ];
const CITY_LIST = [
'长沙', '青岛', '西安', '郑州', '合肥', '宁波', '无锡', '济南', '福州','厦门', '东莞', '佛山', '大连', '沈阳', '昆明', '南昌', '哈尔滨', '泉州', '常州',
];
    // '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '重庆', '苏州',
    // '天津', 
// const CITY_LIST2 = [
//     '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '重庆', '苏州',
//     '天津', '长沙', '青岛', '西安', '郑州', '合肥', '宁波', '无锡', '济南', '福州',
//     '厦门', '东莞', '佛山', '大连', '沈阳', '昆明', '南昌', '哈尔滨', '泉州', '常州',
// ];
// const CITY_LIST3 = [
//     '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '重庆', '苏州',
//     '天津', '长沙', '青岛', '西安', '郑州', '合肥', '宁波', '无锡', '济南', '福州',
//     '厦门', '东莞', '佛山', '大连', '沈阳', '昆明', '南昌', '哈尔滨', '泉州', '常州',
// ];
const CITY_LIST_TEST = [
    '北京'
];
// 需要计算的字段
const FIELDS_CAL = ['tempMax', 'tempMin', 'temp', 'humidity', 'precip', 'pressure']
// 数据源
const SOURCE_LIST = ['QWeather','tomorrow.io','visualcrossing']
const FIELDCONFIGS = {
  temp:     { maxError: 4, weight: 1 },   // 温度误差边界3°C
  tempMax:  { maxError: 4, weight: 1 },
  tempMin:  { maxError: 4, weight: 1 },
  humidity: { maxError: 20, weight: 1 },  // 湿度误差边界15%
  precip:   { maxError: 3, weight: 1 },   // 降水误差边界2mm
  pressure: { maxError: 20, weight: 1 }   // 气压误差边界15hPa
};
module.exports = {
  BASE_API,
  FIELDS_HOURS,
  CITY_LIST,
  FIELDS_DAYS,
  FIELDS_CAL,
  FIELDCONFIGS,
  SOURCE_LIST
};
