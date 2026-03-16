// 常量
const BASE_API = 'http://127.0.0.1:9000'
// 需要更新的字段
const FIELDS = [
'temperature', 'humidity', 'wind_speed', 'wind_direction',
'precipitation', 'precipitation_probability', 'weather_describe',
'pressure', 'cloud_cover', 'visibility', 'uv_index', 'aqi',
'dew', 'data_version', 'is_valid', 'fetch_time', 'feelslike', 'wind_gust' 
] // 需要更新的字段
const CITY_LIST = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '重庆', '苏州',
    '天津', '长沙', '青岛', '西安', '郑州', '合肥', '宁波', '无锡', '济南', '福州',
    '厦门', '东莞', '佛山', '大连', '沈阳', '昆明', '南昌', '哈尔滨', '泉州', '常州',
    '南通', '烟台', '温州', '长春', '南宁', '贵阳', '石家庄', '太原', '珠海', '嘉兴',
    '金华', '绍兴', '潍坊', '徐州', '惠州', '台州', '呼和浩特', '乌鲁木齐', '扬州', '中山'
];
module.exports = {
  BASE_API,
  FIELDS,
  CITY_LIST
};
