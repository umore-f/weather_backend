const { setErrors, setReal, setScore } = require('./realErrorScoreDbupdate/index')
const { updateAllCities, updateAllCitiesHours } = require('./weatherDbUpdater/index')

module.exports = {
    setErrors, setReal, setScore,
    updateAllCities, updateAllCitiesHours
}