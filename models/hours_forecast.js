'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HoursForecast extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  HoursForecast.init( {
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
    source: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '数据源'
    },
    forecast_time: {
      type: DataTypes.DATE,
      allowNull: false,
      primaryKey: true,           // 复合主键的一部分
      comment: '预报时间点（北京时间）'
    },
    // fetch_time: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   comment: '数据抓取时间'
    // },
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
    temperature: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '温度(℃)'
    },
    humidity: {
      type: DataTypes.INTEGER,
      comment: '湿度(%)'
    },
    wind_speed: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '风速(m/s)'
    },
    wind_direction: {
      type: DataTypes.INTEGER,
      comment: '风向(度)'
    },
    precipitation: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '降水量(mm)'
    },
    precipitation_probability: {
      type: DataTypes.INTEGER,
      comment: '降水概率(%)'
    },
    // weather_describe: {
    //   type: DataTypes.STRING(200),
    //   comment: '天气描述'          // 原SQL注释为“数据源”
    // },
    pressure: {
      type: DataTypes.DECIMAL(6, 2),
      comment: '气压(hPa)'
    },
    cloud_cover: {
      type: DataTypes.INTEGER,
      comment: '云量(%)'
    },
    visibility: {
      type: DataTypes.DECIMAL(6, 2),
      comment: '能见度(km)'
    },
    uv_index: {
      type: DataTypes.INTEGER,
      comment: '紫外线指数'
    },
    // aqi: {
    //   type: DataTypes.INTEGER,
    //   comment: '空气质量指数'
    // },
    dew: {
      type: DataTypes.STRING(20),
      comment: '露点温度或其他'    
    },
    // data_version: {
    //   type: DataTypes.STRING(20),
    //   comment: '数据版本'
    // },
    is_valid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '数据是否有效'
    },
    // created_at: {
    //   type: DataTypes.DATE,
    //   defaultValue: DataTypes.NOW,
    //   comment: '创建时间'
    // },
    feelslike: {
      type: DataTypes.INTEGER,
      comment: '体感温度'
    },
    wind_gust: {
      type: DataTypes.INTEGER,
      comment: '阵风风速'
    }
  }, {
    sequelize,
    tableName: 'hours_forecasts',   // 指定表名，与SQL一致
    timestamps: true,                 // 不使用默认的 createdAt/updatedAt
    underscored: true,                  // 字段命名使用下划线风格
    comment: '原始小时级别预报数据表',           // 表注释
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

  return HoursForecast;
};