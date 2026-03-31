'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        // ========== validCounts（有效记录数） ==========
        // await queryInterface.addColumn('daily_avgs', 'temp', {
        //     type: Sequelize.FLOAT,
        //     allowNull: true,
        // });
        // await queryInterface.addColumn('daily_avgs', 'tempMax', {
        //     type: Sequelize.FLOAT,
        //     allowNull: true,
        // });
        // await queryInterface.addColumn('daily_avgs', 'tempMin', {
        //     type: Sequelize.FLOAT,
        //     allowNull: true,
        // });
        // await queryInterface.addColumn('daily_avgs', 'humidity', {
        //     type: Sequelize.FLOAT,
        //     allowNull: true,
        // });
        // await queryInterface.addColumn('daily_avgs', 'precip', {
        //     type: Sequelize.FLOAT,
        //     allowNull: true,
        // });
        // await queryInterface.addColumn('daily_avgs', 'pressure', {
        //     type: Sequelize.FLOAT,
        //     allowNull: true,
        // });
        // await queryInterface.addColumn('daily_avgs', 'total_records', {
        //     type: Sequelize.INTEGER,
        //     allowNull: true,
        // });
        await queryInterface.removeColumn('daily_avgs', 'error_type');
        await queryInterface.removeColumn('daily_avgs', 'count');
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
    }
};
