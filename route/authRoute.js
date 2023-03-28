var express = require("express");
var Router = express.Router();
const db = require("../config/mysql");
const sms = require("../config/sms");
var jwt = require("jsonwebtoken");
const sha1 = require("sha1");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwzyx", 8);
  
/* Controllers */
var ApplicantController = require("../controller/admission/applicantController");
var SSOController = require("../controller/admission/ssoController");

/* Voucher Recovery */
//Router.post('/auth/voucher', AuthController.verifyVoucher);
/* Developer & Vendor API */
//Router.post('/auth/developer', AuthController.authenticateDeveloper);

/* SSO User Photo */
Router.get("/photos", SSOController.fetchPhoto);
Router.get("/photos/evs", SSOController.fetchEvsPhoto);
Router.post("/ssophoto", SSOController.postPhoto);
Router.post("/rotatephoto", SSOController.rotatePhoto);
Router.post("/removephoto", SSOController.removePhoto);
Router.post("/sendphotos", SSOController.sendPhotos);

/* SSO Authentication */
Router.post("/auth/sso", SSOController.authenticateUser);
Router.post("/auth/google", SSOController.authenticateGoogle);
/* Applicant Authentication */
Router.post("/auth/applicant", ApplicantController.authenticateApplicant);

/* SSO Reset */
Router.post("/reset/sendotp", SSOController.sendOtp);
Router.post("/reset/verifyotp", SSOController.verifyOtp);
Router.post("/reset/sendpwd", SSOController.sendPwd);
Router.get("/reset/stageusers", SSOController.stageusers);
Router.get("/reset/testsms", SSOController.testsms);

/* SSO MODULE ROUTES */

// USER ACCOUNTS
Router.get("/sso/users/", SSOController.fetchUserAccounts);
Router.get("/sso/users/:id", SSOController.fetchUserAccount);
Router.post("/sso/users", SSOController.postUserAccount);
Router.delete("/sso/users/:id", SSOController.deleteUserAccount);


// USER GROUPS
Router.get("/sso/groups/", SSOController.fetchGroups);
Router.get("/sso/groups/:id", SSOController.fetchGroup);
Router.post("/sso/groups", SSOController.postGroup);
Router.delete("/sso/groups/:id", SSOController.deleteGroup);


// USER ROLES
Router.get("/sso/uroles/", SSOController.fetchUserRoles);
Router.get("/sso/uroles/:id", SSOController.fetchUserRole);
Router.post("/sso/uroles", SSOController.postUserRole);
Router.delete("/sso/uroles/:id", SSOController.deleteUserRole);


// ACTIVE APPS
Router.get("/sso/apps/", SSOController.fetchApps);
Router.get("/sso/apps/:id", SSOController.fetchApp);
Router.post("/sso/apps", SSOController.postApp);
Router.delete("/sso/apps/:id", SSOController.deleteApp);


// APP ROLES
Router.get("/sso/aroles/", SSOController.fetchAppRoles);
Router.get("/sso/aroles/:id", SSOController.fetchAppRole);
Router.post("/sso/aroles", SSOController.postAppRole);
Router.delete("/sso/aroles/:id", SSOController.deleteAppRole);


// STAFF ID CARD
Router.get("/sso/stafffids/", SSOController.fetchVcosts);
Router.get("/sso/staffids/:id", SSOController.fetchVcost);


// STUDENT ID CARD
Router.get("/sso/studentids/", SSOController.fetchVcosts);
Router.get("/sso/studentids/:id", SSOController.fetchVcost);






/* EVS MODULE ROUTES */
Router.get("/evs/data/:id/:tag", SSOController.fetchEvsData);
Router.post("/evs/data", SSOController.postEvsData);
Router.get("/evs/monitor/:id", SSOController.fetchEvsMonitor);
Router.get("/evs/result/:id", SSOController.fetchEvsMonitor);
Router.get("/evs/receipt/:id/:tag", SSOController.fetchEvsReceipt);
Router.get("/evs/register/:id", SSOController.fetchEvsRegister);
Router.get("/evs/update/:tag", SSOController.fetchEvsUpdate);
Router.post("/evs/setcontrol", SSOController.updateEvsControl);
Router.delete("/evs/deletevoter/:id/:tag", SSOController.removeVoter);
Router.post("/evs/addvoter", SSOController.addVoter);
Router.delete("/evs/deleteportfolio/:id", SSOController.removePortfolio);
Router.post("/evs/saveportfolio", SSOController.savePortfolio);

