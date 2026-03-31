'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DailyAvg extends Model {
    static associate(models) {
      // 定义关联
    }
  }

  DailyAvg.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    error_value: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'DailyAvg',
    tableName: 'daily_avgs',
    timestamps: true,// 启用 createdAt 和 updatedAt
    underscored: true,               
    indexes: [
      {
        unique: true,
        fields: ['city', 'source', 'target_date'],

      },
    ],
  });

  return DailyAvg;
};