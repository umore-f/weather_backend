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
'北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '重庆', '苏州','天津', '长沙', '青岛', '西安', '郑州', '合肥', '宁波', '无锡', '济南', '福州',
];
    // 
    // 
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
const FIELD_CONFIGS = {
  temp:     { maxError: 3, weight: 3 },   // 温度最重要
  tempMax:  { maxError: 3, weight: 2 },   // 最高温次之
  tempMin:  { maxError: 3, weight: 2 },
  humidity: { maxError: 15, weight: 2 },  // 湿度中等
  precip:   { maxError: 5, weight: 2 },   // 降水重要但难，权重适中
  pressure: { maxError: 15, weight: 1 }   // 气压权重最低
};
const EWMA_ALPHA = 0.3;          // 平滑系数
const COLD_START_DAYS = 7;       // 冷启动天数
const MAX_WEIGHT_RATIO = 0.6;    // 单个源最大权重占比
module.exports = {
  BASE_API,
  FIELDS_HOURS,
  CITY_LIST,
  FIELDS_DAYS,
  FIELDS_CAL,
  FIELD_CONFIGS,
  SOURCE_LIST,
  EWMA_ALPHA,
  COLD_START_DAYS,
  MAX_WEIGHT_RATIO,
};