/* SSO - IDENTITY ROUTES */
Router.get("/sso/identity", SSOController.fetchSSOIdentity);
Router.post("/sso/identity", SSOController.postEvsData);
Router.post("/sso/bulkphoto", SSOController.fetchEvsMonitor);

/* AMS MODULE ROUTES */

// SESSION routes
Router.get("/ams/sessions", SSOController.fetchSessions);
Router.post("/ams/sessions", SSOController.postSession);
Router.delete("/ams/sessions/:id", SSOController.deleteSession);
Router.put("/ams/setsession/:id", SSOController.setDefaultSession);
// VENDOR routes
Router.get("/ams/vendors", SSOController.fetchVendors);
Router.post("/ams/vendors", SSOController.postVendor);
Router.delete("/ams/vendors/:id", SSOController.deleteVendor);
// VOUCHER routes
Router.get("/ams/vouchers", SSOController.fetchVouchers);
Router.post("/ams/vouchers", SSOController.postVoucher);
Router.delete("/ams/vouchers/:id", SSOController.deleteVoucher);
Router.post("/ams/recovervoucher", SSOController.recoverVoucher);
Router.post("/ams/resendvoucher", SSOController.resendVoucher);
Router.post("/ams/sellvoucher", SSOController.sellVoucher);
// APPLICANTS routes
Router.get("/ams/applicants", SSOController.fetchApplicants);
Router.get("/ams/applicant/:serial", SSOController.fetchApplicant);
Router.get("/ams/getdocs/:serial", SSOController.fetchDocuments);
Router.get("/ams/addtosort/:serial", SSOController.addToSort);
// SORTED routes
Router.get("/ams/sorted", SSOController.fetchSortedApplicants);
Router.get("/ams/admitrevoke/:serial", SSOController.removeSortData);

// MATRICULANT routes
Router.get("/ams/freshers", SSOController.fetchFreshers);
Router.get("/ams/fresherlist", SSOController.fetchFreshersData);
Router.get("/ams/deletefresher/:serial", SSOController.removeFresherData);
Router.post("/ams/admitnow", SSOController.admitApplicant);
Router.post("/ams/admitfix", SSOController.reAdmitApplicant);
Router.post("/ams/switchvoucher", SSOController.switchVoucher);

// LETTERS routes
Router.get("/ams/letters", SSOController.fetchLetters);
Router.post("/ams/letters", SSOController.postLetter);
Router.delete("/ams/letters/:id", SSOController.deleteLetter);
Router.put("/ams/setletter/:id", SSOController.setDefaultLetter);
// ENTRANCE EXAMS routes
Router.get("/ams/entrance", SSOController.fetchEntrance);
Router.post("/ams/entrance", SSOController.postEntrance);
Router.delete("/ams/entrance/:id", SSOController.deleteEntrance);
Router.get("/ams/viewresult/:serial", SSOController.viewEntrance);
// ADMISSION REPORTS
Router.post("/ams/reports", SSOController.postAdmisssionReport);

/* AIS MODULE ROUTES */

// STUDENT routes
Router.get("/ais/students/", SSOController.fetchStudents);
Router.post("/ais/students", SSOController.postStudentAIS);
Router.post("/ais/students/report", SSOController.postStudentReportAIS);
Router.delete("/ais/students/:id", SSOController.deleteStudentAIS);
Router.get("/ais/resetpwd/:refno", SSOController.resetAccount);
Router.get("/ais/genmail/:refno", SSOController.generateMail);
Router.get("/ais/setupaccess/:refno", SSOController.stageAccount);
Router.get("/ais/switchaccess/:tag", SSOController.switchAccount);
// REGISTRATIONS routes
Router.get("/ais/regdata/", SSOController.fetchRegsData);
Router.get("/ais/reglist/", SSOController.fetchRegsList);
Router.get("/ais/regmount/", SSOController.fetchMountList);
Router.post("/ais/backlog", SSOController.processBacklog);
Router.post("/ais/backview", SSOController.processBackview);
Router.post("/ais/regreport", SSOController.processRegreport);

