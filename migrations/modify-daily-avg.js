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
        await queryInterface.addColumn('daily_avgs', 'temp_valid_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('daily_avgs', 'temp_max_valid_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('daily_avgs', 'temp_min_valid_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('daily_avgs', 'humidity_valid_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('daily_avgs', 'precip_valid_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('daily_avgs', 'pressure_valid_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });

        // ========== filteredCounts（过滤后记录数） ==========
        await queryInterface.addColumn('daily_avgs', 'temp_filtered_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('daily_avgs', 'temp_max_filtered_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('daily_avgs', 'temp_min_filtered_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('daily_avgs', 'humidity_filtered_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('daily_avgs', 'precip_filtered_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
        await queryInterface.addColumn('daily_avgs', 'pressure_filtered_count', {
            type: Sequelize.INTEGER,
            allowNull: true,
        });
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
