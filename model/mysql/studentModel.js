const moment = require("moment");
var db = require("../../config/mysql");

module.exports = {
  fetchUser: async (uid, gid) => {
    var sql;
    switch (gid) {
      case "01": // Student
        sql =
          "select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id  where x.default = 1 and u.uid = " +
          uid;
        break;
      case "02": // Staff
        sql =
          "select s.*,j.title as designation,x.title as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.promotion p on s.promo_id = p.id left join hrs.job j on j.id = p.job_id left join utility.unit x on p.unit_id = x.id where u.uid = " +
          uid;
        break;
      case "03": // NSS
        sql = "select from identity.photo p where p.uid = " + uid;
        break;
      case "04": // Applicant (Job)
        sql = "select from identity.photo p where p.uid = " + uid;
        break;
      case "05": // Alumni
        sql = "select from identity.photo p where p.uid = " + uid;
        break;
      default: // Staff
        sql =
          "select s.*,j.title as designation,x.title as unitname from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.promotion p on s.promo_id = p.id left join hrs.job j on j.id = p.job_id left join utility.unit x on p.unit_id = x.id where u.uid = " +
          uid;
        break;
    }
    const res = await db.query(sql);
    return res;
  },

  fetchUsers: async (gid) => {
    var sql;
    switch (gid) {
      case "01": // Student
        //sql = "select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end,u.username from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1"; break;
        sql =
          "select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end,u.username from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and (u.tag like '%0117%' or u.tag like '%0917%' or u.tag like '%0118%' or u.tag like '%0918%' or u.tag like '%0119%' or u.tag like '%0919%' or u.tag like '%0120%' or u.tag like '%0920%' or u.tag like '%0121%' or u.tag like '%0921%')";
        break;
      case "02": // Staff
        sql =
          "select s.*,j.title as designation,x.title as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,u.username from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.promotion p on s.promo_id = p.id left join hrs.job j on j.id = p.job_id left join utility.unit x on p.unit_id = x.id";
        break;
      case "03": // NSS
        sql = "select from identity.photo p";
        break;
      case "04": // Applicant (Job)
        sql = "select from identity.photo p";
        break;
      case "05": // Alumni
        sql = "select from identity.photo p";
        break;
      default: // Staff
        sql =
          "select s.*,j.title as designation,x.title as unitname from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.promotion p on s.promo_id = p.id left join hrs.job j on j.id = p.job_id left join utility.unit x on p.unit_id = x.id";
        break;
    }
    const res = await db.query(sql);
    return res;
  },

  // PROFILE MODELS

  fetchStudentProfile: async (refno) => {
    
    var session;
    const query ="select *,date_format(doa,'%m') as admission_code from ais.fetchstudents where (refno = '" +refno +"' or indexno = '" +refno +"')";
    const st = await db.query(query);

    if (st && st.length > 0) {
      const sx = await db.query("select *,substr(admission_code,1,2) as admission_code,title as session_name,academic_year as session_year,academic_sem as session_semester,id as session_id,cal_register_extend as extend_period from utility.session where `default` = 1 and status = 1");
      if (sx && sx.length == 1) session = sx[0];
      if (sx && sx.length > 1) {
        if (st[0].semester <= 2 && st[0].admission_code == "01") {
          session = sx.find((r) => r.tag == "SUB");
        } else if (
          st[0].semester <= 4 &&
          st[0].admission_code == "01" &&
          [3, 4].includes(st[0].entry_semester)
        ) {
          session = sx.find((r) => r.tag == "SUB");
        } else {
          session = sx.find((r) => r.tag == "MAIN");
        }
      }
      return [{ ...st[0], ...session }];
    }
    return null;
  },

  fetchStProfile: async (refno) => {
    const res = await db.query("select * from ais.student where (refno = '" +refno +"' or indexno = '" +refno +"')");
    return res;
  },

  findEmail: async (email) => {
    const res = await db.query(
      "select * from ais.student where institute_email = '" + email + "'"
    );
    return res;
  },

  findUserEmail: async (email) => {
    const res = await db.query(
      "select * from identity.user where username = '" + email + "'"
    );
    return res;
  },

  insertStudentProfile: async (data) => {
    const res = await db.query("insert into ais.student set ?", data);
    return res;
  },

  updateStudentProfile: async (refno, data) => {
    const res = await db.query(
      "update ais.student s set ? where s.refno = '" + refno + "'",
      data
    );
    return res;
  },

  deleteStudentProfile: async (session_id) => {
    const res = await db.query(
      "delete from ais.student where s.refno = '" + refno + "'"
    );
    return res;
  },

  disableStudent: async (session_id) => {
    await db.query("update session set status = 0");
    const res = await db.query(
      "update session set status = 1 where session_id =" + session_id
    );
    return res;
  },

  // RESIT MODELS

  fetchResitSlip: async (indexno = null) => {
    let res;
    if(indexno == undefined) return null
    if (indexno)
      res = await db.query(
        "select c.title as course_name,c.credit,c.id as course_id,c.course_code,x.taken,x.paid, ifnull(r.id,0) as register from ais.resit_data x left join utility.course c on x.course_id = c.id left join ais.resit_score r on r.resit_id = x.id where x.indexno = '" +
          indexno +
          "'"
      );
    return res;
  },

  // REGISTRATION MODELS

  fetchStudentSlip: async (session_id = null, indexno = null) => {
    let res;
    if(session_id == undefined || indexno == undefined) return null
    if (session_id && indexno)
      res = await db.query(
        "select c.title as course_name,c.credit,c.id as course_id,c.course_code,x.score_type from ais.assessment x left join utility.course c on x.course_id = c.id  where x.session_id = " +
          session_id +
          " and x.indexno = '" +
          indexno +
          "'"
      );
    return res;
  },

  fetchStudentCE: async (prog_id = null, semester = null) => {
    // Core & Non-Major Electives
    let res = [];
    if (prog_id && semester){
      const courses = await db.query(
        "select distinct(c.id) as cid from utility.structure x left join utility.course c on x.course_id = c.id  where x.major_id is null and x.semester = " +
          semester +
          " and x.prog_id = " +
          prog_id
      );
      if(courses && courses.length > 0){
        const dm = []
        for(var cs of courses){
          const ct = await db.query(
            "select c.id as course_id,c.title as course_name,c.credit,c.course_code,x.`type`,x.`lock` from utility.structure x left join utility.course c on x.course_id = c.id where x.major_id is null and x.semester = " +
              semester +
              " and x.course_id = " +
              cs.cid
          );
          if(ct && ct.length > 0) dm.push(ct[0])
        }
        res = dm;
      }
     
    }
    return res;
  },

  fetchStudentME: async (major_id = null, prog_id = null, semester = null) => {
    // Major's Electives
    let res = [];
    if (prog_id && semester){
      const courses = await db.query(
        "select distinct(c.id) as cid from utility.structure x left join utility.course c on x.course_id = c.id where x.major_id = " +
          major_id +
          " and x.semester = " +
          semester +
          " and x.prog_id = " +
          prog_id
      );
      if(courses && courses.length > 0){
        const dm = []
        for(var cs of courses){
          const ct = await db.query(
            "select c.title as course_name,c.credit,c.id as course_id,c.course_code,x.`type`,x.`lock` from utility.structure x left join utility.course c on x.course_id = c.id  where x.major_id = " +
            major_id +
            " and x.semester = " +
            semester +
            " and x.course_id = " +
            cs.cid
          );
          if(ct && ct.length > 0) dm.push(ct[0])
        }
        res = dm;
      }
    } return res;
  },

  fetchStudentRT: async (indexno = null, academic_sem  = null) => {
    // Resit
    /* NB : Resit courses for the same academic_sem should be loaded for registration */
    let res = [];
    if (indexno && academic_sem){
       const sql = "select c.title as course_name,c.credit,c.id as course_id,c.course_code,x.paid,x.semester,x.id as resit_id,x.scheme_id from ais.resit_data x left join utility.course c on x.course_id = c.id left join utility.session s on s.id = x.session_id where x.taken = 0 and x.paid = 1 and x.indexno = '" + indexno + "' and s.academic_sem = " + academic_sem;
       res = await db.query(sql);
    }  return res;
  },

  fetchRegMeta: async (prog_id = null, semester = null) => {
    // Core & Non-Major Electives
    let res;
    if (prog_id && semester)
      res = await db.query(
        "select x.* from utility.structmeta x where x.semester = " +
          semester +
          " and x.prog_id = " +
          prog_id
      );
    return res;
  },

  removeRegData: async (indexno = null, session_id = null) => {
    // Core & Non-Major Electives
    let res;
    if (indexno && session_id){
      res = await db.query(
        "delete from ais.assessment where session_id = " +
          session_id +
          " and indexno = '" +
          indexno +
          "'"
      );
    }
    return res;
  },

  removeRegDataByCourse: async (indexno = null, session_id = null, course_id = null) => {
    // Core & Non-Major Electives
    let res;
    if (indexno && session_id && course_id){
      res = await db.query(
        "delete from ais.assessment where session_id = " +
          session_id +
          " and indexno = '" +
          indexno +
          "' and course_id = '" +
          course_id +
          "'"
      );
    }
    return res;
  },

  removeResitLog: async (resit_id = null) => {
    // Remove Resit_score Registration log
    let res;
    if (resit_id ){
      res = await db.query("delete from ais.resit_data where id = "+resit_id);
    }
    return res;
  },

  insertResitLog: async (indexno = null, resit_id = null, reg_session_id = null, semester = null) => {
    let res;
    if (indexno && resit_id && semester){
      // Log Resit Registration in resit_score table
      // Semester or Level of student when course was trailed - for accurate "REPLACE/APPEND" ( Not the current Semester of student )
      try{
          //const sql = "select if(s.semester in (p.semesters,(p.semesters-1)),true,false) as final from ais.student s left join utility.program p on s.prog_id = p.id where s.indexno = '"+indexno+"'";
          const sql = `select if(${semester} in (p.semesters,(p.semesters-1)),true,false) as final from ais.student s left join utility.program p on s.prog_id = p.id where s.indexno = '${indexno}'`;
          const { final } = (await db.query(sql))[0]
          //const dt = { reg_session_id, action_type: final ? 'REPLACE':'APPEND',  approved:0, created_at: new Date() }
          const dt = { reg_session_id }
          const ins = await db.query("update ais.resit_data set ? where id = "+resit_id, dt)
          res = ins;
      } catch(e){
        console.log(e)
      }
    }
    return res;
  },

  


  insertRegData: async (data) => {
    // Core & Non-Major Electives
    const res = await db.query("insert into ais.assessment set ? ", data);
    return res;
  },

  insertRegLog: async (data) => {
    // Registration Logs
    const res = await db.query(
      "insert into ais.`activity_register` set ?",
      data
    );
    return res;
  },

  // RESULTS MODELS

  fetchStudentResults: async (indexno = null) => {
    let res;
    if (indexno)
      res = await db.query(
        "select concat(s.academic_year,' SEMESTER ',s.academic_sem) as name,c.title as course_name,x.credit,x.semester,c.id as course_id,c.course_code,x.class_score,x.exam_score,x.total_score,x.score_type,x.flag_visible,m.grade_meta from ais.assessment x left join utility.course c on x.course_id = c.id left join utility.session s on s.id = x.session_id left join utility.scheme m on m.id = x.scheme_id  where x.indexno = '" +
          indexno +
          "' order by s.id asc"
      );
    return res;
  },

  // FEES && CHARGES MODELS

  fetchFeesAccount: async (refno = null) => {
    const res = await db.query(
      "select ifnull(sum(amount),0) as total from fms.studtrans where refno = '" +
        refno +
        "'"
    );
    if (res && res.length > 0) return res[0].total;
    return 0.0;
  },

  fetchStudentTrans: async (refno = null) => {
    const res = await db.query(
      "select ifnull(s.fname,sx.fname) as fname,ifnull(s.mname,sx.mname) as mname,ifnull(s.lname,sx.lname) as lname,ifnull(p.`short`,px.`short`) as program_name,t.*,b.narrative as billname from fms.studtrans t left join fms.billinfo b on t.cr_id = b.bid left join ais.student s on t.refno = s.refno left join ais.student sx on t.refno = sx.indexno left join utility.program p on s.prog_id = p.id left join utility.program px on sx.prog_id = px.id where t.refno = '" +
        refno +
        "'"
    );
    if (res && res.length > 0) return res;
    return null;
  },

  fetchResitAccount: async (indexno = null, currency = null) => {
    const res = await db.query("select * from ais.resit_data where paid = 0 and indexno = '" + indexno + "'");
    const resm = await db.query("select amount_ghc, amount_usd from fms.servicefee where transtype_id = 03");
    if (res && resm && resm.length > 0) return res.length * resm[0].amount_ghc;
    return 0.0;
  },

  fetchGraduationAccount: async (currency = null) => {
    // const res = await db.query(
    //   "select * from ais.graduation where indexno = '" + indexno + "'"
    // );
    const resm = await db.query("select amount_ghc, amount_usd from fms.servicefee where transtype_id = 04");
    if (resm && resm.length > 0) return resm[0].amount_ghc;
    return 0.0;
  },

  fetchLateFineAccount: async (currency = null) => {
    const resm = await db.query(
      "select amount_ghc, amount_usd from fms.servicefee where transtype_id = 08"
    );
    if (resm && resm.length > 0) return resm[0].amount_ghc;
    return 0.0;
  },
};
