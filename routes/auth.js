const express = require("express");
const userControllar = require("../controllars/users");
const router = express.Router();

router.post("/register", userControllar.register);
router.post("/login", userControllar.login);
router.get("/logout", userControllar.logout);
// router.post("/send-otp", userControllar.sendOtp);
// router.post("/verify-otp", userControllar.verifyOtp);

module.exports = router;
