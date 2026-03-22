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
    await queryInterface.addColumn('daily_compre_errors', 'total_error', {
        type: Sequelize.FLOAT,
        allowNull: false,    // 根据需求设置
    });
    await queryInterface.addColumn('daily_compre_errors', 'avg_error', {
        type: Sequelize.FLOAT,
        allowNull: false,    // 根据需求设置
    });
    await queryInterface.addColumn('daily_compre_errors', 'valid_fields', {
        type: Sequelize.INTEGER,
        allowNull: false,    // 根据需求设置
    });
    await queryInterface.removeColumn('daily_compre_errors', 'error_value');
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
