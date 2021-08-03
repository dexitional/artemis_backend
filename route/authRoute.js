var express = require('express');
var Router = express.Router();
var jwt = require('jsonwebtoken');
/* Controllers */
var ApplicantController = require('../controller/admission/applicantController');
var SSOController = require('../controller/admission/ssoController');


/* Voucher Recovery */
//Router.post('/auth/voucher', AuthController.verifyVoucher);
/* Developer & Vendor API */
//Router.post('/auth/developer', AuthController.authenticateDeveloper);

/* SSO User Photo */
Router.get('/photos', SSOController.fetchPhoto);

/* SSO Authentication */
Router.post('/auth/sso', SSOController.authenticateUser);
/* Applicant Authentication */
Router.post('/auth/applicant', ApplicantController.authenticateApplicant);


/* AMS MODULE ROUTES */

// SESSION routes
Router.get('/ams/sessions', SSOController.fetchSessions);
Router.post('/ams/sessions', SSOController.postSession);
Router.delete('/ams/sessions/:id', SSOController.deleteSession);
Router.put('/ams/setsession/:id', SSOController.setDefaultSession);
// VENDOR routes
Router.get('/ams/vendors', SSOController.fetchVendors);
Router.post('/ams/vendors', SSOController.postVendor);
Router.delete('/ams/vendors/:id', SSOController.deleteVendor);
// VOUCHER routes
Router.get('/ams/vouchers/:id', SSOController.fetchVouchers);
Router.post('/ams/vouchers', SSOController.postVoucher);
Router.delete('/ams/vouchers/:id', SSOController.deleteVoucher);
Router.post('/ams/recovervoucher', SSOController.recoverVoucher);
//Router.post('/ams/genvouchers', SSOController.deleteVoucher);//generateVouchers


module.exports = Router;
