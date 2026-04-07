const express = require('express')
const router = express.Router()


const weatherRouter = require("./weatherController")
const errorRouter = require("./errors")
const scoreRouter = require("./score")
const cityRouter = require("./cityController")

router.use(weatherRouter.router)
router.use(errorRouter.router)
router.use(scoreRouter.router)
router.use(cityRouter.router)




module.exports = router;