const express = require('express')
const router = express.Router()


const heRouter = require("./heweather")
const owRouter = require("./openweather")
const vcRouter = require("./visualCrossing")
const zhiRouter = require("./zhiweather")

router.use(heRouter)
router.use(owRouter)
router.use(vcRouter)
router.use(zhiRouter)


module.exports = router;