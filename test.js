const { getError, getCompreErrorFromDb, } = require('./controllers/errorScore')
const { getSingleError,getCompreError, setErrors, getSingleScore } = require('./services/dbUpdater/errorDbUpdater/errorDbUpdater')
const { updateAllCities } = require('./services/dbUpdater/weatherDbUpdater/index')









// getError('北京','QWeather')
// getCompreError('北京','QWeather')
// getErrors('北京')
// getSingleError('北京')
// getCompreErrorFromDb()
// getSingleScore('北京','QWeather')
// updateAllCities()
setErrors()