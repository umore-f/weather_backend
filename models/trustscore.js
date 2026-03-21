'use strict';
const { Model, DataTypes } = require('sequelize');

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
      validate: {
        isIn: [['hefeng', 'tomorrow', 'vc']], // 可选项，模拟枚举
      },
    },
    score_type: {
      type: DataTypes.STRING(10),
      defaultValue: 'temp_max',
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    window_days: {
      type: DataTypes.INTEGER,
      defaultValue: 7,
    },
  }, {
    sequelize,
    modelName: 'TrustScore',
    tableName: 'trust_scores',
    timestamps: true,               // 启用 createdAt 和 updatedAt
    underscored: true, 
    // 如果希望数据库字段名为 created_at / updated_at，取消注释：
    // createdAt: 'created_at',
    // updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['city', 'source', 'score_type'],
      },
    ],
  });

  return TrustScore;
};