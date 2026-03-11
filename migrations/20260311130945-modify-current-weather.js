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
    // await queryInterface.addColumn('current_weathers', 'cityName', {
    //   type:Sequelize.STRING,
    //   allowNull: true,
    // })
    // await queryInterface.addColumn('current_weathers', 'precipprob', {
    //   type:Sequelize.STRING,
    //   allowNull: true,
    //   defaultValue: null
    // })
    //     await queryInterface.addColumn('current_weathers', 'snow', {
    //   type:Sequelize.STRING,
    //   allowNull: true,
    //   defaultValue: null
    // })
    //     await queryInterface.addColumn('current_weathers', 'snowdepth', {
    //   type:Sequelize.STRING,
    //   allowNull: true,
    //   defaultValue: null
    // })
    //     await queryInterface.addColumn('current_weathers', 'windgust', {
    //   type:Sequelize.STRING,
    //   allowNull: true,
    //   defaultValue: null
    // })
    //     await queryInterface.addColumn('current_weathers', 'solarradiation', {
    //   type:Sequelize.STRING,
    //   allowNull: true,
    //   defaultValue: null
    // })
    //     await queryInterface.addColumn('current_weathers', 'solarenergy', {
    //   type:Sequelize.STRING,
    //   allowNull: true,
    //   defaultValue: null
    // })
    await queryInterface.addColumn('current_weathers', 'uvindex', {
      type:Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    })
    await queryInterface.removeColumn('current_weathers', 'code');
    await queryInterface.removeColumn('current_weathers', 'fxLink');
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
