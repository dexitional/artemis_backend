var express = require('express');
var Router = express.Router();
var jwt = require('jsonwebtoken');
/* Controllers */
var ApiController = require('../controller/admission/apiController');
const { SSO } = require('../model/mysql/ssoModel');
const parseIp = (req) => req.headers['x-forwarded-for']?.split(',').shift() || req.socket?.remoteAddress
const apiLogger = (action) => {
    return async (req, res, next) => {
        const api = req.query.api
        const log = await SSO.apilogger(parseIp(req),action,{api})
        return next();
    }  
}

/* GET SERVICES TYPES */
Router.get('/services',apiLogger('LOAD_API_SERVICES'),ApiController.loadservices);
Router.get('/services/:type', ApiController.loadservice);
Router.get('/services/:type/:refno', ApiController.loadservice);
Router.post('/payservice', ApiController.payservice);

module.exports = Router;
