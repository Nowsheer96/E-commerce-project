require('dotenv').config()
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var session=require('express-session')
if (process.env.NODE_ENV === 'production') {
    console.log = function () {};
    console.warn = function () {};
    // console.error = function () {}; // Highly recommended to leave this commented out so you can still see critical errors in Render logs
}

var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");
const db = require('./config/connection');

var { engine } = require("express-handlebars");

var app = express();

var fileUpload = require("express-fileupload");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials/",
    helpers: {
      increment: function (value) {
        return parseInt(value) + 1;
      },eq: function (v1, v2) {
      return v1 === v2;
    },or: (a, b) => a || b,
formatDate: (date) => {
    if (!date) return "";
    let d = new Date(date);
    
    // Date parts
    let day = ("0" + d.getDate()).slice(-2);
    let month = ("0" + (d.getMonth() + 1)).slice(-2);
    let year = d.getFullYear();
    
    // Time parts
    let hours = d.getHours();
    let minutes = ("0" + d.getMinutes()).slice(-2);
    let ampm = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`;
}
    },
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  }),
);
app.use(logger("dev"));
app.use(express.json());
/* app.use(session({secret:"Key",cookie:{maxAge:600000}})) */
app.use(session({
  secret: process.env.SESSION_SECRET || "NowsheerEcomProject_2026_Secure_Key_!@#",
  resave: false,           // Fixes the first warning
  saveUninitialized: true, // Fixes the second warning
  cookie: { maxAge: 600000 }
}));
db.connect((err) => {
  if (err) {
    console.log("Connection Error: " + err);
    process.exit(1);
  } else {
    console.log("Database Connected to Atlas");
    
    // ONLY start the app logic here if possible, 
    // or ensure your helpers handle a null connection.
  }
});
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());

app.use("/", userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
