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
    // humidity
    humidity: { type: DataTypes.FLOAT, allowNull: true },
    humidity_ewma_error: { type: DataTypes.FLOAT, allowNull: true },
    // precip
    precip: { type: DataTypes.FLOAT, allowNull: true },
    precip_ewma_error: { type: DataTypes.FLOAT, allowNull: true },
    // pressure
    pressure: { type: DataTypes.FLOAT, allowNull: true },
    pressure_ewma_error: { type: DataTypes.FLOAT, allowNull: true },
    // temp
    temp: { type: DataTypes.FLOAT, allowNull: true },
    temp_ewma_error: { type: DataTypes.FLOAT, allowNull: true },
    // tempMax
    temp_max: { type: DataTypes.FLOAT, allowNull: true },
    temp_max_ewma_error: { type: DataTypes.FLOAT, allowNull: true },
    // tempMin
    temp_min: { type: DataTypes.FLOAT, allowNull: true },
    temp_min_ewma_error: { type: DataTypes.FLOAT, allowNull: true },
  }, {
    sequelize,
    modelName: 'DailyError',
    tableName: 'daily_errors',   // 确保这里与你实际表名一致（宽表已重命名为 daily_errors）
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['city', 'source', 'target_date'],   // 宽表唯一键（不含 error_type）
      },
    ],
  });

  return DailyError;
};