'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cities', {
      id: {
        type: Sequelize.STRING(20),
        primaryKey: true,
        allowNull: false,
        comment: '城市代码，如 101010100'
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '城市名称'
      },
      province: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '所属省份'
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
      timezone: {
        type: Sequelize.STRING(32),
        defaultValue: 'Asia/Shanghai',
        comment: '时区'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: '是否启用（用于定时任务）'
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
      comment: '城市基础信息表', // 表注释
      engine: 'InnoDB',
      charset: 'utf8mb4',
    });

    // 添加索引
    await queryInterface.addIndex('cities', ['province'], {
      name: 'idx_province'
    });
    await queryInterface.addIndex('cities', ['lat', 'lon'], {
      name: 'idx_location'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cities');
  }
};