Router.post("/ais/singlebacklog", SSOController.processSingleBacklog);
// SCORESHEETS routes
Router.get("/ais/scoresheets/", SSOController.fetchScoresheets);
Router.get("/ais/myscoresheets/", SSOController.fetchMyScoresheets);
Router.post("/ais/scoresheets", SSOController.postScoresheets);
Router.delete("/ais/scoresheets/:id", SSOController.deleteScoresheet);
Router.post("/ais/assignsheet", SSOController.assignSheet);
Router.post("/ais/unassignsheet", SSOController.unassignSheet);
Router.get("/ais/loadsheet/:id", SSOController.loadSheet);
Router.post("/ais/savesheet", SSOController.saveSheet);
Router.post("/ais/importsheet/:id", SSOController.importSheet);
Router.get("/ais/publishsheet/:id/:sno", SSOController.publishSheet);
Router.get("/ais/certifysheet/:id/:sno", SSOController.certifySheet);
Router.get("/ais/uncertifysheet/:id", SSOController.uncertifySheet);
Router.get("/ais/loadcourselist/:id", SSOController.loadCourseList);
// CURRICULUM routes
Router.get("/ais/curriculum/", SSOController.fetchStruct);
Router.post("/ais/curriculum", SSOController.postStruct);
Router.delete("/ais/curriculum/:id", SSOController.deleteStruct);
// CALENDAR routes
Router.get("/ais/calendar/", SSOController.fetchCalendar);
Router.post("/ais/calendar", SSOController.postCalendar);
Router.delete("/ais/calendar/:id", SSOController.deleteCalendar);
Router.get("/ais/setcalendar/:id", SSOController.activateCalendar);
Router.post("/ais/stagesheet", SSOController.stageSheet);
Router.post("/ais/progress", SSOController.progressLevel);
// INFORMER routes
Router.get("/ais/informer/", SSOController.fetchInformer);
Router.post("/ais/informer", SSOController.postInformer);
Router.delete("/ais/informer/:id", SSOController.deleteInformer);
// PROGRAM CHANGE routes
Router.get("/ais/progchange/", SSOController.fetchProgchange);
Router.post("/ais/progchange", SSOController.postProgchange);
Router.delete("/ais/progchange/:id", SSOController.deleteProgchange);
Router.get("/ais/progchange/approve/:id/:sno", SSOController.approveProgchange);
// DEFERMENT routes
Router.get("/ais/deferment/", SSOController.fetchDefer);
Router.post("/ais/deferment", SSOController.postDefer);
Router.delete("/ais/deferment/:id", SSOController.deleteDefer);
Router.get("/ais/deferment/approve/:id/:sno", SSOController.approveDefer);
Router.get("/ais/deferment/resume/:id/:sno", SSOController.resumeDefer);
// STREAMS
Router.get("/ais/streams", SSOController.fetchStreams);
Router.get("/ais/sheetstreams", SSOController.fetchSheetStreams);
// RESIT
Router.get("/ais/resits", SSOController.fetchResits);
Router.get("/ais/resitstreams", SSOController.fetchResitStreams);
Router.get("/ais/resits/info/:id", SSOController.fetchResitInfo);
Router.post("/ais/resits/score", SSOController.postResitScore);
Router.post("/ais/resits/backlog", SSOController.postResitBacklog);
Router.get("/ais/resits/register/:id", SSOController.registerResit);
Router.get("/ais/resits/approve/:id", SSOController.approveResit);
// TRANSCRIPT 
Router.post("/ais/transcript", SSOController.postTranscript);
// PROGRAM routes
Router.get("/ais/programs", SSOController.fetchPrograms);
Router.get("/ais/programs/:id", SSOController.fetchProgram);
Router.post("/ais/programs", SSOController.postProgram);
Router.delete("/ais/programs/:id", SSOController.deleteProgram);
// COURSE routes
Router.get("/ais/courses", SSOController.fetchCourses);
Router.get("/ais/courses/:id", SSOController.fetchCourse);
Router.post("/ais/courses", SSOController.postCourse);
Router.delete("/ais/courses/:id", SSOController.deleteCourse);
// SCHEME routes
Router.get("/ais/schemes", SSOController.fetchSchemes);
Router.get("/ais/schemes/:id", SSOController.fetchScheme);
Router.post("/ais/schemes", SSOController.postScheme);
Router.delete("/ais/schemes/:id", SSOController.deleteScheme);
// COUNTRY routes
Router.get("/ais/countries", SSOController.fetchCountries);
Router.get("/ais/countries/:id", SSOController.fetchCountry);
Router.post("/ais/countries", SSOController.postCountry);
Router.delete("/ais/countries/:id", SSOController.deleteCountry);
// REGION routes
Router.get("/ais/regions/", SSOController.fetchRegions);
Router.get("/ais/regions/:id", SSOController.fetchRegion);
Router.post("/ais/regions", SSOController.postRegion);
Router.delete("/ais/regions/:id", SSOController.deleteRegion);
// RELIGION routes
Router.get("/ais/religions", SSOController.fetchReligions);
Router.get("/ais/religions/:id", SSOController.fetchReligion);
Router.post("/ais/religions", SSOController.postReligion);
Router.delete("/ais/religions/:id", SSOController.deleteReligion);









