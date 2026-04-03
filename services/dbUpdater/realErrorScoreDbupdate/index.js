const { setReal } = require('./avgDbUpdater')
const { setErrors } = require('./errorDbUpdater')
const { setScore } = require('./scoreDbUpdater')
module.exports = {
    setErrors,
    setReal,
    setScore,
}
