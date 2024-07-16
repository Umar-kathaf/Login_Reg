const express = require("express");
const router = express.Router();
const userControllar = require("../controllars/users");

router.get(["/", "/login"], (req, res) => {
  res.render("login");
});
router.get("/register", (req, res) => {
  res.render("register");
});
router.get("/profile", userControllar.isLoggedIn, (req, res) => {
  if (req.user) {
    res.render("profile", { user: req.user });
  } else {
    res.redirect("/login");
  }
});
router.get("/home", userControllar.isLoggedIn, (req, res) => {
  // console.log(req.name);
  if (req.user) {
    res.render("home", { user: req.user });
  } else {
    res.redirect("/login");
  }
});

// router.get("/otp", (req, res) => {
//   res.render("otp");
// });

module.exports = router;
