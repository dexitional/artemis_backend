var express = require('express');
var Router = express.Router();
const db = require('../config/mysql')
var jwt = require('jsonwebtoken');
const sha1 = require('sha1')
const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwzyx', 8)

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
Router.post('/ais/students', SSOController.postStudentAIS);
Router.delete('/ais/students/:id', SSOController.deleteStudentAIS);
Router.get('/ais/resetpwd/:refno', SSOController.resetAccount);
Router.get('/ais/genmail/:refno', SSOController.generateMail);
Router.get('/ais/setupaccess/:refno', SSOController.stageAccount);
// REGISTRATIONS routes
Router.get('/ais/regdata/', SSOController.fetchRegsData);
Router.get('/ais/reglist/', SSOController.fetchRegsList);
Router.get('/ais/regmount/', SSOController.fetchMountList);




/* FMS MODULE ROUTES */

// BILLS routes
Router.get('/fms/sbills/', SSOController.fetchBills);
Router.get('/fms/sbills/:bid', SSOController.fetchBill);
Router.post('/fms/sbills', SSOController.postBill);
Router.delete('/fms/sbills/:id', SSOController.deleteBill);
Router.post('/fms/sendbill', SSOController.sendBill);
// FEE PAYMENTS routes
Router.get('/fms/feestrans/', SSOController.fetchPayments);
Router.get('/fms/othertrans/', SSOController.fetchOtherPayments);
Router.get('/fms/feestrans/:id', SSOController.fetchPayment);
Router.post('/fms/feestrans', SSOController.postPayment);
Router.delete('/fms/feestrans/:id', SSOController.deletePayment);
Router.post('/fms/genindexno', SSOController.generateIndexNo);
Router.get('/fms/movetofees/:id', SSOController.movePaymentToFees);


/* HRS MODULE ROUTES */

// HR Staff routes
Router.get('/hrs/hrstaff/', SSOController.fetchHRStaffDataHRS);
Router.post('/hrs/hrstaff', SSOController.postHRStaffDataHRS);
Router.get('/hrs/stactive', SSOController.fetchActiveStListHRS);
Router.delete('/hrs/hrstaff/:id', SSOController.deleteHRStaffDataHRS);
Router.get('/hrs/resetpwd/:staff_no', SSOController.resetAccountHRS);
Router.get('/hrs/genmail/:staff_no', SSOController.generateMailHRS);
Router.get('/hrs/setupaccess/:staff_no', SSOController.stageAccountHRS);
Router.get('/hrs/upgraderole/:uid/:role', SSOController.upgradeRole);
Router.get('/hrs/revokerole/:uid/:role', SSOController.revokeRole);

// HR Unit routes
Router.get('/hrs/hrunit/', SSOController.fetchHRUnitDataHRS);
Router.post('/hrs/hrunit', SSOController.postHRUnitDataHRS);
Router.delete('/hrs/hrunit/:id', SSOController.deleteHRUnitDataHRS);
// HR Job routes
Router.get('/hrs/hrsjob/', SSOController.fetchHRJobData);
Router.post('/hrs/hrsjob', SSOController.postHRJobData);
Router.delete('/hrs/hrsjob/:id', SSOController.deleteHRJobData);


/* HELPERS */
Router.get('/hrs/helpers', SSOController.fetchHRShelpers);
Router.get('/fms/helpers', SSOController.fetchFMShelpers);
Router.get('/ais/helpers', SSOController.fetchAIShelpers);
Router.get('/ams/helpers', SSOController.fetchAMShelpers);


// SCRIPTS
Router.get('/setupstaffno', async(req,res)=>{
     const ss = await db.query("select * from hrs.staff order by lname asc")
     console.log(ss)
     if(ss.length > 0){
       var count = 1000;
       for(var s of ss){
          await db.query("update hrs.staff set staff_no = "+count+" where id = "+s.id)
          count++
       }  
     } res.json(ss)
});

Router.get('/setupstaffaccess', async(req,res)=>{
    const ss = await db.query("select phone,inst_mail,staff_no from hrs.staff where phone is not NULL and inst_mail is not null")
    console.log(ss)
    if(ss.length > 0){
      var count = 1000;
      for(var s of ss){
         const pwd = nanoid()
         console.log(pwd)
         const ins = await db.query("insert into identity.user set ?",{group_id:02,tag:s.staff_no,username:s.inst_mail.trim(),password:sha1(pwd)})
         if(ins.insertId > 0){
            await db.query("insert into identity.photo set ?",{group_id:02,tag:s.staff_no,uid:ins.insertId,path:'./public/cdn/photo/none.png'})
         }
         setTimeout(()=> console.log('delay of 300ms'),3000)
      }  
    } res.json(ss)
});

Router.get('/loadfreshers', SSOController.loadFresher)  // LOAD FRESHERS



module.exports = Router;
