const { City } = require("../models");
// 查找城市信息
async function getLatLon(cityName) {
  const city = await City.findOne({
    where: {
      name: cityName,
    },
  });
  if (!city) {
    return null;
  }
  return {
    cityName: cityName,
    lat: city.lat,
    lon: city.lon,
    cityId: city.city_id,
  };
}
module.exports = {
    getLatLon
}