/* FMS MODULE ROUTES */

// BILLS routes
Router.get("/fms/sbills/", SSOController.fetchBills);
Router.get("/fms/sbills/:bid", SSOController.fetchBill);
Router.get("/fms/sbills/receivers/:bid", SSOController.fetchBillReceivers);
Router.post("/fms/sbills", SSOController.postBill);
Router.post("/fms/revokebill", SSOController.revokeBill);
Router.post("/fms/revokestbill", SSOController.revokeBill);
Router.post("/fms/attachstbill", SSOController.attachBill);
Router.delete("/fms/sbills/:id", SSOController.deleteBill);
Router.post("/fms/sendbill", SSOController.sendBill);

// BILL ITEMS routes
Router.get("/fms/sbillitems/", SSOController.fetchBillItems);
Router.get("/fms/sbillitems/:id", SSOController.fetchBillItem);
Router.post("/fms/sbillitems", SSOController.postBillItem);
Router.post("/fms/addtobill", SSOController.addToBill);
Router.delete("/fms/sbillitems/:id", SSOController.deleteBillItem);

// FEE PAYMENTS routes
Router.get("/fms/feestrans/", SSOController.fetchPayments);
Router.get("/fms/othertrans/", SSOController.fetchOtherPayments);
Router.get("/fms/vouchersales/", SSOController.fetchVoucherSales);
Router.get("/fms/feestrans/:id", SSOController.fetchPayment);
Router.post("/fms/feestrans", SSOController.postPayment);
Router.delete("/fms/feestrans/:id", SSOController.deletePayment);
Router.post("/fms/genindexno", SSOController.generateIndexNo);
Router.get("/fms/movetofees/:id", SSOController.movePaymentToFees);

// CHARGES
Router.get("/fms/charges/", SSOController.fetchCharges);
Router.get("/fms/charges/:id", SSOController.fetchCharge);
Router.post("/fms/charges", SSOController.postCharge);
Router.delete("/fms/charges/:id", SSOController.deleteCharge);
Router.get("/fms/charges/publish/:id", SSOController.publishCharge);

// SERVICE COSTS
Router.get("/fms/services/", SSOController.fetchServices);
Router.get("/fms/services/:id", SSOController.fetchService);
Router.post("/fms/services", SSOController.postService);
Router.get("/fms/servicehelper", SSOController.loadAllServices);
Router.delete("/fms/services/:id", SSOController.deleteService);

// VOUCHER COSTS
Router.get("/fms/vcosts/", SSOController.fetchVcosts);
Router.get("/fms/vcosts/:id", SSOController.fetchVcost);
Router.post("/fms/vcosts", SSOController.postVcost);
Router.delete("/fms/vcosts/:id", SSOController.deleteVcost);


