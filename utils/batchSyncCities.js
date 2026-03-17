const axios = require('axios');
const { City } = require('../models'); 
const  syncCityData  = require('../services/fetcher/city')
require('dotenv').config({path:'../.env'});

// 城市列表
const cityList = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '重庆', '苏州',
    '天津', '长沙', '青岛', '西安', '郑州', '合肥', '宁波', '无锡', '济南', '福州',
    '厦门', '东莞', '佛山', '大连', '沈阳', '昆明', '南昌', '哈尔滨', '泉州', '常州',
    '南通', '烟台', '温州', '长春', '南宁', '贵阳', '石家庄', '太原', '珠海', '嘉兴',
    '金华', '绍兴', '潍坊', '徐州', '惠州', '台州', '呼和浩特', '乌鲁木齐', '扬州', '中山'
];

// 并发控制函数：每次最多并发 N 个请求
async function runBatch(cities, concurrency = 5) {
    const results = [];
    for (let i = 0; i < cities.length; i += concurrency) {
        const batch = cities.slice(i, i + concurrency);
        console.log(`正在处理批次 ${i / concurrency + 1}, 城市: ${batch.join(', ')}`);

        const promises = batch.map(city => syncCityData(city).catch(err => null)); // 捕获单个错误，不影响批次
        const batchResults = await Promise.allSettled(promises); // 使用 allSettled 获取每个结果状态

        batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                console.error(`批次内城市 ${batch[index]} 处理失败:`, result.reason);
            }
        });

        // 可选：每批处理后等待一小段时间，避免请求过密
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return results.filter(Boolean);
}

// 启动批量同步
(async () => {
    console.log(`开始批量同步 ${cityList.length} 个城市...`);
    const start = Date.now();
    const inserted = await runBatch(cityList, 5); // 并发数可根据需要调整
    console.log(`批量同步完成，成功处理 ${inserted.length} 个城市，耗时 ${(Date.now() - start) / 1000} 秒`);
})();