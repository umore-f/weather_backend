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
    target_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    temp_valid_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    temp_max_valid_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    temp_min_valid_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    humidity_valid_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    precip_valid_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pressure_valid_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    temp_filtered_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    temp_max_filtered_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    temp_min_filtered_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    humidity_filtered_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    precip_filtered_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pressure_filtered_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    temp: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    temp_max: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    temp_min: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    humidity: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    precip: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    pressure: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    total_records: {
      type: DataTypes.INTEGER,
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
        fields: ['city', 'target_date']
      },
    ],
  });

  return DailyAvg;
};