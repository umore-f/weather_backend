'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('daily_errors_wide', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      // humidity
      humidity: { type: Sequelize.FLOAT, allowNull: true },
      humidity_ewma_error: { type: Sequelize.FLOAT, allowNull: true },
      // precip
      precip: { type: Sequelize.FLOAT, allowNull: true },
      precip_ewma_error: { type: Sequelize.FLOAT, allowNull: true },
      // pressure
      pressure: { type: Sequelize.FLOAT, allowNull: true },
      pressure_ewma_error: { type: Sequelize.FLOAT, allowNull: true },
      // temp
      temp: { type: Sequelize.FLOAT, allowNull: true },
      temp_ewma_error: { type: Sequelize.FLOAT, allowNull: true },
      // tempMax
      temp_max: { type: Sequelize.FLOAT, allowNull: true },
      temp_max_ewma_error: { type: Sequelize.FLOAT, allowNull: true },
      // tempMin
      temp_min: { type: Sequelize.FLOAT, allowNull: true },
      temp_min_ewma_error: { type: Sequelize.FLOAT, allowNull: true },
      // timestamps
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('daily_errors_wide', ['city', 'source', 'target_date'], {
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('daily_errors_wide');
  },
};