const moment =  require('moment');
var db = require('../../config/mysql');

module.exports.Student = {
  
   fetchUser : async (uid,gid) => {
      var sql;
      switch(gid){
        case '01': // Student
           sql = "select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id  where x.default = 1 and u.uid = "+uid; break;
        case '02': // Staff
           sql = "select s.*,j.title as designation,x.long_name as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.promotion p on s.promo_id = p.id left join hrs.job j on j.id = p.job_id left join utility.unit x on p.unit_id = x.id where u.uid = "+uid; break;
        case '03': // NSS
           sql = "select from identity.photo p where p.uid = "+uid; break;
        case '04': // Applicant (Job)
           sql = "select from identity.photo p where p.uid = "+uid; break;
        case '05': // Alumni
           sql = "select from identity.photo p where p.uid = "+uid; break;
        default :  // Staff
           sql = "select s.*,j.title as designation,x.long_name as unitname from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.promotion p on s.promo_id = p.id left join hrs.job j on j.id = p.job_id left join utility.unit x on p.unit_id = x.id where u.uid = "+uid; break;
         
      } const res = await db.query(sql);
        return res;
   },

   fetchUsers : async (gid) => {
      var sql;
      switch(gid){
        case '01': // Student
           //sql = "select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end,u.username from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1"; break;
           sql = "select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end,u.username from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and (u.tag like '%0117%' or u.tag like '%0917%' or u.tag like '%0118%' or u.tag like '%0918%' or u.tag like '%0119%' or u.tag like '%0919%' or u.tag like '%0120%' or u.tag like '%0920%' or u.tag like '%0121%' or u.tag like '%0921%')"; break;
        case '02': // Staff
           sql = "select s.*,j.title as designation,x.long_name as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,u.username from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.promotion p on s.promo_id = p.id left join hrs.job j on j.id = p.job_id left join utility.unit x on p.unit_id = x.id"; break;
        case '03': // NSS
           sql = "select from identity.photo p"; break;
        case '04': // Applicant (Job)
           sql = "select from identity.photo p"; break;
        case '05': // Alumni
           sql = "select from identity.photo p"; break;
        default :  // Staff
           sql = "select s.*,j.title as designation,x.long_name as unitname from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.promotion p on s.promo_id = p.id left join hrs.job j on j.id = p.job_id left join utility.unit x on p.unit_id = x.id"; break;
         
      } const res = await db.query(sql);
        return res;
   },

   
   // PROFILE MODELS

   fetchStudentProfile : async (refno) => {
      const res = await db.query("select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end,p.scheme_id from ais.student s left join identity.user u on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id left join utility.scheme h on p.scheme_id = h.id where x.default = 1 and (s.refno = '"+refno+"' or s.indexno = '"+refno+"')");
      return res;
   },

   fetchStProfile : async (refno) => {
      const res = await db.query("select * from ais.student where refno = '"+refno+"' or indexno = '"+refno+"'");
      return res;
   },

   findEmail : async (email) => {
      const res = await db.query("select * from ais.student where institute_email = '"+email+"'");
      return res;
   },

   findUserEmail : async (email) => {
      const res = await db.query("select * from identity.user where username = '"+email+"'");
      return res;
   },
   
   
   insertStudentProfile : async (data) => {
      const res = await db.query("insert into ais.student set ?", data);
      return res;
   },

   updateStudentProfile : async (refno,data) => {
      const res = await db.query("update ais.student s set ? where s.refno = '"+refno+"'",data);
      return res;
   },

   deleteStudentProfile : async (session_id) => {
      const res = await db.query("delete from ais.student where s.refno = '"+refno+"'");
      return res;
   },

   disableStudent : async (session_id) => {
      await db.query("update session set status = 0");
      const res = await db.query("update session set status = 1 where session_id ="+session_id);
      return res;
   },

   // REGISTRATION MODELS

   fetchStudentSlip : async (session_id = null,indexno = null) => {
      const res = await db.query("select c.title as course_name,c.credit,c.id as course_id,c.course_code,x.score_type from ais.assessment x left join utility.course c on x.course_id = c.id  where x.session_id = "+session_id+" and x.indexno = '"+indexno+"'");
      return res;
   },

   fetchStudentCE : async (prog_id = null ,semester = null) => { // Core & Non-Major Electives
      const res = await db.query("select c.title as course_name,c.credit,c.id as course_id,c.course_code,x.`type`,x.`lock` from utility.structure x left join utility.course c on x.course_id = c.id  where x.major_id is null and x.semester = "+semester+" and x.prog_id = "+prog_id);
      return res;
   },

   fetchStudentME : async (major_id = null,prog_id = null,semester = null) => { // Major's Electives
      const res = await db.query("select c.title as course_name,c.credit,c.id as course_id,c.course_code,x.`type`,x.`lock` from utility.structure x left join utility.course c on x.course_id = c.id  where x.major_id = "+major_id+" and x.semester = "+semester+" and x.prog_id = "+prog_id);
      return res;
   },

   fetchStudentRT : async (indexno = null) => { // Resit
      const res = await db.query("select c.title as course_name,c.credit,c.id as course_id,c.course_code,x.paid,x.semester from ais.resit x left join utility.course c on x.course_id = c.id  where x.taken = 0 and x.indexno = '"+indexno+"'");
      return res;
   },

   fetchRegMeta : async (prog_id = null ,semester = null) => { // Core & Non-Major Electives
      const res = await db.query("select x.* from utility.structmeta x  where x.semester = "+semester+" and x.prog_id = "+prog_id);
      return res;
   },

   removeRegData : async (indexno = null ,session_id = null) => { // Core & Non-Major Electives
      const res = await db.query("delete from ais.assessment where session_id = "+session_id+" and indexno = '"+indexno+"'");
      return res;
   },

   insertRegData : async data => { // Core & Non-Major Electives
      const res = await db.query("insert into ais.assessment set ?", data);
      return res;
   },

   insertRegLog : async data => { // Registration Logs
      const res = await db.query("insert into ais.`activity_register` set ?", data);
      return res;
   },

   

   // RESULTS MODELS

   fetchStudentResults : async (indexno = null) => {
      const res = await db.query("select concat(s.academic_year,' SEMESTER ',s.academic_sem) as name,c.title as course_name,x.credit,x.semester,c.id as course_id,c.course_code,x.class_score,x.exam_score,x.total_score,x.score_type,x.flag_visible,m.grade_meta from ais.assessment x left join utility.course c on x.course_id = c.id left join utility.session s on s.id = x.session_id left join utility.scheme m on m.id = x.scheme_id  where x.indexno = '"+indexno+"' order by s.id asc");
      return res;
   },

   // FEES && CHARGES MODELS

   fetchFeesAccount : async (refno = null) => {
      const res = await db.query("select ifnull(sum(amount),0) as total from fms.studtrans where refno = '"+refno+"'");
      console.log(res);
      if(res && res.length > 0) return res[0].total
      return 0.0;
   },


   fetchResitAccount : async (indexno = null) => {
      const res = await db.query("select * from ais.resit where paid = 0 and indexno = '"+indexno+"'");
      const resm = await db.query("select amount from fms.servicefee where transtype_id = 03");
      if(res && (resm && resm.length > 0)) return res.length * resm[0].amount
      return 0.0;
   },



   fetchGraduationAccount : async (indexno = null) => {
      const res = await db.query("select * from ais.graduation where indexno = '"+indexno+"'");
      const resm = await db.query("select amount from fms.servicefee where transtype_id = 04");
      if(res && (resm && resm.length > 0)) return res.length * resm[0].amount
      return 0.0;
   },



};

