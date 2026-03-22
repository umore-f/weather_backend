'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DailyCompreError extends Model {
    static associate(models) {
      // 定义关联
    }
  }

  DailyCompreError.init({
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
    },
    target_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_error: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    avg_error: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    valid_fields: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'DailyCompreError',
    tableName: 'daily_compre_errors',
    timestamps: true,// 启用 createdAt 和 updatedAt
    underscored: true,               
    indexes: [
      {
        unique: true,
        fields: ['city', 'source', 'target_date'],
      },
    ],
  });

  return DailyCompreError;
};