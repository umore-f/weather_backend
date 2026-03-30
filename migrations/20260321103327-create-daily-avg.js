'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('daily_avgs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      target_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      error_type: {
        type: Sequelize.STRING(10),
        defaultValue: 'temp_max',
      },
      error_value: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
        count: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 添加唯一约束（复合唯一索引）
    await queryInterface.addIndex('daily_errors', ['city', 'source', 'target_date', 'error_type'], {
      unique: true,
      name: 'daily_errors_unique_constraint', // 可选，自定义索引名
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('daily_errors');
  },
};