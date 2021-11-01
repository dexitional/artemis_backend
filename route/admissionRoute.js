var express = require('express');
var Router = express.Router();

/* Controllers */
var ApplicantController = require('../controller/admission/applicantController');

/* Applicant Routes */
Router.post('/admission/saveform', ApplicantController.saveForm);
Router.post('/admission/formstatus', ApplicantController.formStatus);
Router.get('/admission/admitdata/:serial', ApplicantController.fetchAdmittedStudent);
Router.post('/admission/agreeoffer', ApplicantController.sendAgreement);

module.exports = Router;


   

