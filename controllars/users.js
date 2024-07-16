const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const JWT = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { promisify } = require("util");
const { error } = require("console");
const { text } = require("express");

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE,
});

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register User Details code

exports.register = (req, res) => {
  console.log(req.body);
  // const name = req.body.name;
  // const email = req.body.email;
  // const password = req.body.password;
  // const Confirm_password = req.body.Confirm_password;
  // res.send("Form Submitted");
  const { name, email, password, Confirm_password } = req.body;
  const checkEmailQuery = "select Email from userlogin where Email = ?";
  db.query(checkEmailQuery, [email], async (error, result) => {
    if (error) {
      console.log(error.message);
    }
    if (result.length > 0) {
      return res.render("register", {
        msg: "Email ID Already Taken",
        msg_type: "error",
      });
    } else if (password !== Confirm_password) {
      return res.render("register", {
        msg: "Password do not match",
        msg_type: "error",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 8);
    console.log(hashedPassword);
    const insertQuery = "insert into userlogin set ?";
    db.query(
      insertQuery,
      { name: name, Email: email, Password: hashedPassword },
      (error, result) => {
        if (error) {
          console.log(error.message);
        } else {
          console.log(result);
          return res.render("register", {
            msg: "User Registration Successfully",
            msg_type: "good",
          });
        }
      }
    );
  });
};

// User Login code

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const emailCheckQuery = "select * from userlogin where Email=?";
  db.query(emailCheckQuery, [email], async (error, result) => {
    if (error) {
      console.log("Database error: ", error);
      return res.status(500).render("login", {
        msg: "Server error, please try again later",
        msg_type: "error",
      });
    }

    console.log("Result from database: ", result);
    if (result.length <= 0) {
      return res.status(401).render("login", {
        msg: "Email Incorrect",
        msg_type: "error",
      });
    } else {
      const user = result[0];
      const storedPassword = user.Password;
      console.log("Stored password hash:", storedPassword);

      const isPasswordCorrect = await bcrypt.compare(password, storedPassword);

      console.log("Password Correct:", isPasswordCorrect);
      if (!isPasswordCorrect) {
        return res.status(401).render("login", {
          msg: "Password Incorrect",
          msg_type: "error",
        });
      } else {
        const userID = result[0].id;
        const token = JWT.sign({ id: userID }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWI_EXPIRES_IN,
        });
        console.log("The Token is: ", token);
        const cookiesOptions = {
          expires: new Date(
            Date.now() + process.env.JWI_COOKIES_EXPIRES * 24 * 60 * 60 * 1000
          ),
          httpOnly: true,
        };
        res.cookie("umar", token, cookiesOptions);
        res.status(200).redirect("/home");
      }
    }
  });
};

// Send OTP Code
// exports.sendOtp = (req, res) => {
//   const { email } = req.body;
//   const OTP = Math.floor(100000 + Math.random() * 900000).toString();

//   const checkQuery = "select Email from userlogin where Email=?";
//   db.query(checkQuery, [email], (error, results) => {
//     if (error) {
//       console.log(error.message);
//       return res.status(500).render("send-otp", {
//         msg: "Server Error",
//         msg_type: "error",
//       });
//     }

//     if (results.length <= 0) {
//       return res.status(400).render("send-otp", {
//         msg: "Email not found",
//         msg_type: "error",
//       });
//     }

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Your OTP Code",
//       text: `Your OTP Code is ${OTP}`,
//     };

//     transporter.sendMail(mailOptions, (err, info) => {
//       if (err) {
//         console.log(err.message);
//         return res.status(500).render("send-otp", {
//           msg: "Error sending email",
//           msg_type: "error",
//         });
//       }

//       const otpCheckQuery = "update users set OTP = ? where Email = ?";
//       db.query(otpCheckQuery, [OTP, email], (error, results) => {
//         if (error) {
//           console.log(error.message);
//           return res.status(500).render("send-otp", {
//             msg: "Server Error ",
//             msg_type: "error",
//           });
//         }

//         res.status(200).render("send-otp", {
//           msg: "OTP Sent",
//           msg_type: "good",
//         });
//       });
//     });
//   });
// };

// // Verify OTP code
// exports.verifyOtp = (req, res) => {
//   const { email, OTP } = req.body;
//   const verifyOtpQuery = "select OTP from userlogin where Email = ?";

//   db.query(verifyOtpQuery, [email], (error, results) => {
//     if (error) {
//       console.log(error.message);
//       return res.status(500).render("verify-otp", {
//         msg: "Server Error",
//         msg_type: "error",
//       });
//     }

//     if (results.length <= 0) {
//       return res.status(400).render("verify-otp", {
//         msg: "Email not found",
//         msg_type: "error",
//       });
//     }

//     const StoredOTP = results[0].OTP;

//     if (OTP === StoredOTP) {
//       const conditionOtpQuery =
//         "update userlogin set OTP = NULL where email = ?";
//       db.query(conditionOtpQuery, [email], (error, results) => {
//         if (error) {
//           console.log(error);
//           return res.status(500).render("verify-otp", {
//             msg: "Server Error",
//             msg_type: "error",
//           });
//         }

//         res.status(200).render("verify-otp", {
//           msg: "OTP verfied",
//           msg_type: "good",
//         });
//       });
//     } else {
//       res.status(400).send("verify-otp", {
//         msg: "Invalid OTP",
//         msg_type: "error",
//       });
//     }
//   });
// };

exports.isLoggedIn = async (req, res, next) => {
  // console.log(req.cookies);
  if (req.cookies.umar) {
    try {
      const decode = await promisify(JWT.verify)(
        req.cookies.umar,
        process.env.JWT_SECRET
      );
      // console.log(decode);
      const idQuery = "select * from userlogin where id=?";
      db.query(idQuery, [decode.id], (err, result) => {
        // console.log(result);
        if (!result) {
          return next();
        }
        req.user = result[0];
        return next();
      });
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};

exports.logout = async (req, res) => {
  res.cookie("umar", "logout", {
    expires: new Date(Date.now() + 2 * 2000),
    httpOnly: true,
  });
  res.status(200).redirect("/");
};
