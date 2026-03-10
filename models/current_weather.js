'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class current_weather extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  current_weather.init({
    code: DataTypes.STRING,
    updateTime: DataTypes.STRING,
    fxLink: DataTypes.STRING,
    obsTime: DataTypes.STRING,
    temp: DataTypes.INTEGER,
    feelsLike: DataTypes.INTEGER,
    icon: DataTypes.STRING,
    text: DataTypes.STRING,
    wind360: DataTypes.INTEGER,
    windDir: DataTypes.STRING,
    windScale: DataTypes.INTEGER,
    windSpeed: DataTypes.INTEGER,
    humidity: DataTypes.INTEGER,
    precip: DataTypes.FLOAT,
    pressure: DataTypes.INTEGER,
    vis: DataTypes.INTEGER,
    cloud: DataTypes.INTEGER,
    dew: DataTypes.INTEGER,
    sources: DataTypes.JSON,
    license: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'current_weather',
  });
  return current_weather;
};