// DEBTORS
Router.get("/fms/debtors/", SSOController.fetchDebtors);
Router.post("/fms/debtors/report", SSOController.postDebtorsReportFMS);

// ACCOUNT RECONCILIATION
Router.get("/fms/retireaccbyrefno/:refno", SSOController.retireAccountByRefno);

// FINANCE REPORTS
Router.post("/fms/reports", SSOController.postFinanceReport);

/* HRS MODULE ROUTES */

// HR Staff routes
Router.get("/hrs/hrstaff/", SSOController.fetchHRStaffDataHRS);
Router.post("/hrs/hrstaff", SSOController.postHRStaffDataHRS);
Router.get("/hrs/stactive", SSOController.fetchActiveStListHRS);
Router.delete("/hrs/hrstaff/:id", SSOController.deleteHRStaffDataHRS);
Router.get("/hrs/hrstaff/:sno", SSOController.fetchHRStaffHRS);
Router.get("/hrs/updatehead/:id/:sno", SSOController.updateHRSUnitHead);
Router.get("/hrs/resetpwd/:staff_no", SSOController.resetAccountHRS);
Router.get("/hrs/genmail/:staff_no", SSOController.generateMailHRS);
Router.get("/hrs/setupaccess/:staff_no", SSOController.stageAccountHRS);
Router.get("/hrs/upgraderole/:uid/:role", SSOController.upgradeRole);
Router.get("/hrs/revokerole/:uid/:role", SSOController.revokeRole);

// HR Unit routes
Router.get("/hrs/hrunit/", SSOController.fetchHRUnitDataHRS);
Router.post("/hrs/hrunit", SSOController.postHRUnitDataHRS);
Router.delete("/hrs/hrunit/:id", SSOController.deleteHRUnitDataHRS);

// HR Job routes
Router.get("/hrs/hrsjob/", SSOController.fetchHRJobData);
Router.post("/hrs/hrsjob", SSOController.postHRJobData);
Router.delete("/hrs/hrsjob/:id", SSOController.deleteHRJobData);

/* HELPERS */
Router.get("/hrs/helpers", SSOController.fetchHRShelpers);
Router.get("/fms/helpers", SSOController.fetchFMShelpers);
Router.get("/ais/helpers", SSOController.fetchAIShelpers);
Router.get("/ams/helpers", SSOController.fetchAMShelpers);
Router.get("/sso/helpers", SSOController.fetchSSOhelpers);


// SCRIPTS
Router.get("/setupstaffno", async (req, res) => {
  const ss = await db.query("select * from hrs.staff order by lname asc");
  console.log(ss);
  if (ss.length > 0) {
    var count = 1000;
    for (var s of ss) {
      await db.query(
        "update hrs.staff set staff_no = " + count + " where id = " + s.id
      );
      count++;
    }
  }
  res.json(ss);
});

Router.get("/fixfinance", async (req, res) => {
  const ss = await db.query("select s.refno as sid,t.id as tid from fms.transaction t left join ais.student s on t.refno in (s.refno,s.indexno) and t.transtype_id in (2,4) where t.refno is not null");
  var count = 0;
  if (ss.length > 0) {
    for (var s of ss) {
      const st = 
      await db.query("update fms.transaction set refno = '"+s.sid+"' where id = " + s.tid);
      await db.query("update fms.studtrans set refno = '"+s.sid+"' where tid = " + s.tid);
      count++;
    }
  }
  res.json(count);
});

Router.get("/setupstaffaccess", async (req, res) => {
  const ss = await db.query(
    "select phone,inst_mail,staff_no from hrs.staff where phone is not NULL and inst_mail is not null"
  );
  console.log(ss);
  if (ss.length > 0) {
    var count = 1000;
    for (var s of ss) {
      const pwd = nanoid();
      console.log(pwd);
      const ins = await db.query("insert into identity.user set ?", {
        group_id: 02,
        tag: s.staff_no,
        username: s.inst_mail.trim(),
        password: sha1(pwd),
      });
      if (ins.insertId > 0) {
        await db.query("insert into identity.photo set ?", {
          group_id: 02,
          tag: s.staff_no,
          uid: ins.insertId,
          path: "./public/cdn/photo/none.png",
        });
      }
      setTimeout(() => console.log("delay of 300ms"), 3000);
    }
  }
  res.json(ss);
});

