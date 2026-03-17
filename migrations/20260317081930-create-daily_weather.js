'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('daily_weather', {
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
      fetch_time: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '数据抓取时间'
      },
      temp_max: {
        type: Sequelize.DECIMAL(5, 2),
        comment: '温度(℃)'
      },
      temp_min: {
        type: Sequelize.DECIMAL(5, 2),
        comment: '温度(℃)'
      },
      humidity_avg: {
        type: Sequelize.INTEGER,
        comment: '湿度(%)'
      },
      precip_total: {
        type: Sequelize.DECIMAL(5, 2),
        comment: '降水量(mm)'
      },
      wind_speed_avg: {
        type: Sequelize.DECIMAL(5, 2),
        comment: '风速(m/s)'
      },
      wind_direction_avg: {
        type: Sequelize.INTEGER,
        comment: '风向(度)'
      },
      pressure_avg: {
        type: Sequelize.DECIMAL(6, 2),
        comment: '平均气压(hPa)'
      },
      uv_index_avg: {
        type: Sequelize.INTEGER,
        comment: '紫外线指数'
      },
      wind_gust: {
        type: Sequelize.INTEGER,
        comment: '阵风风速'
      },
      weather_text: {
        type: Sequelize.STRING,
        comment: '天气描述文字'  // 补充注释
      },
      sunrise: {
        type: Sequelize.TIME,
        comment: '日出时间'
      },
      sunset: {
        type: Sequelize.TIME,
        comment: '日落时间'
      },
      cloud_cover_avg: {
        type: Sequelize.INTEGER,
        comment: '云量(%)'
      },
      visibility_avg: {
        type: Sequelize.DECIMAL(6, 2),
        comment: '能见度(km)'
      },
      precip_prob_avg: {
        type: Sequelize.INTEGER,
        comment: '降水概率(%)'
      },
      source: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '数据源'
      },
      weather_describe: {
        type: Sequelize.STRING(200),
        comment: '天气描述'  // 模型注释
      },
      // 时间戳字段（timestamps: true）
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: '创建时间'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        comment: '更新时间'
      }
    }, {
      comment: '原始天级别预报数据表',  // 表注释
      // 如需指定存储引擎、字符集等，可在此添加
      engine: 'InnoDB',
      charset: 'utf8mb4',
    });

    // 添加索引（与模型中 indexes 数组对应）
    // 1. 复合索引 (lon, lat, forecast_time)
    await queryInterface.addIndex('daily_weather', ['lon', 'lat', 'forecast_time'], {
      name: 'idx_location_time'
    });
    // 2. 复合索引 (source, forecast_time)
    await queryInterface.addIndex('daily_weather', ['source', 'forecast_time'], {
      name: 'idx_source_time'
    });
    // 3. 单列索引 (forecast_time)
    await queryInterface.addIndex('daily_weather', ['forecast_time'], {
      name: 'idx_forecast_time'
    });
    // 4. 唯一索引 (city, forecast_time, source)
    await queryInterface.addIndex('daily_weather', ['city', 'forecast_time', 'source'], {
      name: 'unique_city_time_source',
      unique: true
    });
    // 3. 添加按月 RANGE 分区（颗粒度：年-月）
    const startYear = 2025;  // 可根据实际数据调整起始年份
    const endYear = 2030;    // 可根据需要调整结束年份
    const partitions = [];

    // 历史分区：存放早于 startYear 的数据
    partitions.push(`PARTITION p_history VALUES LESS THAN (TO_DAYS('${startYear}-01-01'))`);

    // 按月生成 startYear 到 endYear 的分区
    for (let year = startYear; year <= endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        // 计算下个月的第一天作为分区边界
        let nextMonth = month + 1;
        let nextYear = year;
        if (nextMonth > 12) {
          nextMonth = 1;
          nextYear = year + 1;
        }
        const boundaryDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
        const partitionName = `p${year}${String(month).padStart(2, '0')}`;
        partitions.push(`PARTITION ${partitionName} VALUES LESS THAN (TO_DAYS('${boundaryDate}'))`);
      }
    }

    // 未来分区：存放超出 endYear 的数据
    partitions.push(`PARTITION p_future VALUES LESS THAN MAXVALUE`);

    const partitionSQL = `
      ALTER TABLE daily_weather
      PARTITION BY RANGE (TO_DAYS(forecast_time)) (
        ${partitions.join(',\n        ')}
      );
    `;

    await queryInterface.sequelize.query(partitionSQL);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('daily_weather');
  }
};