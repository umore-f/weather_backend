'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('current_weathers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      code: {
        type: Sequelize.STRING
      },
      updateTime: {
        type: Sequelize.STRING
      },
      fxLink: {
        type: Sequelize.STRING
      },
      obsTime: {
        type: Sequelize.STRING
      },
      temp: {
        type: Sequelize.INTEGER
      },
      feelsLike: {
        type: Sequelize.INTEGER
      },
      icon: {
        type: Sequelize.STRING
      },
      text: {
        type: Sequelize.STRING
      },
      wind360: {
        type: Sequelize.INTEGER
      },
      windDir: {
        type: Sequelize.STRING
      },
      windScale: {
        type: Sequelize.INTEGER
      },
      windSpeed: {
        type: Sequelize.INTEGER
      },
      humidity: {
        type: Sequelize.INTEGER
      },
      precip: {
        type: Sequelize.FLOAT
      },
      pressure: {
        type: Sequelize.INTEGER
      },
      vis: {
        type: Sequelize.INTEGER
      },
      cloud: {
        type: Sequelize.INTEGER
      },
      dew: {
        type: Sequelize.INTEGER
      },
      sources: {
        type: Sequelize.JSON
      },
      license: {
        type: Sequelize.JSON
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
    await queryInterface.dropTable('current_weathers');
  }
};