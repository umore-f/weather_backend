const express = require('express')
const router = express.Router()


const weatherRouter = require("./weatherController")
const errorScoreRouter = require("./errorScore")
const cityRouter = require("./cityController")

router.use(weatherRouter.router)
router.use(errorScoreRouter.router)
router.use(cityRouter.router)




module.exports = router;