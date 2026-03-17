
const axios = require('axios'); // 用于发送HTTP请求
const { current_weather } = require('../models'); // 引入你的Sequelize模型


async function syncWeatherData() {
    try {
        // 1. 从外部API获取数据
        console.log('正在从API获取数据...');
        // 使用 axios 发送 GET 请求 [citation:4]
        // const cityInfo1 = await axios.get(`http://127.0.0.1:9000/hf_search_city?location=${cityName}`)
         
        const response = await axios.get('http://127.0.0.1:9000/hf_now?location=101010100', {
            timeout: 10000 // 设置10秒超时，防止请求卡死
        });
        console.log("!!!!!!!!!",response.data);
        
        const currentWeathers = response.data;
        // const cityInfo = cityInfo1.data
        // if (cityInfo.length)
        console.log(`成功获取 ${currentWeathers.length} 条用户数据`);

        // 2. 数据清洗与映射：将API数据转换为模型需要的格式
        const { now, refer, ...rest } = currentWeathers;
        const processedCurrentWeathers = { ...rest, ...now, ...refer };
        // 3. 存入数据库
        console.log('正在将数据写入数据库...');
        // 使用 bulkCreate 进行批量插入，效率更高 [citation:2][citation:6]
        // 这里添加了 updateOnDuplicate 选项，如果遇到重复的email，则更新名字字段
        console.log("@@@@@@@@@@@@@@@@",processedCurrentWeathers);
        await current_weather.destroy({ truncate: true }); // 清空旧数据（若想保留历史则去掉这行）
        const result = await current_weather.bulkCreate([processedCurrentWeathers]);
        console.log(`成功写入 ${result.length} 条数据`);

    } catch (error) {
        console.error('同步过程中发生错误:', error);
    }
}
module.exports = syncWeatherData;
// 执行同步函数