'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trust_scores', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      source: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      target_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      window_days: {
        type: Sequelize.INTEGER,
        defaultValue: 7,
      },
      total_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: { min: 0, max: 100 }, // 注意：validate 在迁移中不生效，仅作文档标记
      },
      humidity_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      precip_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      pressure_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      temp_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      temp_max_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      temp_min_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // 添加唯一索引：city + source + target_date
    await queryInterface.addIndex('trust_scores', ['city', 'source', 'target_date'], {
      unique: true,
      name: 'unique_city_source_target_date',
    });

    // 可选：添加 window_days 索引以提升查询性能
    await queryInterface.addIndex('trust_scores', ['window_days'], {
      name: 'idx_window_days',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('trust_scores');
  },
};