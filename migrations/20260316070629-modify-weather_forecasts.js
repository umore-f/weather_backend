'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // await queryInterface.addColumn('weather_forecasts', 'feelslike', {
    //   type: Sequelize.STRING,
    //   allowNull: true,      
    // });
    await queryInterface.removeColumn('weather_forecasts','windgust')
    await queryInterface.changeColumn('weather_forecasts', 'wind_gust', {
      type: Sequelize.STRING,
      allowNull: true,      
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
