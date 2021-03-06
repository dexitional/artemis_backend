var express = require('express');
var Router = express.Router();
const db = require('../config/mysql')
const sms = require('../config/sms')
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
Router.get('/ams/vouchers', SSOController.fetchVouchers);
Router.post('/ams/vouchers', SSOController.postVoucher);
Router.delete('/ams/vouchers/:id', SSOController.deleteVoucher);
Router.post('/ams/recovervoucher', SSOController.recoverVoucher);
Router.post('/ams/resendvoucher', SSOController.resendVoucher);
Router.post('/ams/sellvoucher', SSOController.sellVoucher);
// APPLICANTS routes
Router.get('/ams/applicants', SSOController.fetchApplicants);
Router.get('/ams/applicant/:serial', SSOController.fetchApplicant);
Router.get('/ams/getdocs/:serial', SSOController.fetchDocuments);
Router.get('/ams/addtosort/:serial', SSOController.addToSort);
// SORTED routes
Router.get('/ams/sorted', SSOController.fetchSortedApplicants);
Router.post('/ams/admitnow', SSOController.admitApplicant);
// MATRICULANT routes
Router.get('/ams/freshers', SSOController.fetchFreshers);
Router.get('/ams/fresherlist', SSOController.fetchFreshersData);
Router.get('/ams/deletefresher/:serial', SSOController.removeFresherData);
Router.post('/ams/admitnow', SSOController.admitApplicant);
Router.post('/ams/admitfix', SSOController.reAdmitApplicant);
// LETTERS routes
Router.get('/ams/letters', SSOController.fetchLetters);
Router.post('/ams/letters', SSOController.postLetter);
Router.delete('/ams/letters/:id', SSOController.deleteLetter);
Router.put('/ams/setletter/:id', SSOController.setDefaultLetter);
// ENTRANCE EXAMS routes
Router.get('/ams/entrance', SSOController.fetchEntrance);
Router.post('/ams/entrance', SSOController.postEntrance);
Router.delete('/ams/entrance/:id', SSOController.deleteEntrance);
Router.get('/ams/viewresult/:serial', SSOController.viewEntrance);








/* AIS MODULE ROUTES */

// STUDENT routes
Router.get('/ais/students/', SSOController.fetchStudents);
Router.post('/ais/students', SSOController.postStudentAIS);
Router.post('/ais/students/report', SSOController.postStudentReportAIS);
Router.delete('/ais/students/:id', SSOController.deleteStudentAIS);
Router.get('/ais/resetpwd/:refno', SSOController.resetAccount);
Router.get('/ais/genmail/:refno', SSOController.generateMail);
Router.get('/ais/setupaccess/:refno', SSOController.stageAccount);
Router.get('/ais/switchaccess/:tag', SSOController.switchAccount);
// REGISTRATIONS routes
Router.get('/ais/regdata/', SSOController.fetchRegsData);
Router.get('/ais/reglist/', SSOController.fetchRegsList);
Router.get('/ais/regmount/', SSOController.fetchMountList);
// SCORESHEETS routes
Router.get('/ais/scoresheets/', SSOController.fetchScoresheets);
Router.get('/ais/myscoresheets/', SSOController.fetchMyScoresheets);
Router.post('/ais/scoresheets', SSOController.postScoresheets);
Router.delete('/ais/scoresheets/:id', SSOController.deleteScoresheet);
Router.post('/ais/assignsheet', SSOController.assignSheet);
Router.post('/ais/unassignsheet', SSOController.unassignSheet);
Router.get('/ais/loadsheet/:id', SSOController.loadSheet);
Router.post('/ais/savesheet', SSOController.saveSheet);
Router.post('/ais/importsheet/:id', SSOController.importSheet);
Router.get('/ais/publishsheet/:id/:sno', SSOController.publishSheet);
Router.get('/ais/certifysheet/:id/:sno', SSOController.certifySheet);
Router.get('/ais/uncertifysheet/:id', SSOController.uncertifySheet);
Router.get('/ais/loadcourselist/:id', SSOController.loadCourseList);
// CURRICULUM routes
Router.get('/ais/curriculum/', SSOController.fetchStruct);
Router.post('/ais/curriculum', SSOController.postStruct);
Router.delete('/ais/curriculum/:id', SSOController.deleteStruct);
// CALENDAR routes
Router.get('/ais/calendar/', SSOController.fetchCalendar);
Router.post('/ais/calendar', SSOController.postCalendar);
Router.delete('/ais/calendar/:id', SSOController.deleteCalendar);
Router.get('/ais/setcalendar/:id', SSOController.activateCalendar);
Router.post('/ais/stagesheet', SSOController.stageSheet);
// INFORMER routes
Router.get('/ais/informer/', SSOController.fetchInformer);
Router.post('/ais/informer', SSOController.postInformer);
Router.delete('/ais/informer/:id', SSOController.deleteInformer);
// PROGRAM CHANGE routes
Router.get('/ais/progchange/', SSOController.fetchProgchange);
Router.post('/ais/progchange', SSOController.postProgchange);
Router.delete('/ais/progchange/:id', SSOController.deleteProgchange);
Router.get('/ais/progchange/approve/:id/:sno', SSOController.approveProgchange);
// DEFERMENT routes
Router.get('/ais/deferment/', SSOController.fetchDefer);
Router.post('/ais/deferment', SSOController.postDefer);
Router.delete('/ais/deferment/:id', SSOController.deleteDefer);
Router.get('/ais/deferment/approve/:id/:sno', SSOController.approveDefer);
Router.get('/ais/deferment/resume/:id/:sno', SSOController.resumeDefer);
// STREAMS
Router.get('/ais/streams', SSOController.fetchStreams);





