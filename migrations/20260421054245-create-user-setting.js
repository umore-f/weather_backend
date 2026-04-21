'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_settings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      display_cities: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      weather_fields: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      data_sources: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      date_start: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      date_end: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // 添加外键索引（可选，但 unique 已隐式创建索引）
    await queryInterface.addIndex('user_settings', ['user_id'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_settings');
  },
};