const express = require('express')
const authController = require("../controllers/auth.controller")
const authMiddleware = require("../middleware/auth.middleware")

const router = express.Router()

/* POST /api/auth/register */
router.post("/register",authController.userRegisterController)

/*POST /api/auth/login*/
router.post("/login",authController.userLoginController)

/* POST /api/auth/logout */
router.post("/logout",authMiddleware.authMiddleware,authController.userLogoutController)

/* GET /api/auth/email-preference */
router.get("/email-preference",authMiddleware.authMiddleware,authController.userGetEmailPreferenceController)

/* PATCH /api/auth/email-preference */
router.patch("/email-preference",authMiddleware.authMiddleware,authController.userUpdateEmailPreferenceController)

module.exports = router
