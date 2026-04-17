const express = require("express");
const router = express.Router();
const {login, signup, sendotp, changePassword} = require("../controllers/Auth")
const {resetPasswordToken, resetPassword} = require("../controllers/ResetPassword");
const {auth} = require("../middlewares/auth")

//Routes for login, signup and authentication

//Authentication routes

//Route for user login
router.post("/login", login)

//Route for user signup
router.post("/signup", signup)

//Route for sending OTP to the user's email
router.post("/sendotp", sendotp)

//Route for changing the password
router.post("/changepassword", auth, changePassword)

router.post("/reset-password-token", resetPasswordToken);

router.post("/reset-password", resetPassword);

module.exports = router