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
Router.post('/ssophoto', SSOController.postPhoto);

/* SSO Authentication */
Router.post('/auth/sso', SSOController.authenticateUser);
/* Applicant Authentication */
Router.post('/auth/applicant', ApplicantController.authenticateApplicant);

/* SSO Reset */
Router.post('/reset/sendotp', SSOController.sendOtp);
Router.post('/reset/verifyotp', SSOController.verifyOtp);
Router.post('/reset/sendpwd', SSOController.sendPwd);
Router.get('/reset/stageusers', SSOController.stageusers);
Router.get('/reset/testsms', SSOController.testsms);


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
// APPLICANTS routes
Router.get('/ams/applicants/:id', SSOController.fetchApplicants);
Router.get('/ams/applicant/:serial', SSOController.fetchApplicant);



/* AIS MODULE ROUTES */

// STUDENT routes
Router.get('/ais/students/', SSOController.fetchStudents);
Router.post('/ais/vouchers', SSOController.postVoucher);
Router.delete('/ais/vouchers/:id', SSOController.deleteVoucher);
Router.post('/ais/recovervoucher', SSOController.recoverVoucher);


module.exports = Router;
