const axios = require('axios'); // 用于发送HTTP请求
const { City } = require('../models'); // 引入你的Sequelize模型
require('dotenv').config({ path: '../../.env' })
const {getValidToken} = require('../token')

/**
 * 从API获取用户数据并存入本地数据库
 */
async function syncCityData(cityName) {
    try {
        // 1. 从外部API获取数据
        console.log('正在从API获取数据...');
        // 使用 axios 发送 GET 请求 [citation:4]
        // const cityInfo1 = await axios.get(`http://127.0.0.1:9000/hf_search_city?location=${cityName}`)
        const token = await getValidToken();
        const response = await axios.get(`https://${process.env.API_HOST}/geo/v2/city/lookup`, {
            params: { 
                number:1,
                location: cityName
             },
            headers: {
                'Authorization': `Bearer ${token}` 
            } 
        });
        if (!response.data || response.data.length === 0) {
            console.log(`⚠️ 未找到城市: ${cityName}`);
            return null;
        }
        console.log("!!!!!!!!!",response.data.location[0]);
        
        const { name, lat, lon, adm1:province, id:city_id } = response.data.location[0];
        const cityData = { name, lat, lon, province,city_id }

        // 3. 存入数据库
        console.log('正在将数据写入数据库...');
        // await current_weather.destroy({ truncate: true }); // 清空旧数据（若想保留历史则去掉这行）
        const [city, created] = await City.upsert(cityData);
        return city;
    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
// syncCityData()
module.exports = syncCityData;