

var express = require('express');
var Router = express.Router();
var jwt = require('jsonwebtoken');
/* Controllers */
var ApplicantController = require('../controller/admission/applicantController');
var SSOController = require('../controller/admission/ssoController');
var StudentController = require('../controller/admission/studentController');


/* STUDENT PORTAL ROUTES */

// PROFILE routes
Router.get('/student/fetchstudentdata/:refno', StudentController.fetchStudentData);
Router.post('/student/poststprofile', StudentController.postStudentData);
// REGISTRATION routes
Router.get('/student/semesterslip', StudentController.fetchStudentSlip);
Router.get('/student/semregslip', StudentController.fetchStudentSlipAIS)
Router.get('/student/semesterreg', StudentController.fetchStudentReg);
Router.post('/student/semesterreg', StudentController.postStudentReg);
// RESULTS routes
Router.get('/student/allresults', StudentController.fetchStudentResults);

module.exports = Router;