Router.get("/loadfreshers", SSOController.loadFresher); // LOAD FRESHERS

// SCRIPTS
Router.get("/alertapplicants", async (req, res) => {
  const ss = await db.query(
    "select l.*,t.amount from fms.voucher_log l left join fms.transaction t on t.id = l.tid"
  );
  if (ss.length > 0) {
    var msg = ``;
    for (var s of ss) {
      if (s.amount > 100) {
        msg = `Hi, The applicant portal shall be opened to applications for applications from 2nd November, 2021 at 11:59 pm. Goto https://portal.aucc.edu.gh/applicant`;
      } else {
        msg = `Hi, visit the applicant portal now to start your AUCC Application. Goto https://portal.aucc.edu.gh/applicant`;
      }
      const m = await sms(s.buyer_phone, msg);
      console.log(
        `${s.buyer_name} (${s.buyer_phone}) sent with response code : ${m.code}`
      );
    }
  }
});

// SCRIPTS - CREATE VIEWS
Router.get("/createviews", async (req, res) => {
  // FETCH SCORESHEETS VIEW
  const v1 = await db.query(
    "create view fetchsheets as select s.*,p.short as program_name,m.title as major_name,c.title as course_name,c.course_code,c.credit,n.title as calendar,n.tag as stream,t.title as unit_name,s.regcount,s.complete_ratio from ais.sheet s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.course c on s.course_id = c.id left join utility.session n on n.id = s.session_id left join utility.unit t on t.id = s.unit_id"
  );
  // FETCH STUDENTS VIEW
  const v2 = await db.query(
    "create view fetchstudents as select s.*,u.uid,u.flag_locked,u.flag_disabled,p.short as program_name,m.title as major_name,concat(s.fname,ifnull(concat(' ',s.mname),''),' ',s.lname) as name,j.title as department,p.scheme_id from ais.student s left join identity.user u on s.refno = u.tag left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.unit j on p.unit_id = j.id"
  );
  // FETCH REGISTRATION LOGS VIEW
  const v3 = await db.query(
    "create view fetchregs as select r.*,s.fname,s.mname,s.lname,s.refno,s.prog_id,s.major_id,s.semester,x.title as session_name,x.tag as stream from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.session x on x.id = r.session_id"
  );
  // FETCH FEES & TRANSACTIONS VIEW
  //const v4 = await db.query("create view fetchtrans as select t.*,s.indexno,s.fname,s.lname,concat(trim(s.fname),' ',trim(s.lname)) as name,b.tag as tag,b.bank_account,m.title as transtitle from fms.transaction t  left join fms.transtype m on m.id = t.transtype_id left join fms.bankacc b on b.id = t.bankacc_id inner join ais.student s on (trim(s.refno) = trim(t.refno) or trim(s.indexno) = trim(t.refno))")
  const v4 = await db.query(
    "create view fetchtrans as select t.*,ifnull(s.indexno,x.indexno) as indexno,ifnull(s.fname,x.fname) as fname,ifnull(s.lname,x.lname) as lname,ifnull(concat(trim(s.fname),' ',trim(s.lname)),concat(trim(x.fname),' ',trim(x.lname))) as name,b.tag as tag,b.bank_account,m.title as transtitle from fms.transaction t left join fms.transtype m on m.id = t.transtype_id left join fms.bankacc b on b.id = t.bankacc_id inner join ais.student s on trim(s.refno) = trim(t.refno) left join ais.student x on trim(x.indexno) = trim(t.refno)"
  );
  // FETCH VOUCHER TRANSACTIONS VIEW
  const v5 = await db.query(
    "create view fetchvouchs as select t.*,s.serial,trim(s.buyer_name) as name,s.buyer_phone,s.pin,s.sms_code,b.tag as tag,b.bank_account,m.title as transtitle from fms.transaction t left join fms.voucher_log s on s.tid = t.id left join fms.transtype m on m.id = t.transtype_id left join fms.bankacc b on b.id = t.bankacc_id where t.transtype_id = 1"
  );
  // FETCH RESIT VIEW
  const v6 = await db.query(
    "create view fetchresits as select s.refno,r.*,ifnull(x.id,0) as register,x.id as reg_id,x.raw_score,x.total_score,x.approved,c.title as course_name,c.credit,c.course_code,p.short as program_name,j.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, i.title as session_name,i.academic_sem as session_sem,i.academic_year as session_year,i.tag as session_tag,m.grade_meta,m.resit_score from ais.resit_data r left join ais.resit_score x on r.id = x.resit_id left join ais.student s on r.indexno = s.indexno left join utility.course c on r.course_id = c.id left join utility.scheme m on r.scheme_id = m.id left join utility.program p on s.prog_id = p.id left join ais.major j on s.major_id = j.id left join utility.session i on r.session_id = i.id"
  );
  // FETCH BACKLOG OVERVIEW
  const v7 = await db.query(
    //"create view fetchresits as select s.refno,r.*,ifnull(x.id,0) as register,x.id as reg_id,x.raw_score,x.total_score,x.approved,c.title as course_name,c.credit,c.course_code,p.short as program_name,j.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, i.title as session_name,i.academic_sem as session_sem,i.academic_year as session_year,i.tag as session_tag,m.grade_meta,m.resit_score from ais.resit_data r left join ais.resit_score x on r.id = x.resit_id left join ais.student s on r.indexno = s.indexno left join utility.course c on r.course_id = c.id left join utility.scheme m on r.scheme_id = m.id left join utility.program p on s.prog_id = p.id left join ais.major j on s.major_id = j.id left join utility.session i on r.session_id = i.id"
    "create view fetchbackviews as select upper(concat(i.title,' - ',if(i.tag = 'MAIN','MAIN STREAM','JAN STREAM'))) as session_name,i.title as session_title,i.academic_year as session_year,i.academic_sem as session_sem,s.name,s.refno,s.prog_id,s.program_name,s.major_name,s.session as mode,x.session_id,x.scheme_id,x.indexno,x.class_score,x.exam_score,x.total_score,x.semester,x.score_type,x.course_id,(ceil(x.semester/2)*100) as level,c.course_code,c.title as course_name,c.credit,m.grade_meta from ais.assessment x left join ais.fetchstudents s on s.indexno = x.indexno left join utility.course c on c.id = x.course_id left join utility.scheme m on x.scheme_id = m.id left join utility.session i on i.id = x.session_id"
  );

  // FETCH ADMISSION SHORLIST
  const v8 = await db.query(
    //"create view fetchresits as select s.refno,r.*,ifnull(x.id,0) as register,x.id as reg_id,x.raw_score,x.total_score,x.approved,c.title as course_name,c.credit,c.course_code,p.short as program_name,j.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, i.title as session_name,i.academic_sem as session_sem,i.academic_year as session_year,i.tag as session_tag,m.grade_meta,m.resit_score from ais.resit_data r left join ais.resit_score x on r.id = x.resit_id left join ais.student s on r.indexno = s.indexno left join utility.course c on r.course_id = c.id left join utility.scheme m on r.scheme_id = m.id left join utility.program p on s.prog_id = p.id left join ais.major j on s.major_id = j.id left join utility.session i on r.session_id = i.id"
    "create view shortlist as select h.*,concat(i.fname,' ',i.lname) as name,i.dob,i.gender,r1.`short` as choice_name1,r2.`short` as choice_name2,p.started_at,p.photo,g.title as group_name,t.title as applytype from P06.sorted h left join P06.step_profile i on h.serial = i.serial left join P06.applicant p on p.serial = h.serial left join P06.voucher v on v.serial = h.serial left join P06.step_choice c1 on h.choice1_id = c1.choice_id left join utility.program r1 on r1.id = c1.program_id left join P06.step_choice c2 on h.choice2_id = c2.choice_id left join utility.program r2 on r2.id = c2.program_id left join P06.`group` g on v.group_id = g.group_id left join P06.apply_type t on h.apply_type = t.type_id left join P06.admitted a on h.serial = a.serial where a.serial is null"
  );

});

module.exports = Router;
