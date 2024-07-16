const express = require("express");
const mysql = require("mysql");
const dotenv = require("dotenv");
const path = require("path");
const { log } = require("console");
const hbs = require("hbs");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8000;

dotenv.config({
  path: "./.env",
});

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS,
  database: process.env.DATABASE,
});

db.connect((err) => {
  if (err) {
    console.log("Error Connecting to Database: ", err.message);
  } else {
    console.log("Connected to database");
  }
});
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

const location = path.join(__dirname, "./public");
app.use(express.static(location));
const partialsPath = path.join(__dirname, "./views/partials");
hbs.registerPartials(partialsPath);

app.set("view engine", "hbs");
app.use("/", require("./routes/pages"));
app.use("/auth", require("./routes/auth"));
app.listen(PORT, () => {
  console.log(`Server Started at http://localhost:${PORT}`);
});
