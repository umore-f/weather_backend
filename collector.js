const { startScheduler } = require('./cron/weatherCron')
console.log("数据采集进程启动，开始定时拉取天气...");
startScheduler();
process.stdin.resume();