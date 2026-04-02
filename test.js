const { getError, getCompreErrorFromDb, } = require('./controllers/errorScore')
const { getSingleError, getCompreError, setErrors, getSingleScore, setScore, getSourceWeights, selfConsistentBaseline } = require('./services/dbUpdater/errorDbUpdater/errorDbUpdater')
const { updateAllCities } = require('./services/dbUpdater/weatherDbUpdater/index')
const { getHistoryWeather, getNextWeather } = require('./controllers/weatherController')
const { FIELDS_CAL, CITY_LIST, SOURCE_LIST } = require('./utils/constants')
const { getRobustRealValue, evaluateFieldCredibility } = require('./services/fetcher/processingData')
const { setAverage } = require('./services/dbUpdater/avgDbUpdater/avgDbUpdater')
const { getRealData } = require('./controllers/realData')







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
// const dataList = ['2026-3-27', '2026-3-28', '2026-3-29', '2026-3-30', '2026-3-31', '2026-4-1']
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

async function qwe() {
    const result = await selfConsistentBaseline('北京','temp')
}
qwe()

