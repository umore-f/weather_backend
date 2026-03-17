'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('daily_weathers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      date: {
        type: Sequelize.DATE
      },
      temp_max: {
        type: Sequelize.DECIMAL
      },
      temp_min: {
        type: Sequelize.DECIMAL
      },
      humidity_avg: {
        type: Sequelize.DECIMAL
      },
      precip_total: {
        type: Sequelize.DECIMAL
      },
      wind_speed_avg: {
        type: Sequelize.DECIMAL
      },
      wind_direction_avg: {
        type: Sequelize.DECIMAL
      },
      pressure_avg: {
        type: Sequelize.DECIMAL
      },
      uv_index_avg: {
        type: Sequelize.DECIMAL
      },
      weather_text: {
        type: Sequelize.STRING
      },
      sunrise: {
        type: Sequelize.TIME
      },
      sunset: {
        type: Sequelize.TIME
      },
      cloud_cover_avg: {
        type: Sequelize.DECIMAL
      },
      visibility_avg: {
        type: Sequelize.DECIMAL
      },
      precip_prob_avg: {
        type: Sequelize.DECIMAL
      },
      source: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('daily_weathers');
  }
};