/* FMS MODULE ROUTES */

// BILLS routes
Router.get('/fms/sbills/', SSOController.fetchBills);
Router.get('/fms/sbills/:bid', SSOController.fetchBill);
Router.get('/fms/sbills/receivers/:bid', SSOController.fetchBillReceivers);
Router.post('/fms/sbills', SSOController.postBill);
Router.post('/fms/revokebill', SSOController.revokeBill);
Router.post('/fms/revokestbill', SSOController.revokeBill);
Router.delete('/fms/sbills/:id', SSOController.deleteBill);
Router.post('/fms/sendbill', SSOController.sendBill);

// BILL ITEMS routes
Router.get('/fms/sbillitems/', SSOController.fetchBillItems);
Router.get('/fms/sbillitems/:id', SSOController.fetchBillItem);
Router.post('/fms/sbillitems', SSOController.postBillItem);
Router.post('/fms/addtobill', SSOController.addToBill);
Router.delete('/fms/sbillitems/:id', SSOController.deleteBillItem);

// FEE PAYMENTS routes
Router.get('/fms/feestrans/', SSOController.fetchPayments);
Router.get('/fms/othertrans/', SSOController.fetchOtherPayments);
Router.get('/fms/vouchersales/', SSOController.fetchVoucherSales);
Router.get('/fms/feestrans/:id', SSOController.fetchPayment);
Router.post('/fms/feestrans', SSOController.postPayment);
Router.delete('/fms/feestrans/:id', SSOController.deletePayment);
Router.post('/fms/genindexno', SSOController.generateIndexNo);
Router.get('/fms/movetofees/:id', SSOController.movePaymentToFees);

// DEBTORS
Router.get('/fms/debtors/', SSOController.fetchDebtors);
Router.post('/fms/debtors/report', SSOController.postDebtorsReportFMS);

// FINANCE REPORTS
Router.post('/fms/reports', SSOController.postFinanceReport);

/* HRS MODULE ROUTES */

// HR Staff routes
Router.get('/hrs/hrstaff/', SSOController.fetchHRStaffDataHRS);
Router.post('/hrs/hrstaff', SSOController.postHRStaffDataHRS);
Router.get('/hrs/stactive', SSOController.fetchActiveStListHRS);
Router.delete('/hrs/hrstaff/:id', SSOController.deleteHRStaffDataHRS);
Router.get('/hrs/hrstaff/:sno', SSOController.fetchHRStaffHRS);
Router.get('/hrs/updatehead/:id/:sno', SSOController.updateHRSUnitHead);
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

