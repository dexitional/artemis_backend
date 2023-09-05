var db = require("../../config/mysql");

module.exports = {
  getActiveSessionByMode: async (mode_id) => {
    const res = await db.query(
      "select * from utility.session where tag = 'MAIN' and `default` = 1 and mode_id = " +
        mode_id
    );
    return res && res[0];
  },

  getActiveSessionByDoa: async (doa) => {
    const res = await db.query(
      "select s.* from ais.student where `default` = 1  and mode_id = " + doa
    );
    return res && res[0];
  },

  getActiveSessionByRefNo: async (refno) => {
    var sid;
    const st = await db.query(
      "select s.*,date_format(doa,'%m') as admission_code,semester,entry_semester from ais.student s where s.refno = '" +
        refno +
        "' or s.indexno = '" +
        refno +
        "'"
    );
    const sx = await db.query(
      "select id,substr(admission_code,1,2) as admission_code,tag from utility.session where `default` = 1 and status = 1"
    );
    if (sx && sx.length == 1) sid = sx[0].id;
    if (sx && sx.length > 1) {
      if (st && st.length > 0) {
        if (st[0].semester <= 2 && st[0].admission_code == "01") {
          sid = sx.find((r) => r.tag == "SUB").id;
        } else if (
          st[0].semester <= 4 &&
          st[0].admission_code == "01" &&
          [3, 4].includes(st[0].entry_semester)
        ) {
          sid = sx.find((r) => r.tag == "SUB").id;
        } else {
          sid = sx.find((r) => r.tag == "MAIN").id;
        }
      }
    }
    return sid;
  },

  getActiveStudentByUid: async (uid) => {
    var session;
    const st = await db.query(
      "select s.*,date_format(s.doa,'%m') as admission_code,s.semester,s.entry_semester,p.short as program_name,p.scheme_id,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id where u.uid = " +
        uid
    );
    const sx = await db.query(
      "select *,substr(admission_code,1,2) as admission_code,title as session_name,academic_year as session_year,academic_sem as session_semester,id as session_id from utility.session where `default` = 1 and status = 1"
    );
    if (sx && sx.length == 1) session = sx[0];
    if (sx && sx.length > 1) {
      if (st && st.length > 0) {
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
    }
    return [{ ...st[0], ...session }];
  },

  getActiveStudentByPhone: async (phone) => {
    var session;
    const st = await db.query(
      "select s.*,date_format(s.doa,'%m') as admission_code,s.semester,s.entry_semester,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,u.uid,u.group_id,u.group_id as gid from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id where s.phone = '" +
        phone +
        "'"
    );
    const sx = await db.query(
      "select *,substr(admission_code,1,2) as admission_code,title as session_name,academic_year as session_year,academic_sem as session_semester,id as session_id from utility.session where `default` = 1 and status = 1"
    );
    if (sx && sx.length == 1) session = sx[0];
    if (sx && sx.length > 1) {
      if (st && st.length > 0) {
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
    }
    console.log({ ...st[0], ...session });
    return [{ ...st[0], ...session }];
  },

  retireAccountByRefno: async (refno) => {
    const bal = await db.query("select ifnull(sum(amount),0) as amount from fms.studtrans where refno = '"+refno+"'");
    if (bal && bal.length > 0) {
      const ups = await db.query(
        "update ais.student s set ? where (refno = '"+refno+"' or indexno = '"+refno+"')",
        { transact_account: bal[0].amount }
      );
      return ups.affectedRows;
    }
    return null;
  },

  retireAssessmentTotal: async (session_id) => {
    const res = await db.query(
      "update ais.assessment set total_score = (class_score+exam_score) where session_id = " +
        session_id
    );
    return res;
  },

  updateStudFinance: async (tid, session_id, refno, amount, transid) => {
    
    const fin = await db.query(
      "select * from fms.studtrans where tid = " + tid
    );
    const dt = {
      tid,
      amount,
      refno,
      session_id,
      narrative: `${refno} FEES PAYMENT, TRANSID: ${transid}`,
    };
    var resp;
    var fid;
    if (fin && fin.length > 0) {
      resp = await db.query(
        "update fms.studtrans set ? where tid = " + tid,
        dt
      );
      fid = resp && fin[0].id;
    } else {
      resp = await db.query("insert into fms.studtrans set ?", dt);
      fid = resp && resp.insertId;
    }
    return fid;
  },
};
