const { getError, getCompreErrorFromDb } = require('./controllers/errorScore')
const { getSingleError,getCompreError, getErrors, getSingleScore } = require('./services/dbUpdater/errorDbUpdater/errorDbUpdater')










// getError('北京','QWeather')
getCompreError('北京','QWeather')
// getErrors('北京')
// getSingleError('北京')
// getCompreErrorFromDb()
// getSingleScore('北京','QWeather')