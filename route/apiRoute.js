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
        const refno = req.params.refno
        const dm = req.body
        var dt = {}
        if(refno) dt.studentId = refno
        if(api) dt.apiToken = api
        if(dm && Object.keys(dm).length > 0) dt.data = dm
        const log = await SSO.apilogger(parseIp(req),action,dt)
        return next();
    }  
}

/* GET SERVICES TYPES */
Router.get('/services',apiLogger('LOAD_API_SERVICES'),ApiController.loadservices);
Router.get('/services/:type',apiLogger('LOAD_VOUCHER_FORMS'), ApiController.loadservice);
Router.get('/services/:type/:refno',apiLogger('VERIFY_STUDENT'), ApiController.loadservice);
Router.post('/payservice',apiLogger('SEND_TRANSACTION'), ApiController.payservice);

module.exports = Router;
