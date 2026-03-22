const express = require('express')
const router = express.Router()


const heRouter = require("./heweather")
const vcRouter = require("./visualCrossing")
const tiRouter = require("./tomorrowIo")

router.use(heRouter)
router.use(vcRouter)
router.use(tiRouter)



module.exports = router;