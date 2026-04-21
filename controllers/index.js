const express = require('express')
const router = express.Router()


const weatherRouter = require("./weatherController")
const errorRouter = require("./errors")
const scoreRouter = require("./score")
const cityRouter = require("./cityController")
const userRouter = require("./user")
const adminRouter = require("./admin")
const userSettingRouter = require('./userSetting')

router.use(weatherRouter.router)
router.use(errorRouter.router)
router.use(scoreRouter.router)
router.use(cityRouter.router)
router.use(userRouter.router)
router.use(adminRouter.router)
router.use(userSettingRouter.router)




module.exports = router;