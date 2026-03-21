'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('trust_scores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      city: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      source: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      score_type: {
        type: Sequelize.STRING(10),
        defaultValue: 'temp_max',
      },
      score: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      window_days: {
        type: Sequelize.INTEGER,
        defaultValue: 7,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 添加唯一约束
    await queryInterface.addIndex('trust_scores', ['city', 'source', 'score_type'], {
      unique: true,
      name: 'trust_scores_unique_constraint',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('trust_scores');
  },
};