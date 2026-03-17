'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('weather_forecasts', {
      // 复合主键第一部分（自增）
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        comment: '自增ID'
      },
      // 复合主键第二部分
      forecast_time: {
        type: Sequelize.DATE,
        primaryKey: true,
        allowNull: false,
        comment: '预报时间点（北京时间）'
      },
      city: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '城市名字'
      },
      source: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '数据源'
      },
      lat: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false,
        comment: '纬度'
      },
      lon: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: false,
        comment: '经度'
      },
      temperature: {
        type: Sequelize.DECIMAL(5, 2),
        comment: '温度(℃)'
      },
      humidity: {
        type: Sequelize.INTEGER,
        comment: '湿度(%)'
      },
      wind_speed: {
        type: Sequelize.DECIMAL(5, 2),
        comment: '风速(m/s)'
      },
      wind_direction: {
        type: Sequelize.INTEGER,
        comment: '风向(度)'
      },
      precipitation: {
        type: Sequelize.DECIMAL(5, 2),
        comment: '降水量(mm)'
      },
      precipitation_probability: {
        type: Sequelize.INTEGER,
        comment: '降水概率(%)'
      },
      pressure: {
        type: Sequelize.DECIMAL(6, 2),
        comment: '气压(hPa)'
      },
      cloud_cover: {
        type: Sequelize.INTEGER,
        comment: '云量(%)'
      },
      visibility: {
        type: Sequelize.DECIMAL(6, 2),
        comment: '能见度(km)'
      },
      uv_index: {
        type: Sequelize.INTEGER,
        comment: '紫外线指数'
      },
      dew: {
        type: Sequelize.STRING(20),
        comment: '露点温度或其他'
      },
      data_version: {
        type: Sequelize.STRING(20),
        comment: '数据版本'
      },
      is_valid: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: '数据是否有效'
      },
      feelslike: {
        type: Sequelize.INTEGER,
        comment: '体感温度'
      },
      wind_gust: {
        type: Sequelize.INTEGER,
        comment: '阵风风速'
      },
      // 时间戳字段（timestamps: true + underscored: true）
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '创建时间'
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: '更新时间'
      }
    }, {
      comment: '原始小时级别预报数据表', // 表注释
      engine: 'InnoDB',
      charset: 'utf8mb4',
    });

    // 添加索引（与模型中 indexes 数组一致）
    // 1. 复合索引 (lon, lat, forecast_time)
    await queryInterface.addIndex('weather_forecasts', ['lon', 'lat', 'forecast_time'], {
      name: 'idx_location_time'
    });
    // 2. 复合索引 (source, forecast_time)
    await queryInterface.addIndex('weather_forecasts', ['source', 'forecast_time'], {
      name: 'idx_source_time'
    });
    // 3. 单列索引 (forecast_time)
    await queryInterface.addIndex('weather_forecasts', ['forecast_time'], {
      name: 'idx_forecast_time'
    });
    // 4. 唯一索引 (city, forecast_time, source)
    await queryInterface.addIndex('weather_forecasts', ['city', 'forecast_time', 'source'], {
      name: 'unique_city_time_source',
      unique: true
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE weather_forecasts
      PARTITION BY RANGE (TO_DAYS(forecast_time)) (
        PARTITION p202601 VALUES LESS THAN (TO_DAYS('2026-02-01')),
        PARTITION p202602 VALUES LESS THAN (TO_DAYS('2026-03-01')),
        PARTITION p202603 VALUES LESS THAN (TO_DAYS('2026-04-01')),
        PARTITION p202604 VALUES LESS THAN (TO_DAYS('2026-05-01')),
        PARTITION p_future VALUES LESS THAN MAXVALUE
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('weather_forecasts');
  }
};