'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserSetting extends Model {
    static associate(models) {
      // 关联 User 模型
      UserSetting.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
    }
  }

  UserSetting.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,  // 一对一：一个用户只能有一条设置记录
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    display_cities: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],  // 默认空数组
      validate: {
        isValidArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('display_cities must be an array');
          }
        },
      },
    },
    weather_fields: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('weather_fields must be an array');
          }
        },
      },
    },
    data_sources: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isValidArray(value) {
          if (!Array.isArray(value)) {
            throw new Error('data_sources must be an array');
          }
        },
      },
    },
    date_start: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    date_end: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isAfterStart(value) {
          if (this.date_start && value && value < this.date_start) {
            throw new Error('date_end cannot be before date_start');
          }
        },
      },
    },
  }, {
    sequelize,
    modelName: 'UserSetting',
    tableName: 'user_settings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id'],
      },
    ],
  });

  return UserSetting;
};