// SCRIPTS
Router.get('/alertapplicants', async(req,res)=>{
   const ss = await db.query("select l.*,t.amount from fms.voucher_log l left join fms.transaction t on t.id = l.tid")
   if(ss.length > 0){
     var msg = ``
     for(var s of ss){
       if(s.amount > 100){
          msg =  `Hi, The applicant portal shall be opened to applications for applications from 2nd November, 2021 at 11:59 pm. Goto https://portal.aucc.edu.gh/applicant`
       }else{
         msg =  `Hi, visit the applicant portal now to start your AUCC Application. Goto https://portal.aucc.edu.gh/applicant`
       }
       const m = await sms(s.buyer_phone,msg)
       console.log(`${s.buyer_name} (${s.buyer_phone}) sent with response code : ${m.code}`)
     }  
   } 
});

// SCRIPTS - CREATE VIEWS
Router.get('/createviews', async(req,res)=>{
  // FETCH SCORESHEETS VIEW
  const v1 = await db.query("create view fetchsheets as select s.*,p.short as program_name,m.title as major_name,c.title as course_name,c.course_code,c.credit,n.title as calendar,n.tag as stream,t.title as unit_name,s.regcount,s.complete_ratio from ais.sheet s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.course c on s.course_id = c.id left join utility.session n on n.id = s.session_id left join utility.unit t on t.id = s.unit_id")
  // FETCH STUDENTS VIEW
  const v2 = await db.query("create view fetchstudents as select s.*,u.uid,u.flag_locked,u.flag_disabled,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(s.mname,' '),''),s.lname) as name,j.title as department from ais.student s left join identity.user u on s.refno = u.tag left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.unit j on p.unit_id = j.id")
  // FETCH REGISTRATION LOGS VIEW
  const v3 = await db.query("create view fetchregs as select r.*,s.fname,s.mname,s.lname,s.refno,s.prog_id,s.major_id,s.semester,x.title as session_name,x.tag as stream from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.session x on x.id = r.session_id") 
  // FETCH FEES & TRANSACTIONS VIEW
  //const v4 = await db.query("create view fetchtrans as select t.*,s.indexno,s.fname,s.lname,concat(trim(s.fname),' ',trim(s.lname)) as name,b.tag as tag,b.bank_account,m.title as transtitle from fms.transaction t  left join fms.transtype m on m.id = t.transtype_id left join fms.bankacc b on b.id = t.bankacc_id inner join ais.student s on (trim(s.refno) = trim(t.refno) or trim(s.indexno) = trim(t.refno))")
  const v4 = await db.query("create view fetchtrans as select t.*,ifnull(s.indexno,x.indexno) as indexno,ifnull(s.fname,x.fname) as fname,ifnull(s.lname,x.lname) as lname,ifnull(concat(trim(s.fname),' ',trim(s.lname)),concat(trim(x.fname),' ',trim(x.lname))) as name,b.tag as tag,b.bank_account,m.title as transtitle from fms.transaction t left join fms.transtype m on m.id = t.transtype_id left join fms.bankacc b on b.id = t.bankacc_id inner join ais.student s on trim(s.refno) = trim(t.refno) left join ais.student x on trim(x.indexno) = trim(t.refno)")
  // FETCH VOUCHER TRANSACTIONS VIEW
  const v5 = await db.query("create view fetchvouchs as select t.*,s.serial,trim(s.buyer_name) as name,s.buyer_phone,s.pin,s.sms_code,b.tag as tag,b.bank_account,m.title as transtitle from fms.transaction t left join fms.voucher_log s on s.tid = t.id left join fms.transtype m on m.id = t.transtype_id left join fms.bankacc b on b.id = t.bankacc_id where t.transtype_id = 1")
});



module.exports = Router;
