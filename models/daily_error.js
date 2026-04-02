'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DailyError extends Model {
    static associate(models) {
      // 定义关联
    }
  }

  DailyError.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['QWeather', 'tomorrow.io', 'visualcrossing']],
      },
    },
    target_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    error_type: {
      type: DataTypes.STRING(10),
      defaultValue: 'temp_max',
    },
    error_value: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    ewma_error: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'DailyError',
    tableName: 'daily_errors',
    timestamps: true,// 启用 createdAt 和 updatedAt
    underscored: true,               
    indexes: [
      {
        unique: true,
        fields: ['city', 'source', 'target_date', 'error_type'],
        // fields: ['target_date'],
      },
    ],
  });

  return DailyError;
};