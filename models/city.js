'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class City extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
 City.init({
    id: {
      type: DataTypes.STRING(20),      // VARCHAR(20)
      primaryKey: true,                 // 主键
      allowNull: false,
      comment: 'id'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '城市名称'
    },
    province: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '所属省份'
    },
    lat: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      comment: '纬度'
    },
    lon: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: false,
      comment: '经度'
    },
    timezone: {
      type: DataTypes.STRING(32),
      defaultValue: 'Asia/Shanghai',
      comment: '时区'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用（用于定时任务）'
    }
  }, {
    sequelize,
    modelName: 'City',
    tableName: 'cities',                // 指定表名
    timestamps: true,                    // 是否启用时间戳
    underscored: true,                   // 将 createdAt 映射为 created_at，updatedAt 映射为 updated_at
    comment: '城市基础信息表',           // 表注释
    indexes: [                           // 定义索引
      {
        name: 'idx_province',
        fields: ['province']
      },
      {
        name: 'idx_location',
        fields: ['lat', 'lon']
      }
    ]
  });
  return City;
};