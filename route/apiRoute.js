var express = require('express');
var Router = express.Router();
var jwt = require('jsonwebtoken');
/* Controllers */
var ApiController = require('../controller/admission/apiController');

/* SSO Reset */
//Router.post('/sendotp', SSOController.sendOtp);
//Router.post('/reset/verifyotp', SSOController.verifyOtp);
//Router.post('/reset/sendpwd', SSOController.sendPwd);
//Router.get('/reset/stageusers', SSOController.stageusers);
//Router.get('/reset/testsms', SSOController.testsms);

/* GET SERVICES TYPES */
Router.get('/services', ApiController.loadservices);
Router.get('/services/:type', ApiController.loadservice);
Router.get('/services/:type/:refno', ApiController.loadservice);
Router.post('/payservice', ApiController.payservice);

module.exports = Router;
