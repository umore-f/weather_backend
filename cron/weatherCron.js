// scheduler.js
const cron = require('node-cron');
const { updateAllCities, updateAllCitiesHours } = require('../services/dbUpdater/weatherDbUpdater/index');
const { setErrors, setScore } = require('../services/dbUpdater/errorDbUpdater/errorDbUpdater');

/**
 * 启动所有定时任务
 * @param {Object} options 可选的配置项
 * @param {string} options.cronCities 更新城市数据的 cron 表达式，默认 '30 18 * * *'
 * @param {string} options.cronErrors 更新错误数据的 cron 表达式，默认 '30 20 * * *'
 * @param {string} options.timezone 时区，默认 'Asia/Shanghai'
 */
function startScheduler(options = {}) {
    const {
        cronCities = process.env.CRON_CITIES || '30 14 * * *',
        cronErrors = process.env.CRON_ERRORS || '30 16 * * *',
        cronHours = process.env.CRON_ERRORS || '0 */2 * * *',
        timezone = process.env.TZ || 'Asia/Shanghai',
    } = options;

    // 任务1：更新所有城市天气数据
    cron.schedule(cronCities, async () => {
        console.log(`[${new Date().toISOString()}] 定时任务触发：开始更新城市天气数据`);
        try {
            await updateAllCities();
            console.log(`[${new Date().toISOString()}] 城市天气数据更新完成`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 城市天气数据更新失败:`, error);
        }
    }, { timezone });

    // 任务2：更新错误数据和评分
    cron.schedule(cronErrors, async () => {
        console.log(`[${new Date().toISOString()}] 定时任务触发：开始更新错误数据和评分`);
        try {
            await Promise.all([setErrors(), setScore()]); // 并发执行，或按顺序：await setErrors(); await setScore();
            console.log(`[${new Date().toISOString()}] 错误数据和评分更新完成`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 错误数据和评分更新失败:`, error);
        }
    }, { timezone });

    // 任务3：更新小时级数据
    cron.schedule(cronHours, async () => {
        console.log(`[${new Date().toISOString()}] 定时任务触发：开始更新小时级天气数据`);
        try {
            await updateAllCitiesHours();
            console.log(`[${new Date().toISOString()}] 城市小时级天气数据更新完成`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 城市小时级天气数据更新失败:`, error);
        }
    }, { timezone });
    console.log(`定时任务已启动：`);
    console.log(`  - 城市天气数据更新：${cronCities} (${timezone})`);
    console.log(`  - 错误数据与评分更新：${cronErrors} (${timezone})`);
    console.log(`  - 城市小时级天气数据更新：${cronHours} (${timezone})`);
}

// 导出启动函数
module.exports = { startScheduler };