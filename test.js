const { getError, getOneError, getEWMAError } = require('./controllers/score')


const {  setErrors1,setScore, computeCityErrors } = require('./services/dbUpdater/realErrorScoreDbupdate/errorDbUpdater')


const { selfConsistentBaseline,setReal1 } = require('./services/dbUpdater/realErrorScoreDbupdate/avgDbUpdater')


const { getHistoryWeather, getNextWeather } = require('./controllers/weatherController')


const { FIELDS_CAL, CITY_LIST, SOURCE_LIST, FIELD_CONFIGS } = require('./utils/constants')


const { getRobustRealValue, calculateErrors } = require('./services/fetcher/processingData')


const { getRealData, getRealDataList } = require('./controllers/realData')


const db = require('./models')


const { TrustScore } = db

// async function name() {
//     // const r = await getRealData('北京','2026-04-08')
//     // const r1  = await getNextWeather('北京','2026-04-08')
//     let r3 = []
//     for (const city of CITY_LIST) {
//         const r2 = await computeCityErrors(city,'2026-04-08')
//         r3.push(r2)
        
//     }
//     const r4 = r3.flat()
//     // const r2 = await computeCityErrors('北京','2026-04-08')
//     console.log("!!!!!!!!!!",r4);
// }
// name()
// const errors = calculateErrors({
//   city: '北京',
//   targetDate: '2026-04-08',
//   temp: 13.45,
//   temp_max: 21,
//   temp_min: 6.47,
//   humidity: 53.01,
//   precip: 0.05,
//   pressure: 1007.32
// },[
//   {
//     city: '北京',
//     forecast_time: '2026-04-08',
//     temp_max: 21,
//     temp_min: 9,
//     temp: 15,
//     humidity: 80,
//     precip: 0,
//     pressure: 998,
//     source: 'QWeather'
//   },
//   {
//     city: '北京',
//     forecast_time: '2026-04-08',
//     temp_max: 20.41,
//     temp_min: 6.47,
//     temp: 13.44,
//     humidity: 53,
//     precip: 8.2,
//     pressure: 1007.33,
//     source: 'tomorrow.io'
//   },
//   {
//     city: '北京',
//     forecast_time: '2026-04-08',
//     temp_max: 21.9,
//     temp_min: 2,
//     temp: 13.3,
//     humidity: 43,
//     precip: 0,
//     pressure: 1009.9,
//     source: 'visualcrossing'
//   }
// ])

// console.log("1!!!!!!!!!!!!!!",errors);

// getError('北京','QWeather')
// getCompreError('北京','QWeather')
// getErrors('北京')
// getSingleError('北京')
// getCompreErrorFromDb()
// getSingleScore('北京','QWeather')
// updateAllCities()
// setErrors()
// setScore()
// async function geyH(city) {
//     const value = await getHistoryWeather(city)

//     const result = FIELDS_CAL.map(field => value.map(item => item[field])).map(item=>getRobustRealValue(item))
//     console.log("!!!!!!!",result);

// }
// geyH('北京')
// const dataList = ['2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30', '2026-03-31', '2026-04-01']
const dateList = [
  '2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30', '2026-03-31',
  '2026-04-01', '2026-04-02', '2026-04-03', '2026-04-04', '2026-04-05',
  '2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09', '2026-04-10',
  '2026-04-11', '2026-04-12', '2026-04-13'
];
async function name() {
    for (const dateStr of dateList) {
        // await setReal1(dateStr)
        // await setErrors1(dateStr)
        
    }
}
name()
// async function setReal (dataList,CITY_LIST) {
//     for (const dataStr of dataList) {
//     for (const city of CITY_LIST) {
//        await setAverage(city,dataStr)
//     }
// }
// }
// setReal(dataList,CITY_LIST)
// setReal(['2026-03-27'],['北京'])
// async function name(params) {
//     const qwe = await getRealData('北京','2026-03-27')
//     console.log("!!!!!!",qwe);

// }
// const FIELDS_CAL = ['tempMax', 'tempMin', 'temp', 'humidity', 'precip', 'pressure']
// 数据源
// const SOURCE_LIST = ['QWeather', 'tomorrow.io', 'visualcrossing']
// name()
// async function getError1(city, date) {
//     const next = await getNextWeather(city, date)
//     const real = await getRealData(city, date)
//     const results = [];
//     for (const field of FIELDS_CAL) {
//         const result = evaluateFieldCredibility(field,real,next)
//         results.push(result)
//     }
//     return results.flat();
// }
// async function dawd() {
//     const errorResults = await getError1('北京', '2026-03-27');
//     console.log(errorResults); 
// }
// // 拿到所有 result
// dawd()
// setErrors()
// async function qwe() {
//     const result = await getSourceWeights('北京',SOURCE_LIST,'temp')
//     console.log("!!!!!!!!!!",result);

// }
// qwe()

// async function qwe(city) {
//     const resultMap = {};
//     const dateStr = '2026-04-02'
//     for (const field of FIELDS_CAL) {
//         const result = await selfConsistentBaseline(city, field);
//         resultMap[field] = result;
//     }
//     const obj = {
//         city: city,
//         target_date: dateStr,
//         ...resultMap
//     };
//     const { tempMax: temp_max, tempMin: temp_min, ...rest } = obj
//     const updatedObj = { temp_max, temp_min, ...rest }
//     return updatedObj
// }
// async function qwe1() {
//     const result = await qwe('北京')
//     console.log(result);

// }
// qwe1()


// async function qwe(city) {
//     const results = [];

//     for (const target_date of dataList) {
//         const allErrors = await getEWMAError(city, target_date); // 返回所有来源的错误数组
//         // 遍历所有需要关注的来源
//         for (const source of SOURCE_LIST) {
//             const error = allErrors
//                 .filter(item => item.source === source)
//                 .reduce((acc, item) => {
//                     acc[item.error_type] = item.ewma_error;
//                     return acc;
//                 }, {});
//             results.push({
//                 target_date: target_date,
//                 source: source,
//                 city: city,
//                 error: error
//             });
//         }
//     }
//     return results;
// }
// async function qwe1(city) {
//     const errorsList = await qwe(city)
//     for (const errors of errorsList) {
//         const res = calculateNormalizedAverageError({ errors: errors['error'], source: errors.source, target_date: errors.target_date, city: city },
//             FIELD_CONFIGS
//         )
//         const {
//             source,
//             target_date,
//             city:cityName,
//             totalScore,
//             fieldScores: {
//                 humidity,
//                 precip,
//                 pressure,
//                 temp,
//                 tempMax,
//                 tempMin,
//             },
//             window_days,
//         } = res;
//         await TrustScore.upsert({
//             city:cityName,
//             source,
//             target_date,
//             window_days: window_days || 7,
//             total_score: totalScore,
//             humidity_score: humidity,
//             precip_score: precip,
//             pressure_score: pressure,
//             temp_score: temp,
//             temp_max_score: tempMax,
//             temp_min_score: tempMin,
//         });

//         console.log(`成功存储 ${city} ${target_date} 的信任分数据（宽表）`);
//     }
//     // const res = calculateNormalizedAverageError({ errors, source: 'QWeather', target_date: '2026-04-01', city: '北京' },
//     //     FIELD_CONFIGS
//     // )
//     // console.log(errorsList);


// }
// async function name() {
//     for (const c of CITY_LIST) {
//         await qwe1(c)
//     }
// }
// name()

