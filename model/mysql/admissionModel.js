var db = require("../../config/mysql");

module.exports = {
  fetchApplicants: async () => {
    const sql = "select * from applicant";
    const res = await db.query(sql);
    return res;
  },

  fetchApplicant: async (serial) => {
    const sql = "select * from applicant where serial = " + serial;
    const res = await db.query(sql);
    return res;
  },

  fetchVoucher: async (serial) => {
    const sql = "select * from voucher where serial = " + serial;
    const res = await db.query(sql);
    return res;
  },

  verifyVoucher: async ({ serial, pin }) => {
    const sql =
      "select * from voucher where serial = " +
      serial +
      " and pin = '" +
      pin +
      "'";
    const res = await db.query(sql);
    return res;
  },

  fetchMeta: async (serial) => {
    const sql =
      "select p.*,g.title as group_name from applicant p left join voucher v on p.serial = v.serial left join `group` g on v.group_id = g.group_id where p.serial = " +
      serial;
    const res = await db.query(sql);
    return res;
  },

  fetchStageByGroup: async (group) => {
    const sql =
      "select s.*,f.meta as formMeta from stage s left join form f on s.form_id = f.form_id where s.group_id = '" +
      group +
      "'";
    const res = await db.query(sql);
    return res;
  },

  fetchTagData: async (serial, tag) => {
    const sql = `select * from step_${tag.trim()} where serial = ${serial}`;
    const res = await db.query(sql);
    return res;
  },

  fetchResultGrades: async (serial) => {
    const sql = `select * from grade where serial = ${serial}`;
    const res = await db.query(sql);
    return res;
  },

  fetchProfile: async (serial) => {
    const sql = `select * from step_profile where serial = ${serial}`;
    const res = await db.query(sql);
    return res && res[0];
  },

  fetchGuardian: async (serial) => {
    const sql = `select * from step_guardian where serial = ${serial}`;
    const res = await db.query(sql);
    return res && res[0];
  },

  fetchNotes: async (serial) => {
    const sql = `select * from notification where serial = ${serial}`;
    const res = await db.query(sql);
    return res;
  },

  makeNote: async (data) => {
    const sql = "insert into notification set ?";
    const res = await db.query(sql, data);
    return res;
  },

  makeApplicant: async (data) => {
    const sql = "insert into applicant set ?";
    const res = await db.query(sql, data);
    return res;
  },

  updateApplicationStatus: async (serial, status) => {
    const sql =
      "update P06.applicant set flag_submit = " +
      status +
      " where serial = " +
      serial;
    const res = await db.query(sql);
    return res;
  },

  fetchAdmittedStudent: async (serial) => {
    const sql =
      "select s.academic_year,s.cal_lecture_start,s.cal_register_start,s.cal_register_end,s.cal_orient_start,t.letter_condition,b.amount,b.currency,b.discount,m.title as major_name,r.`long` as program_name,f.fname,f.lname,f.resident_address,f.resident_country,x.admission_date,x.admission_show,x.title as admission_title,l.signatory,l.template,l.signature,c.bank_account,a.* from P06.admitted a left join utility.session s on a.academ_session = s.id left join P06.session x on a.admit_session = x.session_id left join P06.letter l on l.id = x.letter_id  left join P06.step_profile f on f.serial = a.serial left join P06.apply_type t on a.apply_type = t.type_id left join fms.billinfo b on a.bill_id = b.bid left join utility.program r on r.id = a.prog_id left join ais.major m on m.id = a.major_id left join fms.bankacc c on c.id = b.bankacc_id where a.serial = '" +
      serial +
      "'";
    const res = await db.query(sql);
    return res && res[0];
  },

  updateAdmittedTbl: async (serial, data) => {
    var res = await db.query(
      "update P06.admitted set ? where serial = " + serial,
      data
    );
    return res;
  },

  updateApplicantTbl: async (data) => {
    const serial = data.serial;
    var res = await db.query(
      "update applicant set ? where serial = " + serial,
      data
    );
    return res;
  },

  insReplaceProfileTbl: async (data) => {
    const id = data.profile_id;
    delete data.profile_id;
    var res;
    if (id != "") {
      res = await db.query(
        "update step_profile set ? where profile_id = " + id,
        data
      );
    } else {
      res = await db.query("insert into step_profile set ?", data);
    }
    return res;
  },

  insReplaceGuardianTbl: async (data) => {
    const id = data.guardian_id;
    delete data.guardian_id;
    var res;
    if (id != "") {
      res = await db.query(
        "update step_guardian set ? where guardian_id = " + id,
        data
      );
    } else {
      res = await db.query("insert into step_guardian set ?", data);
    }
    return res;
  },

  insReplaceEducationTbl: async (serial, data) => {
    var res;
    if (data.length > 0 && data[0].institute_name) {
      const rs = await db.query(
        "delete from step_education where serial = " + serial
      );
      if (rs) {
        for (var edu of data) {
          const id = edu.education_id;
          var dt = { ...edu, serial };
          delete dt.education_id;
          res = await db.query("insert into step_education set ?", dt);
        }
      }
    }
    return res;
  },

  insReplaceResultTbl: async (serial, data, grade) => {
    var res;
    if (grade.length > 0 && data.length > 0) {
      const rsx = await db.query(
        "delete from step_result where serial = " + serial
      );
      const lsx = await db.query("delete from grade where serial = " + serial);
      if (rsx && lsx) {
        for (var rs of data) {
          var id = rs.result_id;
          var dt = { ...rs, serial };
          delete dt.result_id;
          var gt = grade.filter((r) => r.result_id == id);
          // Insert Result
          res = await db.query("insert into step_result set ?", dt);
          if (res) {
            // Insert Grades
            for (var m of gt) {
              var ft = { ...m, serial, result_id: res.insertId };
              delete ft.grade_id;
              delete ft.id;
              var insGrd = await db.query("insert into grade set ?", ft);
            }
          }
        }
      }
    }
    return res;
  },

  insReplaceEmploymentTbl: async (serial, data) => {
    var res;

    if (data && data.length > 0) {
      const rs = await db.query(
        "delete from step_employment where serial = " + serial
      );
      if (rs) {
        for (var ch of data) {
          var dt = { ...ch, serial };
          delete dt.employment_id;
          if (dt) res = await db.query("insert into step_employment set ?", dt);
        }
      }
    }
    return res;
  },

  insReplaceQualificationTbl: async (serial, data) => {
    var res;
    if (data && data.length > 0) {
      const rs = await db.query(
        "delete from step_qualification where serial = " + serial
      );
      if (rs) {
        for (var ch of data) {
          var dt = { ...ch, serial };
          delete dt.qualification_id;
          if (dt)
            res = await db.query("insert into step_qualification set ?", dt);
        }
      }
    }
    return res;
  },

  insReplaceRefereeTbl: async (serial, data) => {
    var res;
    if (data && data.length > 0) {
      const rs = await db.query(
        "delete from step_referee where serial = " + serial
      );
      if (rs) {
        for (var ch of data) {
          var dt = { ...ch, serial };
          delete dt.referee_id;
          console.log(dt);
          if (dt) res = await db.query("insert into step_referee set ?", dt);
        }
      }
    }
    return res;
  },

  insReplaceChoiceTbl: async (serial, data) => {
    var res;
    if (data.length > 0 && data[0].program_id) {
      const rs = await db.query(
        "delete from step_choice where serial = " + serial
      );
      if (rs) {
        for (var ch of data) {
          var dt = { ...ch, serial };
          delete dt.choice_id;
          res = await db.query("insert into step_choice set ?", dt);
        }
      }
    }
    return res;
  },

  insReplaceDocumentTbl: async (serial, data) => {
    var res;
    if (data.length > 0) {
      const rs = await db.query(
        "delete from step_document where serial = " + serial
      );
      if (rs) {
        for (var ch of data) {
          var dt = { ...ch, serial };
          res = await db.query("insert into step_document set ?", dt);
        }
      }
    }
    return res;
  },
};
