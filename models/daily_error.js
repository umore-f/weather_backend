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
        isIn: [['hefeng', 'tomorrow', 'vc']],
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
  }, {
    sequelize,
    modelName: 'DailyError',
    tableName: 'daily_errors',
    timestamps: true,// 启用 createdAt 和 updatedAt
    underscored: true,               
    // 如果希望字段名在数据库里是 created_at 和 updated_at，取消下面两行的注释：
    // createdAt: 'created_at',
    // updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['city', 'source', 'target_date', 'error_type'],
      },
    ],
  });

  return DailyError;
};