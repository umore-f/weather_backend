'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TrustScore extends Model {
    static associate(models) {
      // 定义关联（如有需要）
    }
  }

  TrustScore.init({
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
    window_days: {
      type: DataTypes.INTEGER,
      defaultValue: 7,
    },
    // 总分
    total_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    // 各子分
    humidity_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    precip_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    pressure_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    temp_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    temp_max_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
    temp_min_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0, max: 100 },
    },
  }, {
    sequelize,
    modelName: 'TrustScore',
    tableName: 'trust_scores',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['city', 'source', 'target_date'],   // 每个城市+来源+日期唯一
      },
      {
        fields: ['window_days'],   // 可选，便于按窗口查询
      },
    ],
  });

  return TrustScore;
};