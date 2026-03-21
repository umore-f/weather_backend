'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 删除旧索引（如果有）
    await queryInterface.removeIndex('daily_weather', 'unique_city_time_source');
    
    // 添加新的唯一联合索引
    await queryInterface.addIndex('daily_weather', ['city', 'forecast_time', 'source', 'type'], {
      unique: true,
      name: 'unique_city_time_source_type'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 回滚时恢复旧索引
    await queryInterface.removeIndex('daily_weather', 'unique_city_time_source_type');
    await queryInterface.addIndex('daily_weather', ['city', 'forecast_time', 'source'], {         
      name: 'unique_city_time_source',
      unique: true, 
    });
  }
};