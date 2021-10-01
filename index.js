var express = require('express');
var app = express();
var bodyParser = require('body-parser');
//var session = require('express-session');
var cors = require('cors');
var compression = require('compression');
const db = require('./config/mysql')
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz',8);
const nanopw = customAlphabet('1234567890',8);
//var helmet = require('helmet');
//var json2xls = require("json2xls");

//  Include Routes
var auth = require('./route/authRoute');
var admission = require('./route/admissionRoute');
var site = require('./route/siteRoute');
var admission = require('./route/admissionRoute');
var student = require('./route/studentRoute');
var api = require('./route/apiRoute');
app.set('view engine','ejs');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use("/public",express.static("public"));
app.use(cors()); 
app.use(compression()); 

//app.use(helmet()); // Security & Vulnearbilities guard
//app.use(json2xls.middleware); // Excel Export

/*
app.use(session({
  secret: 'sess', 
  resave: true,
  saveUninitialized: false,
  cookie: { secure: false , maxAge:  24 * 60 * 60 * 1000 }
}));
*/

// Initialise App Routes
app.use('/api',auth); 
app.use('/api',student); 
app.use('/api',admission); 
app.use('/api/v1',api); 
app.use('/',site); 

// Start Server Instance
var port = process.env.PORT || 5020;
var server = app.listen(port, () => {
  console.log("Server started on Port : "+port);
});
 