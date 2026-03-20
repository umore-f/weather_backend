'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DailyWeather extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DailyWeather.init({
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      comment: '自增ID'
    },
    city: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '城市名字'
    },
    lat: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      comment: '纬度'
    },
    lon: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      comment: '经度'
    },
    forecast_time: {
      type: DataTypes.DATE,
      allowNull: false,
      primaryKey: true,           // 复合主键的一部分
      comment: '预报时间点（北京时间）'
    },
    fetch_time: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '数据抓取时间'
    },
    temp_max: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '温度(℃)'
    },
    temp_min: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '温度(℃)'
    },
    humidity_avg: {
      type: DataTypes.INTEGER,
      comment: '湿度(%)'
    },
    precip_total: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '降水量(mm)'
    },
    wind_speed_avg:  {
      type: DataTypes.DECIMAL(5, 2),
      comment: '风速(m/s)'
    },
    wind_direction_avg: {
      type: DataTypes.INTEGER,
      comment: '风向(度)'
    },
    pressure_avg: {
      type: DataTypes.DECIMAL(6, 2),
      comment: '平均气压(hPa)'
    },
    uv_index_avg: {
      type: DataTypes.INTEGER,
      comment: '紫外线指数'
    },
    wind_gust: {
      type: DataTypes.INTEGER,
      comment: '阵风风速'
    },
    weather_text: DataTypes.STRING,
    sunrise: DataTypes.TIME,
    sunset: DataTypes.TIME,
    cloud_cover_avg: {
      type: DataTypes.INTEGER,
      comment: '云量(%)'
    },
    visibility_avg: {
      type: DataTypes.DECIMAL(6, 2),
      comment: '能见度(km)'
    },
    precip_prob_avg: {
      type: DataTypes.INTEGER,
      comment: '降水概率(%)'
    },
    source: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '数据源'
    },
    weather_describe: {
      type: DataTypes.STRING(200),
      comment: '天气描述'          // 原SQL注释为“数据源”
    },
  }, {
    sequelize,
    timestamps: true,
    modelName: 'DailyWeather',
    tableName: 'daily_weather',
    comment: '原始天级别预报数据表', 
    indexes: [                          // 定义索引，与SQL一致
      {
        name: 'idx_location_time',
        fields: ['lon', 'lat', 'forecast_time']   // 注意顺序：经度、纬度、预报时间
      },
      {
        name: 'idx_source_time',
        fields: ['source', 'forecast_time']
      },
      {
        name: 'idx_forecast_time',
        fields: ['forecast_time']
      },
      {
        name: 'unique_city_time_source',
        unique: true,
        fields: ['city', 'forecast_time', 'source']
      }
    ]
  });
  return DailyWeather;
};