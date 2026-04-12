const cron = require('node-cron');
const { Mutex } = require('async-mutex');
const {
    setErrors, setReal, setScore,
    updateAllCities, updateAllCitiesHours
} = require('../services/dbUpdater/index')

// ==================== 工具函数 ====================

/**
 * 为 Promise 添加超时控制
 * @param {Promise} promise 原始Promise
 * @param {number} ms 超时毫秒数
 * @param {string} taskName 任务名称（用于日志）
 */
async function withTimeout(promise, ms, taskName = '未命名任务') {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`任务 "${taskName}" 执行超时 (${ms}ms)`));
        }, ms);
    });
    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * 带指数退避的重试机制
 * @param {Function} fn 异步函数
 * @param {number} retries 重试次数
 * @param {number} delay 初始延迟(ms)
 */
async function retry(fn, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            console.log(`重试 ${i + 1}/${retries}，等待 ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // 指数退避
        }
    }
}

// ==================== 互斥锁实例 ====================
const mutexCities = new Mutex();
const mutexHours = new Mutex();
const mutexErrors = new Mutex();

/**
 * 启动所有定时任务
 * @param {Object} options 可选的配置项
 */
function startScheduler(options = {}) {
    const {
        cronCities = process.env.CRON_CITIES || '00 14 * * *',
        cronErrors = process.env.CRON_ERRORS || '00 17 * * *',
        cronHours = process.env.CRON_HOURS || '00 18 * * *',
        timezone = process.env.TZ || 'Asia/Shanghai'
    } = options;

    // 任务1：更新所有城市天气数据（日级）
    cron.schedule(cronCities, async () => {
        if (mutexCities.isLocked()) {
            console.log(`[${new Date().toISOString()}] 上一次城市数据更新仍在运行，跳过本次`);
            return;
        }
        const release = await mutexCities.acquire();
        try {
            console.log(`[${new Date().toISOString()}] 定时任务触发：开始更新城市天气数据`);
            // 超时30分钟 + 重试2次
            await retry(() => withTimeout(updateAllCities(), 30 * 60 * 1000, 'updateAllCities'), 2, 5000);
            console.log(`[${new Date().toISOString()}] 城市天气数据更新完成`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 城市天气数据更新失败:`, error);
        } finally {
            release();
        }
    }, { timezone });

    // 任务2：更新错误数据和评分
    cron.schedule(cronErrors, async () => {
        if (mutexErrors.isLocked()) {
            console.log(`[${new Date().toISOString()}] 上一次错误数据更新仍在运行，跳过`);
            return;
        }
        const release = await mutexErrors.acquire();
        try {
            console.log(`[${new Date().toISOString()}] 定时任务触发：开始更新错误数据和评分`);
            await retry(() => withTimeout(setReal(), 10 * 60 * 1000, 'setReal'), 2, 5000);
            await retry(() => withTimeout(setErrors(), 10 * 60 * 1000, 'setErrors'), 2, 5000);
            await retry(() => withTimeout(setScore(), 10 * 60 * 1000, 'setScore'), 2, 5000);
            console.log(`[${new Date().toISOString()}] 错误数据和评分更新完成`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 错误数据和评分更新失败:`, error);
        } finally {
            release();
        }
    }, { timezone });

    // 任务3：更新小时级数据
    cron.schedule(cronHours, async () => {
        if (mutexHours.isLocked()) {
            console.log(`[${new Date().toISOString()}] 上一次小时级数据更新仍在运行，跳过`);
            return;
        }
        const release = await mutexHours.acquire();
        try {
            console.log(`[${new Date().toISOString()}] 定时任务触发：开始更新小时级天气数据`);
            await retry(() => withTimeout(updateAllCitiesHours(), 40 * 60 * 1000, 'updateAllCitiesHours'), 2, 5000);
            console.log(`[${new Date().toISOString()}] 城市小时级天气数据更新完成`);
        } catch (error) {
            console.error(`[${new Date().toISOString()}] 城市小时级天气数据更新失败:`, error);
        } finally {
            release();
        }
    }, { timezone });

    console.log(`定时任务已启动（超时+重试+防重叠+严格限流）：`);
    console.log(`  - 城市天气数据更新：${cronCities} (${timezone})`);
    console.log(`  - 错误数据与评分更新：${cronErrors} (${timezone})`);
    console.log(`  - 城市小时级天气数据更新：${cronHours} (${timezone})`);
}

module.exports = { startScheduler };