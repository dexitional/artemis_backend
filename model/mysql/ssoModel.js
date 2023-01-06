const moment = require("moment");
const email = require("../../config/email");
var db = require("../../config/mysql");
const sha1 = require("sha1");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwzyx", 8);
const Student = require("../../model/mysql/studentModel");
const { getUsername } = require("../../middleware/util");
const SR = require("../../model/mysql/sharedModel");
const { getGrade, isTrailed } = require("../../utils/helper");

module.exports = {
  verifyUser: async ({ username, password }) => {
    const sql =
      "select u.* from identity.user u where u.username = '" +
      username +
      "' and password = sha1('" +
      password +
      "')";
    const res = await db.query(sql);
    return res;
  },

  verifyUserByEmail: async ({ email }) => {
    const sql =
      "select u.* from identity.user u where u.username = '" + email + "'";
    const res = await db.query(sql);
    return res;
  },

  fetchEvsRoles: async (tag) => {
    var roles = [];
    // Electoral Roles
    //var sql = "select e.*,v.vote_time,v.vote_status,v.vote_sum,JSON_SEARCH(e.voters_whitelist, 'all', "+tag+") as voter,find_in_set('"+tag+"',e.ec_admins) as ec,find_in_set('"+tag+"',e.ec_agents) as agent from ehub_vote.election e left join ehub_vote.elector v on (e.id = v.election_id and v.tag = '"+tag+"') where ((json_search(e.voters_whitelist, 'one', "+tag+") is not null or find_in_set('"+tag+"',ec_admins) > 0 or find_in_set('"+tag+"',ec_agents) > 0)) and e.live_status = 1";
    var sql =
      "select e.*,v.vote_time,v.vote_status,v.vote_sum,JSON_SEARCH(e.voters_whitelist, 'all', ?) as voter,find_in_set(?,e.ec_admins) as ec,find_in_set(?,e.ec_agents) as agent from vote.election e left join vote.elector v on (e.id = v.election_id and v.tag = ?) where ((json_search(e.voters_whitelist, 'one', ?) is not null or find_in_set(?,ec_admins) > 0 or find_in_set(?,ec_agents) > 0)) and e.live_status = 1";

    var res = await db.query(sql, [tag, tag, tag, tag, tag, tag, tag]);
    if (res && res.length > 0) {
      for (var r of res) {
        if (r.ec)
          roles.push({
            role_id: 9,
            role_name: "ELECTORAL ADMIN",
            role_desc: "Electa Administrator",
            app_name: "Electa Voting System",
            app_desc: "Electa Voting System for the University",
            app_tag: "evs",
            ...r,
            data: res,
          });
        else if (r.agent)
          roles.push({
            role_id: 10,
            role_name: "ELECTORAL AGENT",
            role_desc: "Electa Agent",
            app_name: "Electa Voting System",
            app_desc: "Electa Voting System for the University",
            app_tag: "evs",
            ...r,
            data: res,
          });
        else if (r.voter)
          roles.push({
            role_id: 11,
            role_name: "ELECTORAL VOTER",
            role_desc: "Electa Voter",
            app_name: "Electa Voting System",
            app_desc: "Electa Voting System for the University",
            app_tag: "evs",
            ...r,
            data: res,
          });
      }
    } else {
      roles.push({
        role_id: 11,
        role_name: "ELECTORAL VOTER",
        role_desc: "Electa Voter",
        app_name: "Electa Voting System",
        app_desc: "Electa Voting System for the University",
        app_tag: "evs",
        ...r,
        data: [],
      });
    }
    /*
      const mx = md.map( r => `${r}`)
      fs.writeFile('utag.json',JSON.stringify(mx), function (err) {
         if (err) throw err;
         console.log('File is created successfully.');
      });
      */
    return roles;
  },

  fetchRoles: async (uid) => {
    const sql =
      "select u.arole_id,a.role_name,a.role_desc,u.role_meta,x.app_name,x.app_tag from identity.user_role u left join identity.app_role a on u.arole_id = a.arole_id left join identity.app x on a.app_id = x.app_id where u.uid = " +
      uid;
    const res = await db.query(sql);
    return res;
  },

  fetchPhoto: async (uid) => {
    //const sql = "select p.tag,p.path from identity.photo p where p.uid = '"+uid+"' or p.tag = '"+uid+"'";
    const sql =
      "select p.tag,p.path from identity.photo p where p.tag = '" + uid + "'";
    const res = await db.query(sql);
    return res;
  },

  fetchEvsPhoto: async (tag, eid) => {
    var sql;
    if (tag == "logo") {
      sql = "select logo as path from vote.election where id = ?";
    } else {
      sql = "select photo as path from vote.candidate where id = ?";
    }
    const res = await db.query(sql, [eid]);
    return res;
  },

  fetchSSOUser: async (tag) => {
    const sql =
      "select u.*,p.photo_id from identity.user u left join identity.photo p on p.uid = u.uid where u.tag = '" +
      tag +
      "'";
    const res = await db.query(sql);
    return res;
  },

  insertPhoto: async (uid, tag, group_id, path) => {
    const sql =
      "insert into identity.photo(uid,tag,path,group_id) values(" +
      uid +
      ",'" +
      tag +
      "','" +
      path +
      "'," +
      group_id +
      ")";
    const res = await db.query(sql);
    return res;
  },

  updatePhoto: async (pid, path) => {
    const sql =
      "update identity.photo set path = '" + path + "' where photo_id = " + pid;
    const res = await db.query(sql);
    return res;
  },

  fetchUser: async (uid, gid) => {
    var sql, res;
    switch (gid) {
      case "01": // Student
        //sql = "select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and u.uid = "+uid; break;
        res = await SR.getActiveStudentByUid(uid);
        break;
      case "02": // Staff
        sql =
          "select s.*,s.staff_no as tag,j.title as designation,x.title as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,c.title as countryname, r.title as regioname,u.uid from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.job j on j.id = s.job_id left join utility.unit x on s.unit_id = x.id left join utility.region r on r.id = s.region_id left join utility.country c on c.id = s.country_id where u.uid = " +
          uid;
        res = await db.query(sql);
        break;
      case "03": // NSS
        sql =
          "select s.*,s.nss_no as tag,'NSS OFFICER' as designation,x.title as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,u.uid from identity.user u left join hrs.nss s on u.tag = s.nss_no left join utility.unit x on s.unit_id = x.id where u.uid = " +
          uid;
        res = await db.query(sql);
        break;
      case "04": // Applicant (Job)
        sql = "select from identity.photo p where p.uid = " + uid;
        res = await db.query(sql);
        break;
      case "05": // Alumni
        sql =
          "select s.*,s.refno as tag,s.occupation as designation,s.employer_name as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,c.title as countryname, r.title as regioname,u.uid from identity.user u left join alumni.member s on u.tag = s.refno left join utility.region r on r.id = s.region_id left join utility.country c on c.id = s.country_id where u.uid = " +
          uid;
        res = await db.query(sql);
        break;
      default: // Staff
        sql =
          "select s.*,s.staff_no as tag,j.title as designation,x.title as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,c.title as countryname, r.title as regioname,u.uid from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.job j on j.id = s.job_id left join utility.unit x on s.unit_id = x.id left join utility.region r on r.id = s.region_id left join utility.country c on c.id = s.country_id where u.uid = " +
          uid;
        break;
        res = await db.query(sql);
        break;
    }
    return res;
  },

  fetchUserByVerb: async (keyword) => {
    keyword = keyword == null || keyword == "null" ? "" : keyword.trim();
    var sql, res;
    // Student
    sql =
      "select s.*,s.name,s.institute_email as mail,s.regno as tag,s.phone,'01' as gid,'STUDENT' as group_name,s.program_name as descriptor,s.department as unitname from ais.fetchstudents s where s.indexno = '" +
      keyword +
      "' or s.institute_email = '" +
      keyword +
      "'";
    const res1 = await db.query(sql);
    if (res1 && res1.length > 0) res = res1[0];

    // Staff
    sql =
      "select s.*,j.title as designation,x.title as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,s.inst_mail as mail,s.staff_no as tag,'02' as gid,'STAFF' as group_name,j.title as descriptor from hrs.staff s left join hrs.promotion p on s.promo_id = p.id left join hr.job j on j.id = p.job_id left join utitlity.unit x on p.unit_id = x.id where (s.inst_mail = '" +
      keyword +
      "' or trim(s.staff_no) = '" +
      keyword +
      "') and s.inst_mail is not null";
    const res2 = await db.query(sql);
    if (res2 && res2.length > 0) res = res2[0];

    // NSS
    sql =
      "select s.*,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,s.mobile as phone,'03' as gid,'NSS' as group_name from hrs.nss s left join utility.unit x on s.unit_id = x.id where s.nss_no = '" +
      keyword +
      "' or s.email = '" +
      keyword +
      "'";
    const res3 = await db.query(sql);
    if (res3 && res3.length > 0) res = res3[0];

    // Applicant (Job)
    //sql = "select *,'04' as gid from ehub_identity.photo p where p.uid = "+uid;
    //const res4 = await db.query(sql);
    //if(res4 && res4.length > 0) res = res4[0]

    // Alumni
    sql =
      "select *,'05' as gid,'ALUMNI' as group_name from alumni.member where refno = '" +
      keyword +
      "'";
    const res5 = await db.query(sql);
    if (res5 && res5.length > 0) res = res5[0];

    return res;
  },

  fetchUserByPhone: async (phone) => {
    // Student
    //const res1 = await db.query("select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end,u.username,u.uid,u.group_id,u.group_id as gid from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and s.phone = "+phone);
    const res1 = await SR.getActiveStudentByPhone(phone);
    // Staff
    const res2 = await db.query(
      "select s.*,j.title as designation,x.title as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,u.username,u.uid,u.group_id,u.group_id as gid from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.job j on j.id = s.job_id left join utility.unit x on s.unit_id = x.id where s.phone = " +
        phone
    );
    // NSS
    // Applicant (Job)
    // Alumni
    if (res1 && res1.length > 0) return res1;
    if (res2 && res2.length > 0) return res2;
  },

  updateUserByEmail: async (email, data) => {
    const sql = "update identity.user set ? where username = '" + email + "'";
    const res = await db.query(sql, data);
    return res;
  },

  insertSSOUser: async (data) => {
    const sql = "insert into identity.user set ?";
    const res = await db.query(sql, data);
    return res;
  },

  insertSSORole: async (data) => {
    const sql = "insert into identity.user_role set ?";
    const res = await db.query(sql, data);
    return res;
  },

  deleteSSORole: async (uid, role) => {
    const sql =
      "delete from identity.user_role where uid = " +
      uid +
      " and arole_id = " +
      role;
    const res = await db.query(sql);
    return res;
  },

  logger: async (uid, action, meta) => {
    const data = { uid, title: action, meta: JSON.stringify(meta) };
    const res = await db.query("insert into identity.`activity` set ?", data);
    return res;
  },

  apilogger: async (ip, action, meta) => {
    const data = { ip, title: action, meta: JSON.stringify(meta) };
    const res = await db.query("insert into fms.`activity_api` set ?", data);
    return res;
  },

  applicantlogger: async (serial, action, meta) => {
    const data = { serial, title: action, meta: JSON.stringify(meta) };
    const res = await db.query(
      "insert into P06.`activity_applicant` set ?",
      data
    );
    return res;
  },

  // SESSION MODELS

  fetchSessions: async () => {
    const res = await db.query(
      "select * from session order by session_id desc"
    );
    return res;
  },

  insertSession: async (data) => {
    const res = await db.query("insert into session set ?", data);
    return res;
  },

  updateSession: async (session_id, data) => {
    const res = await db.query(
      "update session set ? where session_id = " + session_id,
      data
    );
    return res;
  },

  deleteSession: async (session_id) => {
    const res = await db.query(
      "delete from session where session_id = " + session_id
    );
    return res;
  },

  setDefaultSession: async (session_id) => {
    await db.query("update session set status = 0");
    const res = await db.query(
      "update session set status = 1 where session_id =" + session_id
    );
    return res;
  },

  // VENDOR MODELS

  fetchVendors: async () => {
    const res = await db.query("select * from vendor order by vendor_id");
    return res;
  },

  insertVendor: async (data) => {
    const res = await db.query("insert into vendor set ?", data);
    return res;
  },

  updateVendor: async (vendor_id, data) => {
    const res = await db.query(
      "update vendor set ? where vendor_id = " + vendor_id,
      data
    );
    return res;
  },

  deleteVendor: async (vendor_id) => {
    const res = await db.query(
      "delete from vendor where vendor_id = " + vendor_id
    );
    return res;
  },

  // VOUCHER - AMS MODELS

  fetchVouchers: async (session_id, page, keyword) => {
    var sql =
      "select v.*,x.vendor_name,g.title as group_name,case when v.sell_type = 0 then g.title when v.sell_type = 1 then 'MATURED' when v.sell_type = 2 then 'INTERNATIONAL' end as group_title from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where session_id = " +
      session_id;
    var cql =
      "select count(*) as total from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where session_id = " +
      session_id;

    const size = 20;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` and v.serial = '${keyword}' or v.applicant_name like '%${keyword}%' or v.applicant_phone = '${keyword}'`;
      cql += ` and v.serial = '${keyword}' or v.applicant_name like '%${keyword}%' or v.applicant_phone = '${keyword}'`;
    }

    sql += ` order by serial asc,vendor_id asc, applicant_name asc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);
    console.log(res);
    console.log(sql);
    console.log(page);
    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchVouchersByType: async (session_id, sell_type) => {
    const res = await db.query(
      "select v.*,x.vendor_name,g.title as group_name,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where session_id = " +
        session_id +
        " and sell_type = " +
        sell_type +
        " order by serial asc,vendor_id asc, applicant_name asc"
    );
    return { data: res };
  },

  fetchVoucherBySerial: async (serial) => {
    const res = await db.query(
      "select v.*,x.vendor_name,g.title as group_name,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where serial = " +
        serial
    );
    return res;
  },

  fetchVoucherByPhone: async (phone) => {
    const res = await db.query(
      "select v.*,x.vendor_name,g.title as group_name,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where v.applicant_phone = '" +
        phone.trim() +
        "'"
    );
    return res;
  },

  fetchVoucherGroups: async () => {
    const res = await db.query(
      "select p.price_id as formId,p.title as formName,p.currency,p.amount as serviceCharge from P06.price p where p.status = 1"
    );
    const resm = await db.query(
      "select s.session_id as `sessionId`,s.title as `sessionName` from P06.session s where s.status = 1"
    );
    if (res && res.length > 0 && resm && resm.length > 0)
      return { ...resm[0], forms: [...res] };
    return null;
  },

  fetchSMSFailedVouchers: async () => {
    const res = await db.query(
      "select * from fms.voucher_log where sms_code > 1000"
    );
    if (res && res.length > 0) return res[0];
    return null;
  },

  resendVoucherBySms: async (serial) => {
    const res = await db.query(
      "select * from fms.voucher_log where serial = " + serial
    );
    if (res && res.length > 0) return res[0];
    return null;
  },

  updateVoucherLogBySerial: async (serial, data) => {
    const res = await db.query(
      "update fms.voucher_log set ? where serial = " + serial,
      data
    );
    return res;
  },

  sellVoucher: async (
    formId,
    collectorId,
    sessionId,
    buyerName,
    buyerPhone,
    tid
  ) => {
    const pr = await db.query(
      "select * from P06.price p where p.price_id = " + formId
    );
    const vd = await db.query(
      "select c.vendor_id from fms.collector c left join P06.vendor v on c.vendor_id = v.vendor_id where c.id = " +
        collectorId
    );
    if (pr && vd) {
      const vc = await db.query(
        "select serial,pin from P06.voucher where vendor_id = " +
          vd[0].vendor_id +
          " and session_id =" +
          sessionId +
          " and group_id = '" +
          pr[0].group_id +
          "' and sell_type = " +
          pr[0].sell_type +
          " and sold_at is null"
      );
      if (vc && vc.length > 0) {
        // Update Voucher Status & Buyer Details
        const dm = {
          applicant_name: buyerName,
          applicant_phone: buyerPhone,
          sold_at: new Date(),
        };
        const ups = await db.query(
          "update P06.voucher set ? where serial = " + vc[0].serial,
          dm
        );
        if (ups.affectedRows > 0) {
          const isIn = await db.query(
            "select * from fms.voucher_log where tid = " +
              tid +
              " and session_id = " +
              sessionId
          );
          if (isIn && isIn.length > 0) {
            // Update Voucher Sales Log - Success
            const vlog = { serial: vc[0].serial, pin: vc[0].pin, generated: 1 };
            const vins = await db.query(
              "update fms.voucher_log set ? where tid = " +
                tid +
                " and session_id = " +
                sessionId,
              vlog
            );
            return { ...vc[0], logId: vins.insertId };
          } else {
            // Insert Voucher Sales Log - Success
            const vlog = {
              tid,
              session_id: sessionId,
              serial: vc[0].serial,
              pin: vc[0].pin,
              buyer_name: buyerName,
              buyer_phone: buyerPhone,
              generated: 1,
            };
            const vins = await db.query(
              "insert into fms.voucher_log set ? ",
              vlog
            );
            return { ...vc[0], logId: vins.insertId };
          }
        }
        /*
            else{ 
               // Insert Voucher Sales Log - Error
               const vlog = { tid,session_id:sessionId,serial:null,pin:null,buyer_name:buyerName,buyer_phone:buyerPhone,generated:0 }
               const vins = await db.query("insert into fms.voucher_log set ?",vlog);
               return null
            }
            */
      } else {
        // Insert Voucher Sales Log - Error
        const isIn = await db.query(
          "select * from fms.voucher_log where tid = " +
            tid +
            " and session_id = " +
            sessionId
        );
        if (isIn && isIn.length == 0) {
          // Insert Voucher Sales Log - Success
          const vlog = {
            tid,
            session_id: sessionId,
            serial: null,
            pin: null,
            buyer_name: buyerName,
            buyer_phone: buyerPhone,
            generated: 0,
          };
          const vins = await db.query(
            "insert into fms.voucher_log set ? ",
            vlog
          );
        }
        return null;
      }
    } else {
      // Insert Voucher Sales Log - Error
      const isIn = await db.query(
        "select * from fms.voucher_log where tid = " +
          tid +
          " and session_id = " +
          sessionId
      );
      if (isIn && isIn.length == 0) {
        // Insert Voucher Sales Log - Success
        const vlog = {
          tid,
          session_id: sessionId,
          serial: null,
          pin: null,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          generated: 0,
        };
        const vins = await db.query("insert into fms.voucher_log set ? ", vlog);
      }
      return null;
    }
  },

  sellVoucherBySerial: async (serial, name, phone) => {
    // Update Voucher Status & Buyer Details
    const dm = {
      applicant_name: name,
      applicant_phone: phone,
      sold_at: new Date(),
    };
    const vc = await db.query(
      "select * from P06.voucher where serial = " + serial
    );
    if (vc && vc.length > 0) {
      const ups = await db.query(
        "update P06.voucher set ? where serial = " + serial,
        dm
      );
      if (ups.affectedRows > 0) {
        const isIn = await db.query(
          "select * from fms.voucher_log where serial = " + serial
        );
        if (isIn && isIn.length == 0) {
          const vlog = {
            tid: null,
            session_id: vc[0].session_id,
            serial,
            pin: vc[0].pin,
            buyer_name: name,
            buyer_phone: phone,
            generated: 1,
          };
          const vins = await db.query(
            "insert into fms.voucher_log set ? ",
            vlog
          );
          return { ...vc[0], logId: vins.insertId, name, phone };
        }
      }
    }
    return null;
  },

  insertVoucher: async (data) => {
    const res = await db.query("insert into voucher set ?", data);
    return res;
  },

  updateVoucher: async (serial, data) => {
    const res = await db.query(
      "update voucher set ? where serial = " + serial,
      data
    );
    return res;
  },

  deleteVoucher: async (serial) => {
    const res = await db.query("delete from voucher where serial = " + serial);
    return res;
  },

  getLastVoucherIndex: async (session) => {
    const res = await db.query(
      "select serial from P06.voucher where session_id = " +
        session +
        " order by serial desc limit 1"
    );
    if (res && res.length > 0) return res[0].serial;
    const sess = await db.query(
      "select voucher_index from P06.session where session_id = " + session
    );
    return sess && sess[0].voucher_index;
    //const algo = `${moment().format('YY')}${ parseInt(moment().format('YY'))+parseInt(moment().format('MM'))}${1000}`
    //return parseInt(algo)
  },

  updateVoucherLog: async (id, data) => {
    const res = await db.query(
      "update fms.voucher_log set ? where id = " + id,
      data
    );
    return res;
  },

  // APPLICANTS - AMS MODELS

  fetchApplicants: async (group, page, keyword) => {
    var sid = await db.query(
      "select session_id from P06.session where status = 1"
    );
    if (sid && sid.length > 0) {
      var sql =
        "select p.serial,p.started_at,p.photo,p.flag_submit,p.grade_value,p.class_value,ifnull(convert(i.phone,CHAR),convert(v.applicant_phone,CHAR)) as phone,ifnull(concat(i.fname,' ',i.lname),concat('Buyer: ',v.applicant_name)) as name,i.dob,v.sell_type,i.gender,p.flag_submit,g.title as group_name,v.group_id,a.title as applytype,(select concat(r1.`short`,ifnull(concat(' ( ',m1.title,' ) '),'')) as choice_name1 from step_choice c1 left join utility.program r1 on r1.id = c1.program_id left join ais.major m1 on c1.major_id = m1.id where c1.serial = p.serial order by c1.choice_id asc limit 1) as choice_name1,(select concat(r2.`short`,ifnull(concat(' ( ',m2.title,' ) '),'')) as choice_name2 from step_choice c2 left join utility.program r2 on r2.id = c2.program_id left join ais.major m2 on c2.major_id = m2.id where c2.serial = p.serial order by c2.choice_id desc limit 1) as choice_name2 from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join `group` g on v.group_id = g.group_id left join apply_type a on a.type_id = p.apply_type left join P06.sorted s on s.serial = p.serial where s.serial is null and v.group_id = '" +
        group +
        "' and v.session_id = " +
        sid[0].session_id;
      var cql =
        "select count(*) as total from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join `group` g on v.group_id = g.group_id left join apply_type a on a.type_id = p.apply_type left join P06.sorted s on s.serial = p.serial where s.serial is null  and v.group_id = '" +
        group +
        "' and v.session_id = " +
        sid[0].session_id;

      const size = 10;
      const pg = parseInt(page);
      const offset = pg * size || 0;

      if (keyword) {
        sql += ` and (p.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%')`;
        cql += ` and (p.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%')`;
      }

      sql += ` order by p.started_at, p.serial`;
      sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

      const ces = await db.query(cql);
      const res = await db.query(sql);
      const count = Math.ceil(ces[0].total / size);
      return {
        totalPages: count,
        totalData: ces[0].total,
        data: res,
      };
    } else {
      return {
        totalPages: 1,
        totalData: 0,
        data: [],
      };
    }
  },

  fetchApplicantsByType: async (sell_type) => {
    var sid = await db.query(
      "select session_id from P06.session where status = 1"
    );
    if (sid && sid.length > 0) {
      const res = await db.query(
        "select p.serial,p.started_at,p.photo,concat(i.fname,' ',i.lname) as name,v.sell_type,i.gender,p.flag_submit,r.`short` as choice_name,g.title as group_name,v.group_id,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join step_choice c on p.serial = c.serial left join utility.program r on r.id = c.program_id left join `group` g on v.group_id = g.group_id where v.session_id = " +
          sid[0].session_id +
          " and v.sell_type = " +
          sell_type +
          " order by p.serial asc"
      );
      return { data: res };
    } else {
      return null;
    }
  },

  fetchDocuments: async (serial) => {
    const res = await db.query(
      "select * from P06.step_document where serial = " + serial
    );
    return res;
  },

  addToSort: async (serial) => {
    var sid = await db.query(
      "select session_id from P06.session where status = 1"
    );
    if (sid && sid.length > 0) {
      var vs = await db.query(
        "select p.serial,p.stage_id,p.apply_type,v.sell_type,v.group_id,p.grade_value,p.class_value,p.flag_admit,(select choice_id from step_choice c1 where c1.serial = p.serial order by c1.choice_id asc limit 1) as choice1_id,(select choice_id from step_choice c2 where c2.serial = p.serial order by c2.choice_id desc limit 1) as choice2_id from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial where v.session_id = " +
          sid[0].session_id +
          " and p.serial = " +
          serial
      );
      if (vs && vs.length > 0) {
        const data = {
          serial: serial,
          session_id: sid[0].session_id,
          group_id: vs[0].group_id,
          stage_id: vs[0].stage_id,
          apply_type: vs[0].apply_type,
          sell_type: vs[0].sell_type,
          choice1_id: vs[0].choice1_id,
          choice2_id: vs[0].choice2_id,
          grade_value: vs[0].grade_value,
          class_value: vs[0].class_value,
          flag_admit: vs[0].flag_admit,
          created_at: new Date(),
        };
        const res = await db.query("insert into P06.sorted set ?", data);
        return { data: res };
      }
    }
    return null;
  },

  // SORTED APPLICANTS - AMS

  fetchSortedApplicants: async (page, keyword) => {
    var sid = await db.query(
      "select session_id from P06.session where status = 1"
    );
    if (sid && sid.length > 0) {
      var sql =
        "select h.*,concat(i.fname,' ',i.lname) as name,i.dob,i.gender,r1.`short` as choice_name1,r2.`short` as choice_name2,p.started_at,p.photo,v.sell_type,g.title as group_name,v.group_id,t.title as applytype from P06.sorted h left join step_profile i on h.serial = i.serial left join P06.applicant p on p.serial = h.serial left join voucher v on v.serial = h.serial left join step_choice c1 on h.choice1_id = c1.choice_id left join utility.program r1 on r1.id = c1.program_id left join step_choice c2 on h.choice2_id = c2.choice_id left join utility.program r2 on r2.id = c2.program_id left join `group` g on v.group_id = g.group_id left join P06.apply_type t on h.apply_type = t.type_id left join admitted a on h.serial = a.serial where a.serial is null and h.session_id = " +
        sid[0].session_id;
      var cql =
        "select count(*) as total from P06.sorted h left join step_profile i on h.serial = i.serial left join P06.applicant p on p.serial = h.serial left join voucher v on v.serial = h.serial left join step_choice c1 on h.choice1_id = c1.choice_id left join utility.program r1 on r1.id = c1.program_id left join step_choice c2 on h.choice2_id = c2.choice_id left join utility.program r2 on r2.id = c2.program_id left join `group` g on v.group_id = g.group_id left join P06.apply_type t on h.apply_type = t.type_id left join admitted a on h.serial = a.serial where a.serial is null and h.session_id = " +
        sid[0].session_id;

      const size = 50;
      const pg = parseInt(page);
      const offset = pg * size || 0;

      if (keyword) {
        sql += ` and h.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%' or g.title like '%${keyword}%' or r2.\`short\` like '%${keyword}%' or r1.\`short\` like '%${keyword}%' or t.title like '%${keyword}%'`;
        cql += ` and h.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%' or g.title like '%${keyword}%' or r2.\`short\` like '%${keyword}%' or r1.\`short\` like '%${keyword}%' or t.title like '%${keyword}%'`;
      }

      sql += " order by r1.`short` asc";
      sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

      const ces = await db.query(cql);
      const res = await db.query(sql);
      const count = Math.ceil(ces[0].total / size);

      return {
        totalPages: count,
        totalData: ces[0].total,
        data: res,
      };
    } else {
      return {
        totalPages: 0,
        totalData: 0,
        data: [],
      };
    }
  },

  fetchSortedApplicantsByType: async (session_id, sell_type) => {
    const res = await db.query(
      "select p.serial,p.started_at,p.photo,concat(i.fname,' ',i.lname) as name,v.sell_type,i.gender,p.flag_submit,r.`short` as choice_name,g.title as group_name,v.group_id,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join step_choice c on p.serial = c.serial left join utility.program r on r.id = c.program_id left join `group` g on v.group_id = g.group_id where v.session_id = " +
        session_id +
        " and v.sell_type = " +
        sell_type +
        " order by p.serial asc"
    );
    return { data: res };
  },

  switchVoucher: async (data) => {
    console.log(data);
    const { voucher, session } = data;
    const res = await db.query(
      "update P06.voucher set session_id = " +
        session +
        " where serial = " +
        voucher
    );
    return res;
  },

  admitApplicant: async (data) => {
    console.log(data);
    // Fetch active session for acdemic session (vs )
    const vs = await db.query("select * from P06.session where status = 1");
    // Fetch step_profile [ biodata, study_mode ] (sp)
    const sp = await db.query(
      "select * from P06.step_profile where serial = " + data.serial
    );
    // Fetch step_guardian [ biodata] (sg)
    const sg = await db.query(
      "select * from P06.step_guardian where serial = " + data.serial
    );
    // Fetch Program Info
    const pg = await db.query(
      "select * from utility.program where id = " + data.program_id
    );

    if (sg && sp && vs && vs.length > 0 && sp.length > 0 && sg.length > 0) {
      // Fetch fms.billinfo for bill_id for freshers bill (bl)
      var bl, bql;
      if (sp[0].resident_country == 84 || sp[0].resident_country == "GH") {
        const group_code =
          data.start_semester > 1
            ? "0100,0101,0110,0111,1100,1101,1110,1111"
            : "1000,1001,1010,1011,1100,1101,1110,1111";
        bql =
          "select * from fms.billinfo where prog_id = " +
          data.program_id +
          " and session_id = " +
          vs[0].academic_session_id +
          " and group_code in (" +
          group_code +
          ") and post_type = 'GH' and post_status = 1";
        bl = await db.query(bql);
      } else {
        bql =
          "select * from fms.billinfo where session_id = " +
          vs[0].academic_session_id +
          " and post_type = 'INT' and post_status = 1";
        bl = await db.query(bql);
      }

      const bid = bl && bl.length > 0 ? bl[0].bid : null;

      // Generate Email Address
      var email,
        count = 1;
      const username = getUsername(sp[0].fname, sp[0].lname);
      email = `${username}@st.aucc.edu.gh`;
      while (true) {
        var isExist = await Student.findEmail(email);
        if (isExist && isExist.length > 0) {
          count = count + 1;
          email = `${username}${count}@st.aucc.edu.gh`;
        } else {
          break;
        }
      }
      // Generate Password
      const password = nanoid();
      // Insert into P06.admitted tbl
      const da = {
        serial: data.serial,
        admit_session: data.session_id,
        academ_session: vs[0].academic_session_id,
        group_id: data.group_id,
        stage_id: data.stage_id,
        apply_type: data.apply_type,
        sell_type: data.sell_type,
        bill_id: bid,
        prog_id: data.program_id,
        major_id: data.major_id,
        start_semester: data.start_semester,
        session_mode: sp[0].session_mode,
        username: email,
        password,
      };
      await db.query("insert into P06.admitted set ?", da);
      // Update into P06.step_profile tbl
      const dz = { flag_admit: 1 };
      await db.query(
        "update P06.applicant set ? where serial = " + data.serial,
        dz
      );
      // Insert data into ais.student
      const dp = {
        refno: data.serial,
        fname: sp[0].fname,
        lname: sp[0].lname,
        prog_id: data.program_id,
        major_id: data.major_id,
        gender: sp[0].gender,
        dob: sp[0].dob,
        phone: sp[0].phone,
        email: sp[0].email,
        address: sp[0].resident_address,
        hometown: sp[0].home_town,
        session: sp[0].session_mode,
        country_id: sp[0].resident_country,
        semester: data.start_semester,
        entry_semester: data.start_semester,
        entry_group:
          sp[0].resident_country == 84 || sp[0].resident_country == "GH"
            ? "GH"
            : "INT",
        doa: vs[0].admission_date,
        institute_email: email,
        guardian_name: `${sg[0].fname} ${sg[0].lname}`,
        guardian_phone: sg[0].phone,
        religion_id: sp[0].religion,
        disability: sp[0].disabled,
      };
      await db.query("insert into ais.student set ?", dp);
      // Insert into ais.mail
      const dm = { refno: data.serial, mail: email };
      await db.query("insert into ais.mail set ?", dm);
      // Insert data into identity.user
      const du = {
        group_id: 1,
        tag: data.serial,
        username: email,
        password: sha1(password),
      };
      await db.query("insert into identity.user set ?", du);
      // Insert Photo into Database

      if (bid) {
        // Insert Academic Fees or Bill charged
        const df = {
          session_id: vs[0].academic_session_id,
          bill_id: bid,
          refno: data.serial,
          narrative: bl[0].narrative,
          currency: bl[0].currency,
          amount: bl[0].amount,
        };
        await db.query("insert into fms.studtrans set ?", df);
        // Insert Discount (Payment)
        const dj = {
          session_id: vs[0].academic_session_id,
          bill_id: bid,
          refno: data.serial,
          narrative: `DISCOUNT ON ${bl[0].narrative} FEES`,
          currency: bl[0].currency,
          amount: -1 * bl[0].discount,
        };
        await db.query("insert into fms.studtrans set ?", df);
      }
      return {
        ...da,
        ...dp,
        ...dm,
        ...du,
        program: pg[0].short,
        phone: sp[0].phone,
      };
    } else {
      return null;
    }
  },

  reAdmitApplicant: async (data) => {
    // Fetch active session for acdemic session (vs )
    const vs = await db.query("select * from P06.session where status = 1");
    // Fetch step_profile [ biodata, study_mode ] (sp)
    const sp = await db.query(
      "select * from P06.step_profile where serial = " + data.serial
    );
    // Fetch step_guardian [ biodata] (sg)
    const sg = await db.query(
      "select * from P06.step_guardian where serial = " + data.serial
    );
    // Fetch Program Info
    const pg = await db.query(
      "select p.*,d.* from P06.admitted d left join utility.program p on d.prog_id = p.id where d.serial = " +
        data.serial
    );

    if (
      sg &&
      sp &&
      vs &&
      pg &&
      vs.length > 0 &&
      sp.length > 0 &&
      sg.length > 0 &&
      pg.length > 0
    ) {
      // Fetch fms.billinfo for bill_id for freshers bill (bl)
      var bl, bql;
      if (sp[0].resident_country == 84 || sp[0].resident_country == "GH") {
        const group_code =
          pg[0].start_semester > 1
            ? "0100,0101,0110,0111,1100,1101,1110,1111"
            : "1000,1001,1010,1011,1100,1101,1110,1111";
        bql =
          "select * from fms.billinfo where prog_id = " +
          pg[0].id +
          " and session_id = " +
          vs[0].academic_session_id +
          " and group_code in (" +
          group_code +
          ") and post_type = 'GH' and post_status = 1";
        bl = await db.query(bql);
      } else {
        bql =
          "select * from fms.billinfo where session_id = " +
          vs[0].academic_session_id +
          " and post_type = 'INT' and post_status = 1";
        bl = await db.query(bql);
      }

      const bid = bl && bl.length > 0 ? bl[0].bid : null;
      // Generate Email Address
      var email,
        count = 1;
      const username = getUsername(sp[0].fname, sp[0].lname);
      email = `${username}@st.aucc.edu.gh`;
      while (true) {
        var isExist = await Student.findEmail(email);
        if (isExist && isExist.length > 0) {
          count = count + 1;
          email = `${username}${count}@st.aucc.edu.gh`;
        } else {
          break;
        }
      }
      // Generate Password
      const password = nanoid();
      // Insert into P06.admitted tbl
      const da = {
        serial: data.serial,
        admit_session: pg[0].admit_session,
        academ_session: pg[0].admit_session,
        group_id: pg[0].group_id,
        stage_id: pg[0].stage_id,
        apply_type: pg[0].apply_type,
        sell_type: pg[0].sell_type,
        bill_id: bid,
        prog_id: pg[0].prog_id,
        major_id: pg[0].major_id,
        start_semester: pg[0].start_semester,
        session_mode: pg[0].session_mode,
        username: email,
        password,
      };
      //await db.query("insert into P06.admitted set ?", da)
      // Update into P06.step_profile tbl
      const dz = { flag_admit: 1 };
      await db.query(
        "update P06.applicant set ? where serial = " + data.serial,
        dz
      );
      // Insert data into ais.student
      const dp = {
        refno: data.serial,
        fname: sp[0].fname,
        lname: sp[0].lname,
        prog_id: pg[0].prog_id,
        major_id: pg[0].major_id,
        gender: sp[0].gender,
        dob: sp[0].dob,
        phone: sp[0].phone,
        email: sp[0].email,
        address: sp[0].resident_address,
        hometown: sp[0].home_town,
        session: sp[0].session_mode,
        country_id: sp[0].resident_country,
        semester: pg[0].start_semester,
        entry_semester: pg[0].start_semester,
        entry_group:
          sp[0].resident_country == 84 || sp[0].resident_country == "GH"
            ? "GH"
            : "INT",
        doa: vs[0].admission_date,
        institute_email: email,
        guardian_name: `${sg[0].fname} ${sg[0].lname}`,
        guardian_phone: sg[0].phone,
        religion_id: sp[0].religion,
        disability: sp[0].disabled,
      };
      await db.query("insert into ais.student set ?", dp);
      // Insert into ais.mail
      const dm = { refno: data.serial, mail: email };
      await db.query("insert into ais.mail set ?", dm);
      // Insert data into identity.user
      const du = {
        group_id: 1,
        tag: data.serial,
        username: email,
        password: sha1(password),
      };
      const isDu = await db.query(
        "select * from identity.user where tag = '" + data.serial + "'"
      );
      if (isDu && isDu.length == 0)
        await db.query("insert into identity.user set ?", du);

      if (bid) {
        // Insert Academic Fees or Bill charged
        const df = {
          session_id: vs[0].academic_session_id,
          bill_id: bid,
          refno: data.serial,
          narrative: bl[0].narrative,
          currency: bl[0].currency,
          amount: bl[0].amount,
        };
        await db.query("insert into fms.studtrans set ?", df);
        // Insert Discount (Payment)
        const dj = {
          session_id: vs[0].academic_session_id,
          bill_id: bid,
          refno: data.serial,
          narrative: `DISCOUNT ON ${bl[0].narrative} FEES`,
          currency: bl[0].currency,
          amount: -1 * bl[0].discount,
        };
        await db.query("insert into fms.studtrans set ?", df);
      }
      return {
        ...da,
        ...dp,
        ...dm,
        ...du,
        program: pg[0].short,
        phone: sp[0].phone,
      };
    } else {
      return null;
    }
  },

  // MATRICULANTS - AMS MODELS

  fetchFreshers: async (page, keyword) => {
    var sid = await db.query(
      "select session_id from P06.session where status = 1"
    );
    if (sid && sid.length > 0) {
      var sql =
        "select distinct h.serial,h.start_semester,h.created_at,concat(i.fname,' ',i.lname) as name,i.dob,i.gender,i.phone,p.`short` as program_name from P06.admitted h left join ais.student i on h.serial = i.refno left join utility.program p on p.id = h.prog_id where h.admit_session = " +
        sid[0].session_id;
      var cql =
        "select count(distinct(h.serial)) as total from P06.admitted h left join ais.student i on h.serial = i.refno left join utility.program p on p.id = h.prog_id where h.admit_session = " +
        sid[0].session_id;

      const size = 50;
      const pg = parseInt(page);
      const offset = pg * size || 0;

      if (keyword) {
        sql += ` and h.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%' or p.\`short\` like '%${keyword}%'`;
        cql += ` and h.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%' or p.\`short\` like '%${keyword}%'`;
      }

      sql += " order by p.`short`, h.created_at";
      sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

      const ces = await db.query(cql);
      const res = await db.query(sql);
      const count = Math.ceil(ces[0].total / size);

      return {
        totalPages: count,
        totalData: ces[0].total,
        data: res,
      };
    } else {
      return {
        totalPages: 0,
        totalData: 0,
        data: [],
      };
    }
  },

  fetchFreshersData: async () => {
    var sid = await db.query(
      "select session_id from P06.session where status = 1"
    );
    if (sid && sid.length > 0) {
      var sql =
        "select distinct h.serial,h.start_semester,h.created_at,concat(i.fname,' ',i.lname) as name,i.dob,i.gender,i.phone,p.`short` as program_name from P06.admitted h left join ais.student i on h.serial = i.refno left join utility.program p on p.id = h.prog_id where h.admit_session = " +
        sid[0].session_id;
      sql += " order by p.`short`, h.created_at";
      const res = await db.query(sql);
      return res;
    }
  },

  removeFresherData: async (serial) => {
    // Delete from P06.admitted tbl
    var ins = await db.query(
      "delete from P06.admitted where serial = " + serial
    );
    // Reset Flag_admit from P06.applicant tbl
    var ins = await db.query(
      "update P06.applicant set flag_admit = 0 where serial = " + serial
    );
    // Delete from ais.student
    var ins = await db.query(
      "delete from ais.student where refno = '" + serial + "'"
    );
    // Delete from ais.mail
    var ins = await db.query(
      "delete from ais.mail where refno = '" + serial + "'"
    );
    // Delete from identity.user
    var ins = await db.query(
      "delete from identity.user where tag = '" + serial + "'"
    );
    // Delete from Academic Fees or Bill charged
    var ins = await db.query(
      "delete from fms.studtrans where refno = '" + serial + "'"
    );
    if (ins) return ins;
    return null;
  },

  // LETTERS MODELS

  fetchLetters: async () => {
    const res = await db.query("select * from P06.letter order by id desc");
    return res;
  },

  insertLetter: async (data) => {
    const res = await db.query("insert into P06.letter set ?", data);
    return res;
  },

  updateLetter: async (id, data) => {
    const res = await db.query(
      "update P06.letter set ? where id = " + id,
      data
    );
    return res;
  },

  deleteLetter: async (id) => {
    const res = await db.query("delete from P06.letter where id = " + id);
    return res;
  },

  setDefaultLetter: async (id) => {
    await db.query("update P06.letter set status = 0");
    const res = await db.query(
      "update P06.letter set status = 1 where id =" + id
    );
    return res;
  },

  // DEFERMENT MODELS
  fetchDefer: async () => {
    const res = await db.query(
      "select a.*,date_format(a.verified_at,'%M %d, %Y') as verified_at,upper(concat(s.fname,' ',s.lname)) as name from ais.deferment a left join ais.student s on a.indexno = s.indexno order by id desc"
    );
    return res;
  },

  insertDefer: async (data) => {
    const res = await db.query("insert into ais.deferment set ?", data);
    return res;
  },

  updateDefer: async (id, data) => {
    const res = await db.query(
      "update ais.deferment set ? where id = " + id,
      data
    );
    return res;
  },

  deleteDefer: async (id) => {
    const res = await db.query("delete from ais.deferment where id = " + id);
    return res;
  },

  approveDefer: async (id, sno) => {
    var res;
    const ss = await db.query("select * from ais.deferment where id =" + id);
    if (ss && ss.length > 0) {
      const st = await db.query(
        "update ais.student set defer_status = 1 where refno = '" +
          ss[0].refno +
          "'"
      );
      res = await db.query(
        "update ais.deferment set verified = 1, verified_at = now(), verified_by = " +
          sno +
          " where id =" +
          id
      );
    }
    return res;
  },

  resumeDefer: async (id, sno) => {
    var res;
    const ss = await db.query("select * from ais.deferment where id =" + id);
    if (ss && ss.length > 0) {
      const st = await db.query(
        "update ais.student set defer_status = 0 where refno = '" +
          ss[0].refno +
          "'"
      );
      res = await db.query(
        "update ais.deferment set verified = 2, resumed_at = now(), resumed_by = " +
          sno +
          " where id =" +
          id
      );
    }
    return res;
  },

  // ENTRANCE EXAMS MODELS

  fetchEntrance: async (page, keyword) => {
    var sid = await db.query(
      "select session_id from P06.session where status = 1"
    );
    if (sid && sid.length > 0) {
      var sql =
        "select ifnull(concat(i.fname,' ',i.lname),v.applicant_name) as name,i.dob,i.gender,i.phone,h.subject_id,h.score,h.created_at,h.serial,h.grade,h.id,h.session_id from P06.entrance h left join P06.step_profile i on h.serial = i.serial left join P06.voucher v on v.serial = h.serial where h.session_id = " +
        sid[0].session_id;
      var cql =
        "select count(*) as total from  P06.entrance h left join P06.step_profile i on h.serial = i.serial left join P06.voucher v on v.serial = h.serial where h.session_id = " +
        sid[0].session_id;

      const size = 20;
      const pg = parseInt(page);
      const offset = pg * size || 0;

      if (keyword) {
        sql += ` and h.serial = '${keyword}'`;
        cql += ` and h.serial = '${keyword}'`;
      }

      sql += " order by h.created_at,h.serial";
      sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

      const ces = await db.query(cql);
      const res = await db.query(sql);
      const count = Math.ceil(ces[0].total / size);

      return {
        totalPages: count,
        totalData: ces[0].total,
        data: res,
      };
    } else {
      return {
        totalPages: 0,
        totalData: 0,
        data: [],
      };
    }
  },

  insertEntrance: async (data) => {
    const res = await db.query("insert into P06.entrance set ?", data);
    return res;
  },

  updateEntrance: async (id, data) => {
    const res = await db.query(
      "update P06.entrance set ? where id = " + id,
      data
    );
    return res;
  },

  deleteEntrance: async (id) => {
    const res = await db.query("delete from P06.entrance where id = " + id);
    return res;
  },

  viewEntrance: async (serial) => {
    const res = await db.query(
      "select ifnull(concat(i.fname,' ',i.lname),v.applicant_name) as name,i.dob,i.gender,i.phone,h.subject_id,h.score,h.created_at,h.serial,h.grade,h.id,h.session_id,s.title,p.photo from P06.entrance h left join P06.step_profile i on h.serial = i.serial left join P06.voucher v on v.serial = h.serial left join P06.session s on h.session_id = s.session_id left join P06.applicant p on p.serial = h.serial where h.serial =" +
        serial
    );
    return res;
  },

  // STUDENTS - AIS MODELS

  fetchStudents: async (page, keyword) => {
    var sql = "select * from ais.fetchstudents";
    var cql = "select count(*) as total from ais.fetchstudents";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` where fname like '%${keyword}%' or lname like '%${keyword}%' or refno = '${keyword}' or indexno = '${keyword}'`;
      cql += ` where fname like '%${keyword}%' or lname like '%${keyword}%' or refno = '${keyword}' or indexno = '${keyword}'`;
    }

    sql += ` order by complete_status asc,prog_id asc,lname asc, fname asc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);
    console.log(sql);
    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchAISStudentReport: async ({
    prog_id,
    major_id,
    year_group,
    session,
    gender,
    entry_group,
    defer_status,
    type,
    asession,
  }) => {
    var sql = "select * from ais.fetchstudents where complete_status = 0";
    var res;
    if (prog_id) sql += ` and prog_id = ${prog_id}`;
    if (major_id) sql += ` and major_id = ${major_id}`;
    if (year_group) sql += ` and ceil(semester/2) = ${year_group}`;
    if (session) sql += ` and session = '${session}'`;
    if (gender) sql += ` and gender = '${major_id}'`;
    if (entry_group) sql += ` and entry_group = '${entry_group}'`;
    if (defer_status) sql += ` and defer_status = ${defer_status}`;
    if (asession) sql += ` and date_format(doa,'%m%y') = '${asession}'`;

    sql += ` order by prog_id,semester,major_id,session,lname asc`;
    res = await db.query(sql);
    if (res && res.length > 0) return res;
    return res;
  },

  insertAISStudent: async (data) => {
    const res = await db.query("insert into ais.student set ?", data);
    return res;
  },

  updateAISStudent: async (id, data) => {
    const res = await db.query(
      "update ais.student set ? where id = " + id,
      data
    );
    return res;
  },

  deleteAISStudent: async (id) => {
    const res = await db.query("delete from ais.student where id = " + id);
    return res;
  },

  // REGISTRATIONS - AIS

  fetchRegsData: async (streams, page, keyword) => {
    var sql =
      "select * from ais.fetchregs where find_in_set(session_id,'" +
      streams +
      "') > 0";
    var cql =
      "select count(*) as total from ais.fetchregs where find_in_set(session_id,'" +
      streams +
      "') > 0";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` and (fname like '%${keyword}%' or lname like '%${keyword}%' or refno = '${keyword}' or indexno = '${keyword}')`;
      cql += ` and (fname like '%${keyword}%' or lname like '%${keyword}%' or refno = '${keyword}' or indexno = '${keyword}')`;
    }

    sql += ` order by created_at desc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchRegsList: async (session_id, query) => {
    const { level, prog_id, major_id } = query;
    console.log(query);
    var sql;
    if (major_id && prog_id && level) {
      sql =
        "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = " +
        session_id +
        " and (ceil(s.semester/2)*100) = " +
        level +
        " and s.prog_id =" +
        prog_id +
        " and s.major_id =" +
        major_id;
    } else if (prog_id && level && !major_id) {
      sql =
        "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = " +
        session_id +
        " and (ceil(s.semester/2)*100) = " +
        level +
        " and s.prog_id =" +
        prog_id;
    } else if (major_id && level && !prog_id) {
      sql =
        "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = " +
        session_id +
        " and (ceil(s.semester/2)*100) = " +
        level +
        " and s.major_id =" +
        major_id;
    } else if (!major_id && level && !prog_id) {
      sql =
        "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = " +
        session_id +
        " and (ceil(s.semester/2)*100) = " +
        level;
    } else if (!major_id && !level && prog_id) {
      sql =
        "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = " +
        session_id +
        " and s.prog_id =" +
        prog_id;
    } else if (major_id && !level && !prog_id) {
      sql =
        "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = " +
        session_id +
        " and s.major_id =" +
        major_id;
    } else {
      sql =
        "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = " +
        session_id;
    }
    var data = [];
    const res = await db.query(sql);
    if (res && res.length > 0) {
      for (var r of res) {
        const resm = await db.query(
          "select r.*,s.fname,s.mname,s.lname,s.refno, ceil(s.semester/2)*100 as level,x.title as session_name,p.`short` as program_name, m.title as major_name from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id left join utility.session x on x.id = r.session_id where r.indexno = '" +
            r.indexno +
            "' and r.session_id = " +
            session_id +
            " order by r.id desc limit 1"
        );
        if (resm && resm.length > 0) data.push(resm[0]);
      }
    }
    return data;
  },

  fetchMountList: async (session_no) => {
    var data = [];
    var sql =
      "select distinct x.prog_id,x.major_id,x.semester,p.`short` as program_name,m.title as major_name,t.info from utility.`structure` x left join utility.program p on p.id = x.prog_id left join ais.major m on m.id = x.major_id left join utility.structmeta t on (t.prog_id=x.prog_id and x.semester = t.semester) ";
    sql +=
      session_no == 1
        ? "where mod(ceil(x.semester),2) = 1 "
        : "where mod(ceil(x.semester),2) = 0 ";
    sql += "order by x.prog_id,x.semester,x.major_id";
    const res = await db.query(sql);
    if (res && res.length > 0) {
      for (var r of res) {
        var dt = {
          program_name: r.program_name,
          major_name: r.major_name,
          semester: r.semester,
        };
        const info = JSON.parse(r.info);
        if (info && info.length > 0) {
          for (var f of info) {
            if (f.major_id == r.major_id) {
              dt = f.major_id
                ? {
                    ...dt,
                    max_credit: f.max_credit,
                    min_credit: f.min_credit,
                    max_elective: f.max_elective,
                  }
                : { ...dt, max_credit: f.max_credit, min_credit: f.min_credit };
            }
          }
        }
        const resm = await db.query(
          "select r.*,c.course_code,c.title as course_title,c.credit from utility.structure r left join utility.course c on c.id = r.course_id where r.prog_id = " +
            r.prog_id +
            " and r.semester = " +
            r.semester +
            " and (r.`type` = 'C' or (r.`type` = 'E' and r.major_id is null) or r.major_id = " +
            r.major_id +
            ") order by r.type"
        );
        if (resm && resm.length > 0) dt.data = resm;
        data.push(dt);
      }
    }
    return data;
  },

  processBacklog: async (data) => {
    const { session_id, semester, prog_id, year_group, type } = data;
    // Fetch student for filters

    // Determine Streams for Year 1 - Using doa and choose session_id for stream
    // Send Back Report of unqualified Year 1 - for selected streams
    const sx = await db.query(
      `select * from utility.session where session_id = ${session_id}`
    );
    const sts = await db.query(
      `select *,date_format(doa,"%m") as mon from ais.fetchstudents where prog_id = ${prog_id} and ceil(semester/2) = ${year_group} and indexno <> 'UNIQUE' and complete_status = 0 and defer_status = 0`
    );
    const sall = await Promise.all(
      sts?.map(async (st) => {
        // If semester in [1,2] and mon == '01' && session.stream == ' -- Get January streams session
        // Use Main streams session
        const sm = await db.query(
          `select * from ais.assessment where session_id = ${session_id} and indexno = '${st.indexno}'`
        );

        if (sm && sm.length <= 0) {
          /* FETCH MOUNTED COURSES */

          const { major_id, indexno, scheme_id } = st;
          var courses = [];
          const ce = await Student.fetchStudentCE(prog_id, semester); // Get Core & General Electives
          const me = await Student.fetchStudentME(major_id, prog_id, semester); // Get Majoring Electives
          //const rt = await Student.fetchStudentRT(indexno); // Get Trailed Courses
          if (ce.length > 0) {
            for (var row of ce) {
              courses.push(row.course_id);
              courses.push({
                course_id: row.course_id,
                credit: row.credit,
                semester,
                indexno,
                class_score: 0,
                exam_score: 0,
                total_score: 0,
                score_type: "N",
                session_id,
                scheme_id,
                flag_visible: 0,
              });
            }
          }
          if (me.length > 0) {
            for (var row of me) {
              courses.push(row.course_id);
              courses.push({
                course_id: row.course_id,
                credit: row.credit,
                semester,
                indexno,
                class_score: 0,
                exam_score: 0,
                total_score: 0,
                score_type: "N",
                session_id,
                scheme_id,
                flag_visible: 0,
              });
            }
          }
          /* REGISTER MOUNTED COURSES */
          if (courses.length > 0) {
            const rem = await Student.removeRegData(indexno, session_id);
            if (rem) {
              for (var row of courses) {
                resp = await Student.insertRegData(row);
              }
            }
          }
        }
      })
    );
    return sall;
  },


  processBackview: async (data) => {
    const { session_id, prog_id, year_group, course_id } = data;
    var mdata = {}, student = {}
    const js = await db.query(
     // `select upper(concat(i.title,' - ',if(i.tag = 'MAIN','MAIN STREAM','JAN STREAM'))) as session_name,s.name,s.refno,x.indexno,x.class_score,x.exam_score,x.total_score,(ceil(x.semester/2)*100) as level,c.course_code,c.title as course_name,c.credit,m.grade_meta from ais.assessment x left join ais.fetchstudents s on s.indexno = x.indexno left join utility.course c on c.id = x.course_id left join utility.scheme m on x.scheme_id = m.id left join utility.session i on i.id = x.session_id  where session_id = ${session_id} and s.prog_id = ${prog_id} and ceil(x.semester/2) = ${year_group}`
      `select * from ais.fetchbackviews where session_id = ${session_id} and prog_id = ${prog_id} and ceil(semester/2) = ${year_group}`
    );
    
    if (js && js.length > 0) {
      for(const sv of js){
        const zd = { ...sv, grade: await getGrade(sv.total_score, JSON.parse(sv.grade_meta)) }
        // Data By Courses
        if(mdata[sv.course_code]){
          mdata[sv.course_code] = [...mdata[sv.course_code],{...zd}]
        }else{
          mdata[sv.course_code] = [{...zd}]
        }

        // Data By Students
        if(!student[sv.indexno]){
          student[sv.indexno] = { name: sv.name, indexno: sv.indexno, refno: sv.refno, count: 1 }
        } else {
          student[sv.indexno] = { ...student[sv.indexno], count: student[sv.indexno].count+1 }
        }
      }
    }

    return { course_data: mdata, student_data: student, courses: Object.keys(mdata) }
  },
  

  processSingleBacklog: async (data) => {
    const { session_id, year, indexno } = data;
    const getSemester = (sem_no, year) => {
      var sm;
      if (sem_no == 1) {
        switch (parseInt(year)) {
          case 1:
            sm = 1;
            break;
          case 2:
            sm = 3;
            break;
          case 3:
            sm = 5;
            break;
          case 4:
            sm = 7;
            break;
        }
      } else {
        switch (parseInt(year)) {
          case 1:
            sm = 2;
            break;
          case 2:
            sm = 4;
            break;
          case 3:
            sm = 6;
            break;
          case 4:
            sm = 8;
            break;
        }
      }
      return sm;
    };
    var semester;
    const sx = await db.query(
      `select * from utility.session where id = ${session_id}`
    );
    if (sx && sx.length > 0) {
      semester = getSemester(sx[0].academic_sem, year);
    }
    const st = await db.query(
      `select *,date_format(doa,"%m") as mon from ais.fetchstudents where indexno  = '${indexno}'`
    );
    const sm = await db.query(
      `select * from ais.assessment where session_id = ${session_id} and indexno = '${indexno}'`
    );

    //console.log("Sess",semester, sx)
    if (sm && sm.length == 0) {
      /* FETCH MOUNTED COURSES */
      const { major_id, prog_id, scheme_id } = st[0];
      var courses = [];
      const ce = await Student.fetchStudentCE(prog_id, semester); // Get Core & General Electives
      const me = await Student.fetchStudentME(major_id, prog_id, semester); // Get Majoring Electives
      //const rt = await Student.fetchStudentRT(indexno); // Get Trailed Courses
      if (ce.length > 0) {
        for (var row of ce) {
          courses.push({
            course_id: row.course_id,
            credit: row.credit,
            semester,
            indexno,
            class_score: 0,
            exam_score: 0,
            total_score: 0,
            score_type: "N",
            session_id,
            scheme_id,
            flag_visible: 0,
          });
        }
      }
      if (me.length > 0) {
        for (var row of me) {
          courses.push({
            course_id: row.course_id,
            credit: row.credit,
            semester,
            indexno,
            class_score: 0,
            exam_score: 0,
            total_score: 0,
            score_type: "N",
            session_id,
            scheme_id,
            flag_visible: 0,
          });
        }
      }
      /* REGISTER MOUNTED COURSES */
      if (courses.length > 0) {
        console.log("courses",courses)
        const rem = await Student.removeRegData(indexno, session_id);
        if (rem) {
          for (var row of courses) {
            resp = await Student.insertRegData(row);
          }
        }
      }
      return courses;
    }
    return null
  },

  // TRANSCRIPT/TRANSWIFT - AIS MODELS
  fetchTranscript: async (indexno) => {
    var mdata = {}
    const js = await db.query(
     `select * from ais.fetchbackviews where indexno = '${indexno}' order by session_id`
    );
    
    if (js && js.length > 0) {
      for(const sv of js){
        const zd = { ...sv, grade: await getGrade(sv.total_score, JSON.parse(sv.grade_meta)) }
        // Data By Courses
        if(mdata[sv.session_title]){
          mdata[sv.session_title] = [...mdata[sv.session_title],{...zd}]
        }else{
          mdata[sv.session_title] = [{...zd}]
        }
      }
    }
    return { data: mdata }
  },

  // SCORESHEETS - AIS MODELS

  fetchScoresheets: async (streams, unit_id, page, keyword) => {
    var sql =
      "select * from ais.fetchsheets where find_in_set(session_id,'" +
      streams +
      "') > 0 ";
    var cql =
      "select count(*) as total from ais.fetchsheets where find_in_set(session_id,'" +
      streams +
      "') > 0 ";

    var units = unit_id;
    if (unit_id) {
      var unit = await db.query(
        "select * from utility.unit where id = " + unit_id
      );
      if (unit && unit.length > 0) {
        if (unit[0].level == 2) {
          const um = await db.query(
            "select * from utility.unit where lev2_id = " + unit_id
          );
          if (um && um.length > 0) units = um.map((m) => m.id).join(",");
        }
      }
    }

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` and lower(course_name) like '%${keyword.toLowerCase()}%' or course_code like '%${keyword}%' or lower(program_name) like '%${keyword.toLowerCase()}%' or lower(unit_name) like '%${keyword.toLowerCase()}%' `;
      cql += ` and lower(course_name) like '%${keyword.toLowerCase()}%' or course_code like '%${keyword}%' or lower(program_name) like '%${keyword.toLowerCase()}%' or lower(unit_name) like '%${keyword.toLowerCase()}%' `;
    }

    if (units) {
      sql += ` and find_in_set(unit_id,'${units}') > 0 `;
      cql += ` and find_in_set(unit_id,'${units}') > 0 `;
    }

    sql += ` order by session_id desc,prog_id,semester,major_id`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    // Update Registered Students & Assessment Completion Percentage
    if (res && res.length > 0) {
      res.forEach(async (row) => {
        //let asl = `select x.* from ais.assessment x left join ais.student s on s.indexno = x.indexno left join utility.program p on s.prog_id = p.id where s.session = '${row.session}' and x.course_id = ${row.course_id} and x.session_id = ${row.session_id} and (find_in_set(p.unit_id,'${units}') > 0 or p.unit_id is null)`
        let asl = `select x.* from ais.assessment x left join ais.student s on s.indexno = x.indexno left join utility.program p on s.prog_id = p.id where s.session = '${row.session}' and s.semester = ${row.semester} and x.course_id = ${row.course_id} and x.session_id = ${row.session_id} and s.prog_id = ${row.prog_id}`;
        const ares = await db.query(asl);
        const num = ares.length;
        var ratio = 0;
        if (num > 0) {
          var sum = 0;
          for (let s of ares) {
            if (s.total_score && parseInt(s.total_score > 0)) sum += 1;
          }
          ratio = ((sum / num) * 100).toFixed(2);
        }

        const data = { regcount: num, complete_ratio: ratio };
        console.log(data, asl);

        await db.query("update ais.sheet set ? where id = " + row.id, data);
      });
    }

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchMyScoresheets: async (sno, streams, page, keyword) => {
    var sql =
      "select * from ais.fetchsheets where find_in_set('" +
      sno +
      "',tag) > 0 and find_in_set(session_id,'" +
      streams +
      "') > 0";
    var cql =
      "select count(*) as total from ais.fetchsheets where find_in_set('" +
      sno +
      "',tag) > 0 and find_in_set(session_id,'" +
      streams +
      "') > 0";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` and lower(course_name) like '%${keyword.toLowerCase()}%' or course_code like '%${keyword}%' or lower(program_name) like '%${keyword.toLowerCase()}%' or lower(unit_name) like '%${keyword.toLowerCase()}%' `;
      cql += ` and lower(course_name) like '%${keyword.toLowerCase()}%' or course_code like '%${keyword}%' or lower(program_name) like '%${keyword.toLowerCase()}%' or lower(unit_name) like '%${keyword.toLowerCase()}%' `;
    }

    sql += ` order by session_id desc,prog_id,semester,major_id`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    // Update Registered Students & Assessment Completion Percentage
    if (res && res.length > 0) {
      res.forEach(async (row) => {
        //let asl = `select x.* from ais.assessment x left join ais.student s on s.indexno = x.indexno left join utility.program p on s.prog_id = p.id where s.session = '${row.session}' and x.course_id = ${row.course_id} and x.session_id = ${row.session_id} and (find_in_set(p.unit_id,'${units}') > 0 or p.unit_id is null)`
        let asl = `select x.* from ais.assessment x left join ais.student s on s.indexno = x.indexno left join utility.program p on s.prog_id = p.id where s.session = '${row.session}' and s.semester = ${row.semester} and x.course_id = ${row.course_id} and x.session_id = ${row.session_id} and s.prog_id = ${row.prog_id}`;
        const ares = await db.query(asl);
        const num = ares.length;
        var ratio = 0;
        if (num > 0) {
          var sum = 0;
          for (let s of ares) {
            if (s.total_score && s.total_score > 0) sum += 1;
          }
          ratio = (sum / num) * 100;
        }

        const data = { regcount: num, complete_ratio: ratio };
        await db.query("update ais.sheet set ? where id = " + row.id, data);
      });
    }

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  insertAISSheet: async (data) => {
    const res = await db.query("insert into ais.sheet set ?", data);
    return res;
  },

  updateAISSheet: async (id, data) => {
    const res = await db.query("update ais.sheet set ? where id = " + id, data);
    return res;
  },

  deleteAISSheet: async (id) => {
    const res = await db.query("delete from ais.sheet where id = " + id);
    return res;
  },

  loadSheet: async (id) => {
    var data = [];
    const res = await db.query("select * from ais.sheet where id = " + id);
    if (res && res.length > 0) {
      const vs = res[0];
      let sql = `select x.*,s.refno,concat(s.lname,', ',s.fname,ifnull(concat(' ',s.mname),'')) as name,c.grade_meta from ais.assessment x left join ais.student s on x.indexno = s.indexno left join utility.scheme c on c.id = x.scheme_id where x.session_id=${vs.session_id} and x.course_id=${vs.course_id} and s.prog_id = ${vs.prog_id} and x.semester = ${vs.semester} and s.session = '${vs.session}' order by s.lname`;
      const rs = await db.query(sql);
      if (rs && rs.length > 0) {
        for (var r of rs) {
          const c_name = `${r.session_id}_${r.course_id}_${r.indexno}_c`;
          const c_value = r.class_score;
          const e_name = `${r.session_id}_${r.course_id}_${r.indexno}_e`;
          const e_value = r.exam_score;
          let dt = {
            name: r.name,
            indexno: r.indexno,
            refno: r.refno,
            class: { name: c_name, value: c_value },
            exam: { name: e_name, value: e_value },
            scheme: r.grade_meta,
          };
          data.push(dt);
        }
      }
    }
    return data;
  },

  saveSheet: async (data) => {
    var count = 0;
    var sid = 0;
    const keys = Object.keys(data);
    if (keys.length > 0) {
      for (var key of keys) {
        const keyinfo = key.split("_");
        if (keyinfo.length > 0) {
          sid = keyinfo[0];
          const session_id = keyinfo[0];
          const course_id = keyinfo[1];
          const indexno = keyinfo[2];
          const type = keyinfo[3];
          const value = data[key];
          // Update Database with Record
          const dt =
            type == "c" ? { class_score: value } : { exam_score: value };
          const ups = await db.query(
            "update ais.assessment set ? where session_id = " +
              session_id +
              " and course_id = " +
              course_id +
              " and indexno = '" +
              indexno +
              "'",
            dt
          );
          if (ups && ups.affectedRows > 0) count += 1;
        }
      }
    }
    if (count > 0) await SR.retireAssessmentTotal(sid); // Return Assessment for Session
    return count;
  },

  retireAssessmentTotal: async (session_id) => {
    const res = await db.query(
      "update ais.assessment set total_score = (class_score+exam_score) where (class_score is not null and exam_score is not null) and session_id = " +
        session_id
    );
    return res;
  },

  publishSheet: async (id, sno) => {
    const res = await db.query(
      "update ais.sheet set flag_assessed = 1, assessed_by = '" +
        sno +
        "' where id = " +
        id
    );
    if (res && res.affectedRows > 0) return true;
    return false;
  },

  certifySheet: async (id, sno) => {
    const res = await db.query(
      "update ais.sheet set flag_certified = 1,certified_by = '" +
        sno +
        "' where id = " +
        id
    );
    var count = 0;
    if (res && res.affectedRows > 0) {
      const resx = await db.query("select * from ais.sheet where id = " + id);
      if (resx && resx.length > 0) {
        const vs = resx[0];
        let sql = `select x.*,grade_meta,resit_score from ais.assessment x left join ais.student s on x.indexno = s.indexno left join utility.scheme m on x.scheme_id = m.id where x.session_id=${vs.session_id} and x.course_id=${vs.course_id} and s.prog_id = ${vs.prog_id} and x.semester = ${vs.semester} and s.session = '${vs.session}' order by s.lname`;
        const rs = await db.query(sql);
        if (rs && rs.length > 0) {
          for (var r of rs) {
            // Update Visibility Status of Assessments
            const ups = await db.query(
              "update ais.assessment set flag_visible = 1 where session_id = " +
                r.session_id +
                " and course_id = " +
                r.course_id +
                " and indexno = '" +
                r.indexno +
                "'"
            ); 

            if (ups && ups.affectedRows > 0){
              count += 1;
              // Trailed logics
              const trailed = isTrailed(r.total_score,r.resit_score)
              if(trailed){
                // Record Trailed Papers into Resit Table
                const insGet = await db.query(
                  "select * from ais.resit_data where session_id = " +
                    r.session_id +
                    " and course_id = " +
                    r.course_id +
                    " and indexno = '" +
                    r.indexno +
                    "'"
                );
                if(insGet && insGet.length <= 0){
                  const dt = { session_id:vs.session_id, course_id:vs.course_id, indexno: r.indexno, semester:r.semester, scheme_id:r.scheme_id }
                  const insRep = await db.query(
                    "insert into ais.resit_data set ? ", 
                    dt
                  );
                }
              }
            } 
          }
        }
      }
    }
    return count;
  },

  uncertifySheet: async (id) => {
    const res = await db.query(
      "update ais.sheet set flag_certified = 0 where id = " + id
    );
    var count = 0;
    if (res && res.affectedRows > 0) {
      const resx = await db.query("select * from ais.sheet where id = " + id);
      if (resx && resx.length > 0) {
        const vs = resx[0];
        let sql = `select x.* from ais.assessment x left join ais.student s on x.indexno = s.indexno where x.session_id=${vs.session_id} and x.course_id=${vs.course_id} and s.prog_id = ${vs.prog_id} and x.semester = ${vs.semester} and s.session = '${vs.session}' order by s.lname`;
        const rs = await db.query(sql);
        if (rs && rs.length > 0) {
          for (var r of rs) {
            const ups = await db.query(
              "update ais.assessment set flag_visible = 0 where session_id = " +
                r.session_id +
                " and course_id = " +
                r.course_id +
                " and indexno = '" +
                r.indexno +
                "'"
            );
            if (ups && ups.affectedRows > 0){
              count += 1;
              // Remove Trailed Papers inside Resit Table
              const insGet = await db.query(
                "delete from ais.resit_data where session_id = " +
                  r.session_id +
                  " and course_id = " +
                  r.course_id +
                  " and indexno = '" +
                  r.indexno +
                  "'"
              );
            } 
          }
        }
      }
    }
    return count;
  },

  assignSheet: async (id, sno) => {
    var count = 0;
    const res = await db.query("select * from ais.sheet where id = " + id);
    const sm = await db.query(
      "select s.* from hrs.staff s left join utility.unit u on s.unit_id where s.staff_no = " +
        sno
    );
    if (
      res &&
      sm &&
      res.length > 0 &&
      sm.length > 0 /* && sm[0].unit_id == res[0].unit_id*/
    ) {
      const vs = res[0];
      var tags = vs["tag"] ? vs["tag"].split(",") : [];
      const isExist = tags.find((r) => r == sno);
      if (!isExist) {
        tags.push(sno);
        // Add Staff and Update
        const ups = await db.query(
          "update ais.sheet set tag = '" + tags.join(",") + "' where id = " + id
        );
        if (ups && ups.affectedRows > 0) count += 1;
      }
    }
    return { count, phone: sm && sm[0].phone };
  },

  unassignSheet: async (id, sno) => {
    var count = 0;
    const res = await db.query("select * from ais.sheet where id = " + id);
    const sm = await db.query(
      "select s.* from hrs.staff s left join utility.unit u on s.unit_id where s.staff_no = " +
        sno
    );
    if (
      res &&
      sm &&
      res.length > 0 &&
      sm.length > 0 /* && sm[0].unit_id == res[0].unit_id*/
    ) {
      const vs = res[0];
      var tags = vs["tag"] ? vs["tag"].split(",") : [];
      const isExist = tags.find((r) => r == sno);
      if (isExist) {
        tags = tags.filter((r) => r != sno);
        // Add Staff and Update
        const ups = await db.query(
          "update ais.sheet set tag = '" + tags.join(",") + "' where id = " + id
        );
        if (ups && ups.affectedRows > 0) count += 1;
      }
    }
    return { count, phone: sm && sm[0].phone };
  },

  loadCourseList: async (id) => {
    var data = [];
    const res = await db.query("select * from ais.sheet where id = " + id);
    if (res && res.length > 0) {
      const vs = res[0];
      let sql = `select x.indexno,s.refno,concat(s.lname,', ',s.fname,ifnull(concat(' ',s.mname),'')) as name, if(x.course_id is null, 'Not Registered','Registered') as regstatus,if(x.created_at is null, 'No Date',date_format(x.created_at,'%M %d, %Y')) as regdate from ais.student s left join ais.assessment x on s.indexno = x.indexno where x.session_id = ${vs.session_id} and x.course_id = ${vs.course_id} and s.prog_id = ${vs.prog_id} and s.semester = ${vs.semester} and s.session = '${vs.session}' order by s.lname asc`;
      const rs = await db.query(sql);
      if (rs && rs.length > 0) {
        data = rs;
      }
    }
    console.log(data);
    return data;
  },

  // CURRICULUM -AIS

  fetchStruct: async (sem, unit_id, page, keyword) => {
    var sql =
      "select s.*,p.short as program_name,m.title as major_name,upper(c.title) as course_name,c.course_code,c.credit,t.title as unit_name from utility.structure s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.course c on s.course_id = c.id left join utility.unit t on t.id = s.unit_id where mod(s.semester,2) = " +
      (sem == 2 ? 0 : 1);
    var cql =
      "select count(*) as total from utility.structure s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.course c on s.course_id = c.id left join utility.unit t on t.id = s.unit_id where mod(s.semester,2) = " +
      (sem == 2 ? 0 : 1);

    var units = unit_id;
    if (unit_id) {
      var unit = await db.query(
        "select * from utility.unit where id = " + unit_id
      );
      if (unit && unit.length > 0) {
        if (unit[0].level == 2) {
          const um = await db.query(
            "select * from utility.unit where lev2_id = " + unit_id
          );
          if (um && um.length > 0) units = um.map((m) => m.id).join(",");
        }
      }
    }
    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (units) {
      sql += ` and find_in_set(s.unit_id,'${units}') > 0 `;
      cql += ` and find_in_set(s.unit_id,'${units}') > 0 `;
    }

    if (keyword) {
      sql += ` and (c.title like '%${keyword.toLowerCase()}%' or c.course_code like '%${keyword}%' or p.short like '%${keyword}%' or t.title like '%${keyword}%') `;
      cql += ` and (c.title like '%${keyword.toLowerCase()}%' or c.course_code like '%${keyword}%' or p.short like '%${keyword}%' or t.title like '%${keyword}%')  `;
    }

    sql += ` order by s.prog_id,s.semester,s.type`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;
    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  insertAISMeta: async (data) => {
    const res = await db.query("insert into utility.structure set ?", data);
    return res;
  },

  updateAISMeta: async (id, data) => {
    const res = await db.query(
      "update utility.structure set ? where id = " + id,
      data
    );
    return res;
  },

  deleteAISMeta: async (id) => {
    const res = await db.query(
      "delete from utility.structure where id = " + id
    );
    return res;
  },

  // CALENDAR -AIS

  fetchCalendar: async (page, keyword) => {
    var sql = "select s.* from utility.session s";
    var cql = "select count(*) as total from utility.session s";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` where s.title like '%${keyword.toLowerCase()}%' or s.tag like '%${keyword}%' or s.academic_sem = '%${
        keyword == "first" ? 1 : null
      }%' or s.academic_sem = '%${keyword == "second" ? 1 : null}%' `;
      cql += ` where s.title like '%${keyword.toLowerCase()}%' or s.tag like '%${keyword}%' or s.academic_sem = '%${
        keyword == "first" ? 1 : null
      }%' or s.academic_sem = '%${keyword == "second" ? 1 : null}%' `;
    }

    sql += ` order by s.id desc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  insertAISCalendar: async (data) => {
    const res = await db.query("insert into utility.session set ?", data);
    return res;
  },

  updateAISCalendar: async (id, data) => {
    const res = await db.query(
      "update utility.session set ? where id = " + id,
      data
    );
    return res;
  },

  deleteAISCalendar: async (id) => {
    const res = await db.query("delete from utility.session where id = " + id);
    return res;
  },

  activateAISCalendar: async (id) => {
    const cs = await db.query("select * from utility.session where id = " + id);
    const vs = await db.query(
      "update utility.session set `default` = 0 where tag = '" + cs[0].tag + "'"
    );
    const res = await db.query(
      "update utility.session set `default` = 1 where id = " + id
    );
    return res;
  },

  getResitSessions: async () => {
    const ids = [];
    let res;
    const sess = await db.query("select distinct(session_id) as id from ais.fetchresits order by session_id desc");
    if(sess && sess.length > 0){
      for(var s of sess){
        ids.push(s.id)
      }
      res = await db.query("select * from utility.session where id in ("+ids.join(',')+")");
    }
    return res;
  },

  getActiveResitSession: async () => {
    const ids = [];
    let res;
    const sess = await db.query("select distinct(session_id) as id from ais.fetchresits order by session_id desc limit 1");
    if(sess && sess.length > 0){
      for(var s of sess){
        ids.push(s.id)
      }
      res = await db.query("select * from utility.session where id in ("+ids.join(',')+")");
    }
    return res && res[0];
  },

  getActiveSessionByMode: async (mode_id) => {
    const res = await db.query(
      "select * from utility.session where tag = 'MAIN' and `default` = 1 and mode_id = " +
        mode_id
    );
    return res && res[0];
  },

  getActiveSessionById: async (id) => {
    const res = await db.query(
      "select * from utility.session where id = " + id
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
      "select s.*,date_format(s.doa,'%m') as admission_code,s.semester,s.entry_semester,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id where u.uid = " +
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
    return [{ ...st[0], ...session }];
  },

  // STREAMS - AIS
  fetchStreams: async (data) => {
    const res = await db.query(
      "select * from utility.session where `default` = 1"
    );
    return res;
  },

  fetchSheetStreams: async (data) => {
    const res = await db.query(
      "select * from utility.session where `default` = 1 or cal_allow_sheets = 1"
    );
    return res;
  },

  // ENABLED SCORESHEET SESSIONS - AIS
  fetchEntriesSessions: async () => {
    const res = await db.query(
      "select * from utility.session where cal_allow_sheets = 1"
    );
    return res;
  },

  // INFORMER - AIS
  fetchInformer: async (page, keyword) => {
    var sql = "select s.* from ais.informer s";
    var cql = "select count(*) as total from ais.informer s";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` where s.tag like '%${keyword.toLowerCase()}%' or s.title like '%${keyword}%' or s.message = '%${keyword}%' `;
      cql += ` where s.tag like '%${keyword.toLowerCase()}%' or s.title like '%${keyword}%' or s.message = '%${keyword}%' `;
    }

    sql += ` order by s.id desc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  insertAISInformer: async (data) => {
    const res = await db.query("insert into ais.informer set ?", data);
    return res;
  },

  updateAISInformer: async (id, data) => {
    const res = await db.query(
      "update ais.informer set ? where id = " + id,
      data
    );
    return res;
  },

  deleteAISInformer: async (id) => {
    const res = await db.query("delete from ais.informer where id = " + id);
    return res;
  },

  fetchInformerData: async () => {
    const res = await db.query(
      "select * from ais.informer where status = 1 and send_status = 0"
    );
    return res;
  },

  msgStudentData: async () => {
    const res = await db.query(
      "select s.refno as tag, s.phone, s.lname,s.fname from ais.student s where s.complete_status = 0 and s.phone is not null"
    );
    return res;
  },

  msgStaffData: async () => {
    //const res = await db.query("select s.staff_no as tag, s.phone, s.lname,s.fname from hrs.staff s where s.phone is not null");
    const res = await db.query(
      "select s.staff_no as tag, s.phone, s.lname,s.fname from hrs.staff s where s.phone is not null and s.staff_no = 15666"
    );
    return res;
  },

  msgFresherData: async () => {
    const res = await db.query(
      "select s.refno as tag, s.phone, s.lname,s.fname from ais.student s where s.complete_status = 0 and (s.semester = 1 or s.semester = 2) and s.phone is not null"
    );
    return res;
  },

  msgApplicantData: async () => {
    const res = await db.query(
      "select s.serial as tag, s.applicant_phone as phone, s.applicant_name as lname,s.applicant_name as fname from P06.voucher s left join P06.session x on x.session_id = s.session_id where x.status = 1 and s.applicant_phone is not null"
    );
    return res;
  },

  msgDeanData: async () => {
    const res = await db.query(
      "select s.staff_no as tag, s.phone, s.lname,s.fname from hrs.staff s left join hrs.job j on s.job_id = j.id where (s.position like '%dean%' or j.title like '%dean%') and s.phone is not null"
    );
    return res;
  },

  msgHeadData: async () => {
    const res = await db.query(
      "select s.staff_no as tag, s.phone, s.lname,s.fname from hrs.staff s left join hrs.job j on s.job_id = j.id where (s.position like '%head%' or j.title like '%head%') and s.phone is not null"
    );
    return res;
  },

  msgAssessorData: async () => {
    const res = await db.query(
      "select s.staff_no as tag, s.phone, s.lname,s.fname from hrs.staff s left join hrs.job j on s.job_id = j.id where (s.position like '%lecturer%' or j.title like '%lecturer%') and s.phone is not null"
    );
    return res;
  },

  msgUndergradData: async () => {
    const res = await db.query(
      "select s.refno as tag, s.phone, s.lname,s.fname from ais.student s left join utility.program p on s.prog_id = p.id where (p.group_id = 'UG' or p.group_id = 'DP') and s.complete_status = 0 and s.phone is not null"
    );
    return res;
  },

  msgPostgradData: async () => {
    const res = await db.query(
      "select s.refno as tag, s.phone, s.lname,s.fname from ais.student s left join utility.program p on s.prog_id = p.id where p.group_id = 'PG' and s.complete_status = 0 and s.phone is not null"
    );
    return res;
  },

  insertInformerLog: async (data) => {
    const res = await db.query("insert into ais.informer_log set ?", data);
    return res;
  },

  updateInformerLog: async (id, data) => {
    const res = await db.query(
      "update ais.informer_log set ? where id = " + id,
      data
    );
    return res;
  },

  // PROGRAM CHANGE - AIS

  fetchProgchange: async (page, keyword) => {
    var sql =
      "select c.*,concat(s.lname,' ',ifnull(concat(s.mname,' '),''),s.fname) as name,cp.short as program_cname,cm.title as major_cname,np.short as program_nname from ais.change_prog c left join ais.student s on c.refno = s.refno left join utility.program cp on cp.id = c.current_prog_id left join ais.major cm on c.current_major_id = cm.id left join utility.program np on np.id = c.new_prog_id";
    var cql =
      "select count(*) as total from ais.change_prog c left join ais.student s on c.refno = s.refno left join utility.program cp on cp.id = c.current_prog_id left join ais.major cm on c.current_major_id = cm.id left join utility.program np on np.id = c.new_prog_id";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` where c.refno like '%${keyword.toLowerCase()}%' or c.current_indexno like '%${keyword}%' or c.new_indexno like '%${keyword}%' or cp.title like '%${keyword}%' `;
      cql += ` where c.refno like '%${keyword.toLowerCase()}%' or c.current_indexno like '%${keyword}%' or c.new_indexno like '%${keyword}%' or cp.title like '%${keyword}%' `;
    }

    sql += ` order by c.id desc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  insertAISProgchange: async (data) => {
    const res = await db.query("insert into ais.change_prog set ?", data);
    return res;
  },

  updateAISProgchange: async (id, data) => {
    const res = await db.query(
      "update ais.change_prog set ? where id = " + id,
      data
    );
    return res;
  },

  deleteAISProgchange: async (id) => {
    const res = await db.query("delete from ais.change_prog where id = " + id);
    return res;
  },

  approveAISProgchange: async (id, staff_no) => {
    const chg = await db.query(
      "select c.*,p.prefix,p.stype,date_format(s.doa,'%m%y') as code from ais.change_prog c left join ais.student s on s.refno = c.refno left join utility.program p on c.new_prog_id = p.id where c.id = " +
        id
    );
    if (chg && chg.length > 0) {
      if (!chg[0].code) return null;
      const refno = chg[0].refno;
      const prog_id = chg[0].new_prog_id;
      const prefix = `${chg[0].prefix.trim()}${chg[0].code}${chg[0].stype}`;
      var newIndex, no;
      const sm = await db.query(
        "select indexno,prog_count from ais.student where indexno like '" +
          prefix +
          "%' order by prog_count desc limit 1"
      );
      if (sm && sm.length > 0) {
        no = parseInt(sm[0].prog_count) + 1;
        var newNo;
        switch (no.toString().length) {
          case 1:
            newNo = `00${no}`;
            break;
          case 2:
            newNo = `0${no}`;
            break;
          case 3:
            newNo = `${no}`;
            break;
          default:
            newNo = `${no}`;
            break;
        }
        newIndex = `${prefix}${newNo}`;
      } else {
        no = 1;
        newIndex = `${prefix}00${no}`;
      }

      while (true) {
        const sf = await db.query(
          "select indexno from ais.student where indexno = '" + newIndex + "'"
        );
        if (sf && sf.length <= 0) break;
        no++;
      }
      var resp = await db.query(
        "update ais.student set ? where refno = '" + refno + "'",
        { indexno: newIndex, prog_count: no, prog_id, major_id: null }
      );
      var ups = await db.query(
        "update ais.change_prog set ? where id = " + id,
        {
          new_indexno: newIndex,
          new_semester: 1,
          approved_at: new Date(),
          approved_by: staff_no,
          approved_status: 1,
        }
      );
      if (resp && ups) return newIndex;
    }
    return null;
  },


   // RESITS - AIS MODELS

   fetchResits: async (streams, page, keyword) => {
    var sql =
      "select * from ais.fetchresits where find_in_set(session_id,'" +
      streams +
      "') > 0 ";
    var cql =
      "select count(*) as total from ais.fetchresits where find_in_set(session_id,'" +
      streams +
      "') > 0 ";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` and lower(course_name) like '%${keyword.toLowerCase()}%' or course_code like '%${keyword}%' or lower(program_name) like '%${keyword.toLowerCase()}%' or lower(name) like '%${keyword.toLowerCase()}%' or lower(indexno) like '%${keyword.toLowerCase()}%' `;
      cql += ` and lower(course_name) like '%${keyword.toLowerCase()}%' or course_code like '%${keyword}%' or lower(program_name) like '%${keyword.toLowerCase()}%' or lower(name) like '%${keyword.toLowerCase()}%' or lower(indexno) like '%${keyword.toLowerCase()}%' `;
    }
    sql += ` order by id desc,course_id,semester`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);
    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchResitInfo: async (id) => {
    const res = await db.query("select * from ais.fetchresits where id = " + id);
    return res && res[0];
  },

  fetchUnpaidResits: async (indexno,limit) => {
    const res = await db.query("select * from ais.fetchresits where paid = 0 and indexno = '"+indexno+"' limit " + limit);
    return res;
  },


  updateResitScore: async (id,data) => {
    const dt = { raw_score:data.raw_score, total_score:data.total_score }
    const rs = await db.query("update ais.resit_score set ? where id = "+id, dt);
    if (rs) return rs;
    return null;
  },

  updateResitData: async (id,data) => {
    const rs = await db.query("update ais.resit_score set ? where id = "+id, data);
    if (rs) return rs;
    return null;
  },

  saveResitBacklog: async (data) => {
    const { course_id,indexno,total_score,session_id:rid } = data
    // Get Previous Original score 
    const ss = await db.query("select x.*,p.semesters,u.academic_sem from ais.assessment x left join ais.student s on s.indexno = x.indexno left join utility.program p on s.prog_id = p.id left join utility.session u on x.session_id = u.id where x.course_id = "+course_id+" and x.indexno = '"+indexno+"'");
    console.log(ss)
    if(ss.length > 1) return 'dups'
    if(ss.length > 0){
      const sm = ss[0]
      const { scheme_id,credit,session_id,semester,academic_sem } = ss[0]
      const sx = await db.query("select * from utility.session where id > "+session_id+" and id <= "+rid+" and tag = 'MAIN' and academic_sem = "+academic_sem);
      console.log(sx)
      const num = sx && sx.length || 0;
      let dt;
      // Calculate Semester number from resit session_id
      if([sm.semesters,sm.semesters-1].includes(sm.semester)){
        // If Final Year -- replace assessment and Log orinal data
        const dm = { resit_id:null, assessment: JSON.stringify(ss[0]), created_at: Date.now()}
        await db.query("insert into ais.resit_replace set ?", dm);
        dt = { total_score, class_score:null, exam_score:null, score_type:'R', flag_visible: 1 }
        await db.query("update ais.assessment set ? where course_id = "+course_id+" and indexno = '"+indexno+"'", dt);
      }
      if(sm.semester < sm.semesters-1){
        // Check If Not Final Year -- Insert record into assessment table
        dt = { scheme_id,course_id,indexno,credit,session_id:rid,semester:semester+num,total_score,score_type:'R',flag_visible:1 }
        await db.query("insert into ais.assessment set ?", dt);
      }
      return dt
    }
    return null;
  },

  registerResit: async (id) => {
    // Get Resit info 
    // Get Current Registration Session - Compare with trailed session sem-num and run
    // Insert into resit_score
    let res;
    const rs = await db.query("select * from ais.resit_data r left join ais.fetchresits s on r.id = s.id where r.id = " + id);
    if (rs && rs.length > 0){
      const session_id = await SR.getActiveSessionByRefNo(rs[0].refno);
      if(session_id){
        const sess = await db.query("select * from utility.session where id = " + session_id);
        if(sess && sess.length > 0){
          if(sess[0].academic_sem == rs[0].session_sem){
            const dt = { reg_session_id: sess[0].id, resit_id: rs[0].id }
            res = await db.query("insert into ais.resit_score set ?", dt)
          }
        }
      }
    }
    return res;
  },

  approveResit: async (id) => {
    let res;
    const rs = await db.query("select s.*,r.course_id,indexno from ais.resit_score s left join ais.fetchresits r on s.resit_id = r.id where s.resit_id ="+id);
    if (rs && rs.length > 0){
      const { course_id,indexno,total_score } = rs[0]
      const as = await db.query("select * from ais.assessment where course_id = "+course_id+" and indexno = '"+indexno+"'");
      if (as && as.length > 0){
        // Insert into assessment tbl
        const { action_type,resit_id } = rs[0];
        const { session_id,scheme_id,semester,credit } = as[0]
        let dt;
        if( action_type == 'APPEND'){
          dt = { scheme_id,course_id,indexno,credit,session_id,semester,total_score,score_type:'R',flag_visible:1 }
          await db.query("insert into ais.assessment set ?", dt);
        }
        if( action_type == 'REPLACE'){
          const dm = { resit_id, assessment: JSON.stringify(as[0]), created_at: Date.now()}
          await db.query("insert into ais.resit_replace set ?", dm);
          dt = { total_score, class_score:null, exam_score:null, score_type:'R', flag_visible: 1 }
          await db.query("update ais.assessment set ? where course_id = "+course_id+" and indexno = '"+indexno+"'", dt);
        }
      }
      // Update approved in resit_score tbl to approved
      res = await db.query("update ais.resit_score set approved = 1 where resit_id = "+id)
      // Update take status in resit_data tbl to taken
      res = await db.query("update ais.resit_data set taken = 1 where id = "+id)
    }
    return res;
  },


  // TRANSACTION - FMS

  sendTransaction: async (data) => {
    const isRec = await db.query(
      "select * from fms.transaction where transtag = '" + data.transtag + "'"
    );
    if (isRec && isRec.length > 0) {
      return { insertId: isRec[0].id, ...isRec[0] };
    } else {
      const st = await db.query(
        "select refno from ais.student where (refno = '" +
          data.refno +
          "' or indexno = '" +
          data.refno +
          "')"
      );
      if (st && st.length > 0) data.refno = st[0].refno;
      const res = await db.query("insert into fms.transaction set ?", data);
      if (st && st.length > 0 && res.insertId > 0) {
        // Convert All indexno to refno in transaction tbl & studtrans tbl
        // Run Retirement Code
      }
      return res;
    }
  },

  // BILLS - FMS

  fetchBills: async (page, keyword) => {
    var sql =
      "select b.*,p.`short` as program_name,s.tag as session_tag from fms.billinfo b left join utility.program p on p.id = b.prog_id left join utility.session s on b.session_id = s.id";
    var cql = "select count(*) as total from fms.billinfo b";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` where b.narrative like '%${keyword}%' or s.title like '%${keyword}%' or b.tag like '%${keyword}%' or b.group_code = '${keyword}' or b.amount = '${keyword}'`;
      cql += ` where b.narrative like '%${keyword}%' or s.title like '%${keyword}%' or b.tag like '%${keyword}%' or b.group_code = '${keyword}' or b.amount = '${keyword}'`;
    }

    sql += ` order by b.bid desc,b.narrative asc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchCurrentBills: async () => {
    var res, sessions;
    const sid = await db.query(
      "select * from utility.session where `default` = 1"
    );
    if (sid && sid.length > 0) {
      for (var s of sid) {
        sessions = sessions ? (sessions += "," + s.id) : s.id;
      }
      const sql =
        "select b.*,p.`short` as program_name from fms.billinfo b left join utility.program p on p.id = b.prog_id where b.post_status = 1 and find_in_set(b.session_id,'" +
        sessions +
        "') > 0";
      console.log(sql);
      res = await db.query(sql);
    }
    return res;
  },

  fetchUnpublisedBills: async (id) => {
    const res = await db.query(
      "select * from fms.billinfo where post_status = 0"
    );
    return res;
  },

  fetchBill: async (id) => {
    const res = await db.query(
      "select b.*,p.`short` as program_name from fms.billinfo b left join utility.program p on p.id = b.prog_id where bid = " +
        id
    );
    return res;
  },

  fetchBillReceivers: async (id) => {
    const res = await db.query(
      "select b.*,p.`short` as program_name, ceil(s.semester/2) as year_group,concat(s.fname,' ',ifnull(concat(s.mname,' '),''),s.lname) as name,s.indexno from fms.studtrans b left join ais.student s on s.refno = b.refno left join utility.program p on s.prog_id = p.id where b.amount > 0 and b.bill_id = " +
        id
    );
    return res;
  },

  fetchItemsByBid: async (id) => {
    const res = await db.query(
      "select b.* from fms.billitem b where find_in_set('" +
        id +
        "',bid) > 0 and status = 1"
    );
    return res;
  },

  insertBill: async (data) => {
    const res = await db.query("insert into fms.billinfo set ?", data);
    return res;
  },

  updateBill: async (id, data) => {
    const res = await db.query(
      "update fms.billinfo set ? where bid = " + id,
      data
    );
    return res;
  },

  deleteBill: async (id) => {
    const res = await db.query("delete from fms.billinfo where bid = " + id);
    return res;
  },

  revokeBill: async (id, refno) => {
    var resp;
    if (refno) {
      resp = await db.query(
        "delete from fms.studtrans where refno = '" +
          refno +
          "' and bill_id = " +
          id
      );
    } else {
      resp = await db.query("delete from fms.studtrans where bill_id = " + id);
    }
    return resp;
  },

  attachBill: async (id, refno) => {
    var resp;
    if (refno) {
      const bl = await db.query("select * from fms.billinfo where bid = " + id);
      const st = await db.query(
        "select * from ais.student where refno = '" + refno + "'"
      );
      if (bl && st && bl.length > 0 && st.length > 0) {
        const isExist = await db.query(
          "select * from fms.studtrans where refno = '" +
            refno +
            "' and bill_id = " +
            id +
            " and amount > 0"
        );
        if (isExist && isExist.length <= 0) {
          const ins = await db.query("insert into fms.studtrans set ?", {
            narrative: bl[0].narrative,
            bill_id: id,
            amount: bl[0].ammount,
            refno: refno,
            session_id: bl[0].session_id,
            currency: bl[0].currency,
          });
          if (ins.insertId > 0) resp = 1;
        }
      }
    }
    return resp;
  },

  sendStudentBillGh: async (
    bid,
    bname,
    amount,
    prog_id,
    sem,
    sess,
    discount,
    dsem,
    currency
  ) => {
    var count = 0,
      dcount = 0;
    const sts = await db.query(
      "select s.refno,s.indexno from ais.student s where s.complete_status = 0 and s.defer_status = 0 and s.prog_id  = " +
        prog_id +
        " and s.entry_group = 'GH' and find_in_set(s.semester,'" +
        sem +
        "') > 0"
    );
    const dts = await db.query(
      "select s.refno,s.indexno from ais.student s where s.complete_status = 0 and s.defer_status = 0 and s.prog_id  = " +
        prog_id +
        " and s.entry_group = 'GH' and find_in_set(s.semester,'" +
        dsem +
        "') > 0"
    );
    if (sts.length > 0) {
      for (var st of sts) {
        const session_id = await SR.getActiveSessionByRefNo(st.refno);
        if (session_id == sess) {
          const isExist = await db.query(
            "select * from fms.studtrans where refno = '" +
              st.refno +
              "' and bill_id = " +
              bid +
              " and amount > 0"
          );
          if (isExist && isExist.length <= 0) {
            const ins = await db.query("insert into fms.studtrans set ?", {
              narrative: bname,
              bill_id: bid,
              amount,
              refno: st.refno,
              session_id: sess,
              currency,
            });
            if (ins.insertId > 0) count++;
          }
        }
      }
    }
    if (dts.length > 0 && discount && discount > 0) {
      for (var st of dts) {
        const session_id = await SR.getActiveSessionByRefNo(st.refno);
        if (session_id == sess) {
          const isExist = await db.query(
            "select * from fms.studtrans where refno = '" +
              st.refno +
              "' and bill_id = " +
              bid +
              " and amount < 0"
          );
          if (isExist && isExist.length <= 0) {
            const ins = await db.query("insert into fms.studtrans set ?", {
              narrative: `DISCOUNT - ${bname}`,
              bill_id: bid,
              amount: -1 * discount,
              refno: st.refno,
              session_id: sess,
              currency,
            });
            if (ins.insertId > 0) dcount++;
          }
        }
      }
    }
    return { count, dcount };
  },

  sendStudentBillInt: async (
    bid,
    bname,
    amount,
    prog_id,
    sem,
    sess,
    discount,
    dsem,
    currency
  ) => {
    var count = 0,
      dcount = 0;
    const sts = await db.query(
      "select s.refno,s.indexno from ais.student s where s.complete_status = 0 and s.defer_status = 0 and s.prog_id  = " +
        prog_id +
        "  and s.entry_group = 'INT' and find_in_set(s.semester,'" +
        sem +
        "') > 0"
    );
    const dts = await db.query(
      "select s.refno,s.indexno from ais.student s where s.complete_status = 0 and s.defer_status = 0 and s.prog_id  = " +
        prog_id +
        "  and s.entry_group = 'INT' and find_in_set(s.semester,'" +
        dsem +
        "') > 0"
    );

    if (sts.length > 0) {
      for (var st of sts) {
        const session_id = await SR.getActiveSessionByRefNo(st.refno);
        if (session_id == sess) {
          const isExist = await db.query(
            "select * from fms.studtrans where refno = '" +
              st.refno +
              "' and bill_id = " +
              bid +
              " and amount > 0"
          );
          if (isExist && isExist.length <= 0) {
            const ins = await db.query("insert into fms.studtrans set ?", {
              narrative: bname,
              bill_id: bid,
              amount,
              refno: st.refno,
              session_id: sess,
            });
            if (ins.insertId > 0) count++;
          }
        }
      }
    }

    if (dts.length > 0 && discount && discount > 0) {
      for (var st of sts) {
        const session_id = await SR.getActiveSessionByRefNo(st.refno);
        if (session_id == sess) {
          const isExist = await db.query(
            "select * from fms.studtrans where refno = '" +
              st.refno +
              "' and bill_id = " +
              bid +
              " and amount < 0"
          );
          if (isExist && isExist.length <= 0) {
            const ins = await db.query("insert into fms.studtrans set ?", {
              narrative: `DISCOUNT - ${bname}`,
              bill_id: bid,
              amount: -1 * discount,
              refno: st.refno,
              session_id: sess,
              currency,
            });
            if (ins.insertId > 0) dcount++;
          }
        }
      }
    }
    return { count, dcount };
  },

  retireAccount: async () => {
    var count = 0;
    const st = await db.query(
      "select distinct(refno) as refno from fms.studtrans"
    );
    if (st && st.length > 0) {
      for (let s of st) {
        const bal = await db.query(
          "select ifnull(sum(amount),0) as amount from fms.studtrans where refno = '" +
            s.refno +
            "'"
        );
        if (bal && bal.length > 0) {
          const ups = await db.query(
            "update ais.student s set ? where (refno = '" +
              s.refno +
              "' or indexno = '" +
              s.refno +
              "')",
            { transact_account: bal[0].amount }
          );
          if (ups.affectedRows > 0) count++;
        }
      }
    }
    return count;
  },


  retireAccountTransact: async () => {
    var count = 0;
    //const st = await db.query("insert into fms.studtrans(tid,refno,amount,transdate,currency,session_id,narrative) select t.id as tid,t.refno,(t.amount*-1) as amount,t.transdate,t.currency,i.id as session_id,concat('Online Fees Payment, StudentID: ',upper(t.refno)) as narrative from fms.transaction t left join fms.studtrans m on t.id = m.tid left join ais.student s on s.refno = t.refno left join utility.program p on p.id = s.prog_id left join utility.session i on i.mode_id = p.mode_id where t.transtype_id in (2) and m.tid is null and i.`default` = 1 order by tid")
    //if(st) count = st.affectedRows
    const st = await db.query("select t.id as tid,t.refno,(t.amount*-1) as amount,t.transdate,t.currency,concat('Online ',lower(j.title) ,' payment, StudentID: ',upper(t.refno)) as narrative from fms.transaction t left join fms.studtrans m on t.id = m.tid left join fms.transtype j on t.transtype_id = j.id left join ais.student s on s.refno = t.refno left join utility.program p on p.id = s.prog_id  where t.transtype_id in (2,3,4,8) and m.tid is null order by tid");
    if (st && st.length > 0) {
      for (const s of st) {
        const session_id = await SR.getActiveSessionByRefNo(s.refno);
        const dt = { ...s, session_id };
        const ins = await db.query("insert into fms.studtrans set ?", dt);
        if (ins && ins.insertId > 0) count += 1;
      }
    }
    //insert into fms.studtrans(tid,refno,amount,transdate,currency,session_id,narrative)
    return count;
  },

  retireAccountTransact: async () => {
    var count = 0;
    //const st = await db.query("insert into fms.studtrans(tid,refno,amount,transdate,currency,session_id,narrative) select t.id as tid,t.refno,(t.amount*-1) as amount,t.transdate,t.currency,i.id as session_id,concat('Online Fees Payment, StudentID: ',upper(t.refno)) as narrative from fms.transaction t left join fms.studtrans m on t.id = m.tid left join ais.student s on s.refno = t.refno left join utility.program p on p.id = s.prog_id left join utility.session i on i.mode_id = p.mode_id where t.transtype_id in (2) and m.tid is null and i.`default` = 1 order by tid")
    //if(st) count = st.affectedRows
    const st = await db.query("select t.id as tid,t.refno,(t.amount*-1) as amount,t.transdate,t.currency,concat('Online academic fees, StudentID: ',upper(t.refno)) as narrative from fms.transaction t left join fms.studtrans m on t.id = m.tid left join ais.student s on s.refno = t.refno left join utility.program p on p.id = s.prog_id  where t.transtype_id in (2,4) and m.tid is null order by tid");
    if (st && st.length > 0) {
      for (const s of st) {
        const session_id = await SR.getActiveSessionByRefNo(s.refno);
        const dt = { ...s, session_id };
        const ins = await db.query("insert into fms.studtrans set ?", dt);
        if (ins && ins.insertId > 0) count += 1;
      }
    }
    //insert into fms.studtrans(tid,refno,amount,transdate,currency,session_id,narrative)
    return count;
  },

  retireResitTransact: async () => {
    var count = 0;
    //const st = await db.query("insert into fms.studtrans(tid,refno,amount,transdate,currency,session_id,narrative) select t.id as tid,t.refno,(t.amount*-1) as amount,t.transdate,t.currency,i.id as session_id,concat('Online Fees Payment, StudentID: ',upper(t.refno)) as narrative from fms.transaction t left join fms.studtrans m on t.id = m.tid left join ais.student s on s.refno = t.refno left join utility.program p on p.id = s.prog_id left join utility.session i on i.mode_id = p.mode_id where t.transtype_id in (3 ) and m.tid is null and i.`default` = 1 order by tid")
    //if(st) count = st.affectedRows
    const st = await db.query(
      "select t.id as tid,t.refno,(t.amount*-1) as amount,t.transdate,t.currency,concat('Online Fees Payment, StudentID: ',upper(t.refno)) as narrative from fms.transaction t left join fms.studtrans m on t.id = m.tid left join ais.student s on s.refno = t.refno left join utility.program p on p.id = s.prog_id  where t.transtype_id in (3) and m.tid is null order by tid"
    );
    if (st && st.length > 0) {
      for (const s of st) {
        const session_id = await SR.getActiveSessionByRefNo(s.refno);
        const dt = { ...s, session_id };
        const ins = await db.query("insert into fms.studtrans set ?", dt);
        if (ins && ins.insertId > 0) count += 1;
      }
    }
    return count;
  },


  retireStudentAccountByRefno: async (refno) => {
    const st = await db.query("select t.id as tid,t.refno,(t.amount*-1) as amount,t.transdate,t.currency,concat('Online ',lower(j.title) ,' payment, StudentID: ',upper(t.refno)) as narrative from fms.transaction t left join fms.studtrans m on t.id = m.tid left join fms.transtype j on t.transtype_id = j.id left join ais.student s on s.refno = t.refno left join utility.program p on p.id = s.prog_id  where t.transtype_id in (2,3,4,8) and m.tid is null order by tid");
    if (st && st.length > 0) {
      const session_id = await SR.getActiveSessionByRefNo(refno);
      const dt = { ...st[0], session_id };
      const ins = await db.query("insert into fms.studtrans set ?", dt);
    } 
    const rt = SR.retireAccountByRefno(refno)
    return rt
  },

  retireStudentAccount: async () => {
    var count = 0;
    const st = await db.query(
      "select distinct(refno) as refno from ais.fetchstudents where complete_status = 0"
    );
    if (st && st.length > 0) {
      for (let s of st) {
        const rt = SR.retireAccountByRefno(s.refno)
        if (rt > 0) count++;
      }
    }
    return count;
  },

  

  // Finance Reports

  finReportAdmitted: async () => {
    var data = [],
      fileName = "ADMISSION LIST";
    var sid = await db.query(
      "select session_id from P06.session where status = 1"
    );
    if (sid && sid.length > 0) {
      var sql =
        "select h.start_semester,i.session,h.created_at,h.serial,concat(i.fname,' ',i.lname) as name,i.dob,i.gender,i.phone,p.`short` as program_name from P06.admitted h left join ais.student i on h.serial = i.refno left join utility.program p on p.id = h.prog_id where h.admit_session = " +
        sid[0].session_id;
      sql += " order by p.`short`, h.created_at";
      const res = await db.query(sql);
      if (res && res.length > 0) {
        for (var row of res) {
          const ds = {
            "STUDENT ID": row.serial,
            STUDENT_NAME: row.name && row.name.toUpperCase(),
            YEAR: Math.ceil(row.start_semester / 2),
            GENDER:
              row.gender == "M" ? "MALE" : row.gender == "F" ? "FEMALE" : "",
            PHONE: row.phone,
            PROGRAM: row.program_name,
            "STUDY MODE": row.session,
            "DATE OF ADMISSION": moment(row.created_at).format("MM/YYYY"),
          };
          data.push(ds);
        }
      }
      return { data, fileName };
    } else {
      return null;
    }
  },

  finReportFees: async (start, end) => {
    var data = [],
      fileName = `FEES PAYMENT REPORT `;
    var sql = "select * from ais.fetchtrans where transtype_id = 2";
    if (start && end)
      sql +=
        " and transdate between date('" + start + "') and date('" + end + "')";
    sql += " order by id desc";
    const res = await db.query(sql);
    if (res && res.length > 0) {
      for (var row of res) {
        const ds = {
          "STUDENT ID": row.refno,
          "INDEX NO": row.indexno,
          STUDENT_NAME: row.name && row.name.toUpperCase(),
          CURRENCY: row.currency,
          AMOUNT: row.amount,
          REFERENCE: row.transtag,
          "TRANSACTION DATE": moment(row.transdate)
            .format("MMM-DD-YYYY")
            .toUpperCase(),
        };
        data.push(ds);
      }
    }
    return { data, fileName };
  },

  finReportOthers: async (start, end) => {
    var data = [],
      fileName = `OTHER PAYMENTS REPORT `;
    var sql = "select * from ais.fetchtrans where transtype_id not in (1,2)";
    if (start && end)
      sql +=
        " and transdate between date('" + start + "') and date('" + end + "')";
    sql += " order by id desc";
    const res = await db.query(sql);
    if (res && res.length > 0) {
      for (var row of res) {
        const ds = {
          "TRANSACTION TYPE": row.transtitle,
          NAME: row.name && row.name.toUpperCase(),
          CURRENCY: row.currency,
          AMOUNT: row.amount,
          REFERENCE: row.transtag,
          "TRANSACTION DATE": moment(row.transdate)
            .format("MMM-DD-YYYY")
            .toUpperCase(),
        };
        data.push(ds);
      }
    }
    return { data, fileName };
  },

  finReportVouchs: async (start, end) => {
    var data = [],
      fileName = `VOUCHER SALES REPORT `;
    var sql = "select * from ais.fetchvouchs where transtype_id = 1";
    if (start && end)
      sql +=
        " and transdate between date('" + start + "') and date('" + end + "')";
    sql += " order by id desc";
    const res = await db.query(sql);
    if (res && res.length > 0) {
      for (var row of res) {
        const ds = {
          "APPLICANT SERIAL": row.serial,
          "BUYER NAME": row.name && row.name.toUpperCase(),
          "BUYER PHONE": row.phone,
          CURRENCY: row.currency,
          AMOUNT: row.amount,
          REFERENCE: row.transtag,
          "TRANSACTION DATE": moment(row.transdate)
            .format("MMM-DD-YYYY")
            .toUpperCase(),
          "SMS STATUS": row.sms_code == "1000" ? "RECEIVED" : "NOT SENT",
        };
        data.push(ds);
      }
    }
    return { data, fileName };
  },

  finReportAdvance: async () => {
    var data = [],
      fileName = `STUDENT ADVANCE REPORT `;
    var sql = "select * from ais.fetchstudents where transact_account < 0";
    sql += " order by transact_account desc, lname desc";
    const res = await db.query(sql);
    if (res && res.length > 0) {
      for (var row of res) {
        const ds = {
          "STUDENT ID": row.refno,
          "INDEX NO": row.indexno,
          STUDENT_NAME: row.name && row.name.toUpperCase(),
          "STUDENT CATEGORY":
            row.entry_group == "GH" ? "LOCAL" : "INTERNATIONAL",
          BALANCE: Math.abs(row.transact_account),
        };
        data.push(ds);
      }
    }
    return { data, fileName };
  },

  finReportEligible: async ({ session, prog_id, major_id, year_group }) => {
    var data = [],
      fileName = `EXAMS ELIGIBILITY REPORT `;
    var sql =
      "select * from ais.fetchstudents where complete_status = 0 and transact_account <= 0";
    if (session) sql += " and session = '" + session + "'";
    if (prog_id) sql += " and prog_id = " + prog_id;
    if (major_id) sql += " and major_id = " + major_id;
    if (year_group) sql += " and ceil(semester/2) = " + year_group;

    sql += " order by prog_id,semester,major_id,session,lname";
    console.log(sql);
    const res = await db.query(sql);
    if (res && res.length > 0) {
      for (var row of res) {
        const ds = {
          "STUDENT ID": row.refno,
          "INDEX NUMBER": row.indexno,
          STUDENT_NAME: row.name && row.name.toUpperCase(),
          PROGRAM: row.program_name,
          MAJOR: row.major_name,
          YEAR: Math.ceil(row.semester / 2),
          "STUDY MODE": row.session,
          "STUDENT CATEGORY":
            row.entry_group == "GH" ? "LOCAL" : "INTERNATIONAL",
          DEBT: row.transact_amount,
        };
        data.push(ds);
      }
    }
    return { data, fileName };
  },

  AdmissionReport: async ({ prog_id, gender }) => {
    var data = [],
      fileName = `ADMISSION REPORT `;
    var sql =
      "select a.serial as 'SERIAL/APPLICANT ID/STUDENT ID',concat(p.fname,' ',p.lname) as 'FULL NAME',p.gender as 'GENDER',x.`short` as 'PROGRAM OF STUDY',p.citizen_country as 'COUNTRY',p.session_mode as 'MODE OF STUDY',p.phone as 'CONTACT',a.username as 'STUDENT MAIL', a.password as 'STUDENT PASSWORD' from P06.admitted a left join P06.session s on a.admit_session = s.session_id left join P06.step_profile p on p.serial = a.serial left join utility.program x on a.prog_id = x.id where s.status = 1";
    if (gender) sql += " and p.gender = '" + gender + "'";
    if (prog_id) sql += " and a.prog_id = " + prog_id;

    sql += " order by a.group_id,a.prog_id";
    console.log(sql);
    const res = await db.query(sql);
    if (res && res.length > 0) {
      data = res;
    }
    return { data, fileName };
  },

  setupSchoresheet: async () => {
    // Diploma Sessions -  M, Undergrat Sessions - M,E,W, Postgrat Sessions - W
    // Session Groups - Main stream, sub stream
    /*  STEPS */
    // 1. Check default Sessions for both stream and loop for all
    // 2. In Session loop, Fetch all utility.structuremeta and insert into ais.sheet
    // 3. Whiles in loop check conditions below
    // #  If session is sub stream, insert for only semester 1,2 with session_id
    // #  If session is main stream, insert for all semesters 1-8 with session_id
    // #  Check group_id of utility.stru

    // Get All Streams - Two Streams
    const main_stream = await db.query(
      "select * from utility.session where tag = 'MAIN' and `default` =  1"
    );
    const sub_stream = await db.query(
      "select * from utility.session where tag = 'SUB' and `default` =  1"
    );

    // Stage for Main Stream
    const main_meta = await db.query(
      "select x.*,p.group_id from utility.structure x left join utility.program p on x.prog_id = p.id where x.status = 1 and p.status = 1"
    );
    if (
      main_meta &&
      main_meta.length > 0 &&
      main_stream &&
      main_stream.length > 0
    ) {
      var data = [];
      for (var meta of main_meta) {
        if (meta.semester % 2 == (main_stream[0].academic_sem == 2 ? 1 : 0))
          continue;
        var loop_count, session_modes;
        data.push(meta);
        switch (meta.group_id) {
          case "CP":
            loop_count = 1;
            session_modes = ["M"];
            break;
          case "DP":
            loop_count = 2;
            session_modes = ["M", "W"];
            break;
          case "UG":
            loop_count = 3;
            session_modes = ["M", "E", "W"];
            break;
          case "PG":
            loop_count = 1;
            session_modes = ["W"];
            break;
        }

        // Run Data For All Existing Session Modes
        if (session_modes && session_modes.length > 0) {
          for (var i = 0; i < session_modes.length; i++) {
            var sql =
              "select * from ais.sheet where session_id = " +
              main_stream[0].id +
              " and prog_id = " +
              meta.prog_id +
              " and course_id = " +
              meta.course_id +
              " and semester = " +
              parseInt(meta.semester) +
              " and session = '" +
              session_modes[i] +
              "' and mode_id = 1";
            sql += meta.major_id
              ? " and major_id = " + meta.major_id
              : " and major_id is null";
            const isExist = await db.query(sql);
            if (isExist && isExist.length <= 0) {
              const dt = {
                prog_id: meta.prog_id,
                major_id: meta.major_id,
                course_id: meta.course_id,
                semester: parseInt(meta.semester),
                session_id: main_stream[0].id,
                session: session_modes[i],
                mode_id: 1,
              };
              const ins = await db.query("insert into ais.sheet set ?", dt);
            }
          }
        }
      }
    }

    // Stage for Sub Stream
    const code = `01${moment().format("YY")}`;
    var semester = 3;
    const ql =
      "select prog_id from ais.student where date_format(doa,'%m%y') = '" +
      code +
      "' and semester in (3,4,5,6)";
    const st = await db.query(ql);
    if (st && st.length > 0) semester = 5;
    const dl =
      "select x.*,p.group_id from utility.structure x left join utility.program p on x.prog_id = p.id where x.status = 1 and p.status = 1 and x.semester < " +
      semester;
    console.log(dl, st, sub_stream);

    const sub_meta = await db.query(dl);
    if (
      sub_meta &&
      sub_meta.length > 0 &&
      sub_stream &&
      sub_stream.length > 0
    ) {
      var data = [];
      for (var meta of sub_meta) {
        if (meta.semester % 2 == (sub_stream[0].academic_sem == 2 ? 1 : 0))
          continue;
        var loop_count, sub_session_modes;
        data.push(meta);
        switch (meta.group_id) {
          case "CP":
            loop_count = 1;
            sub_session_modes = ["M"];
            break;
          case "DP":
            loop_count = 2;
            sub_session_modes = ["M", "W"];
            break;
          case "UG":
            loop_count = 3;
            sub_session_modes = ["M", "E", "W"];
            break;
          case "PG":
            loop_count = 1;
            sub_session_modes = ["W"];
            break;
        }

        // Run Data For All Existing Session Modes
        if (sub_session_modes && sub_session_modes.length > 0) {
          for (var i = 0; i < sub_session_modes.length; i++) {
            var sql =
              "select * from ais.sheet where session_id = " +
              sub_stream[0].id +
              " and prog_id = " +
              meta.prog_id +
              " and course_id = " +
              meta.course_id +
              " and semester = " +
              parseInt(meta.semester) +
              " and session = '" +
              sub_session_modes[i] +
              "' and mode_id = 1";
            sql += meta.major_id
              ? " and major_id = " + meta.major_id
              : " and major_id is null";
            const isExist = await db.query(sql);
            if (isExist && isExist.length <= 0) {
              const dt = {
                unit_id: meta.unit_id,
                prog_id: meta.prog_id,
                major_id: meta.major_id,
                course_id: meta.course_id,
                semester: parseInt(meta.semester),
                session_id: main_stream[0].id,
                session: sub_session_modes[i],
                mode_id: 1,
              };
              const ins = await db.query("insert into ais.sheet set ?", dt);
            }
          }
        }
      }
    }

    return data;
  },

  stageSheet: async (sid) => {
    const stream = await db.query(
      "select * from utility.session where id = " + sid
    );
    if (stream && stream.length > 0) {
      if (stream[0].tag == "MAIN") {
        // NORMAL ACADEMIC SESSION - MAIN STREAM
        const main_meta = await db.query(
          "select x.*,p.group_id from utility.structure x left join utility.program p on x.prog_id = p.id where x.status = 1 and p.status = 1"
        );
        if (main_meta && main_meta.length > 0) {
          var data = [];
          for (var meta of main_meta) {
            if (meta.semester % 2 == (stream[0].academic_sem == 2 ? 1 : 0))
              continue;
            var loop_count, session_modes;
            data.push(meta);
            switch (meta.group_id) {
              case "CP":
                session_modes = ["M"];
                break;
              case "DP":
                session_modes = ["M", "W"];
                break;
              case "UG":
                session_modes = ["M", "E", "W"];
                break;
              case "PG":
                session_modes = ["W"];
                break;
            }

            // Run Data For All Existing Session Modes
            if (session_modes && session_modes.length > 0) {
              for (var i = 0; i < session_modes.length; i++) {
                var sql =
                  "select * from ais.sheet where session_id = " +
                  stream[0].id +
                  " and prog_id = " +
                  meta.prog_id +
                  " and course_id = " +
                  meta.course_id +
                  " and semester = " +
                  parseInt(meta.semester) +
                  " and session = '" +
                  session_modes[i] +
                  "' and mode_id = 1";
                sql += meta.major_id
                  ? " and major_id = " + meta.major_id
                  : " and major_id is null";
                const isExist = await db.query(sql);
                if (isExist && isExist.length <= 0) {
                  const dt = {
                    unit_id: meta.unit_id,
                    prog_id: meta.prog_id,
                    major_id: meta.major_id,
                    course_id: meta.course_id,
                    semester: parseInt(meta.semester),
                    session_id: stream[0].id,
                    session: session_modes[i],
                    mode_id: 1,
                  };
                  const ins = await db.query("insert into ais.sheet set ?", dt);
                }
              }
            }
          }
          return data;
        }
        return null;
      } else {
        // JANUARY STREAM
        //const code = `01${moment().format('YY')}`
        const code = stream[0].admission_code;
        var semester = 3;
        const ql =
          "select distinct prog_id,semester,session from ais.student where date_format(doa,'%m%y') = '" +
          code +
          "' and semester in (3,4)"; // Students Admiited to Level 200 for January Stream
        const st = await db.query(ql);
        if (st && st.length > 0) semester = 5;
        const dl =
          "select x.*,p.group_id from utility.structure x left join utility.program p on x.prog_id = p.id where x.status = 1 and p.status = 1 and x.semester < " +
          semester;
        console.log(dl, st, stream);
        var sub_meta = await db.query(dl);
        if (sub_meta && sub_meta.length > 0) {
          // Remove Un-admitted Programs for Level 200
          if ((semester = 5 && st.length > 0)) {
            let holder = {};
            for (const s of st) {
              holder[
                `${s.prog_id}${s.semester}${s.session ? s.session : ""}`
              ] = true;
            }
            sub_meta = sub_meta.filter(
              (r) =>
                [1, 2].includes(r.semester) ||
                ([3, 4].includes(r.semester) &&
                  holder[
                    `${r.prog_id}${r.semester}${r.session ? r.session : ""}`
                  ])
            );
          }

          var data = [];
          for (var meta of sub_meta) {
            if (meta.semester % 2 == (stream[0].academic_sem == 2 ? 1 : 0))
              continue;
            var loop_count, sub_session_modes;
            data.push(meta);
            switch (meta.group_id) {
              case "CP":
                sub_session_modes = ["M"];
                break;
              case "DP":
                sub_session_modes = ["M", "W"];
                break;
              case "UG":
                sub_session_modes = ["M", "E", "W"];
                break;
              case "PG":
                sub_session_modes = ["W"];
                break;
            }

            // Run Data For All Existing Session Modes
            if (sub_session_modes && sub_session_modes.length > 0) {
              for (var i = 0; i < sub_session_modes.length; i++) {
                var sql =
                  "select * from ais.sheet where session_id = " +
                  stream[0].id +
                  " and prog_id = " +
                  meta.prog_id +
                  " and course_id = " +
                  meta.course_id +
                  " and semester = " +
                  parseInt(meta.semester) +
                  " and session = '" +
                  sub_session_modes[i] +
                  "' and mode_id = 1";
                sql += meta.major_id
                  ? " and major_id = " + meta.major_id
                  : " and major_id is null";
                const isExist = await db.query(sql);
                if (isExist && isExist.length <= 0) {
                  const dt = {
                    prog_id: meta.prog_id,
                    major_id: meta.major_id,
                    course_id: meta.course_id,
                    semester: parseInt(meta.semester),
                    session_id: stream[0].id,
                    session: sub_session_modes[i],
                    mode_id: 1,
                  };
                  const ins = await db.query("insert into ais.sheet set ?", dt);
                }
              }
            }
          }
          return data;
        }
        return null;
      }
    } else {
      return null;
    }
  },

  // PROGRESS STUDENT
  progressLevel: async (sid) => {
    const ss = await db.query(
      "select s.*,p.indexno from utility.session s left join ais.progression p on s.id = p.session_id where s.id = " +
        sid
    );
    if (ss && ss.length > 0 && !ss[0].indexno) {
      const { tag, academic_year } = ss[0];
      const year = academic_year.split("/")[1];
      const query =
        tag == "MAIN"
          ? `select s.refno,s.indexno,s.semester,s.doa,s.complete_status,p.stype,p.semesters from ais.fetchstudents s left join utility.program p on s.prog_id = p.id where !((date_format(doa,'%m') = '01' and year(doa) = '${year}')) and (s.complete_status = 0 and s.defer_status = 0)`
          : `select s.refno,s.indexno,s.semester,s.doa,s.complete_status,p.stype,p.semesters from ais.fetchstudents s left join utility.program p on s.prog_id = p.id where date_format(doa,'%m') = '01' and year(doa) = '${year}' and s.complete_status = 0 and s.defer_status = 0`;
      const st = await db.query(query);
      if (st && st.length > 0) {
        for (s of st) {
          const chk = await db.query(
            "select * from ais.progression where indexno = '" +
              s.indexno +
              "' and session_id = " +
              sid
          );
          if (chk && chk.length <= 0) {
            var { semester, semesters, complete_status, indexno } = s;
            if (s) {
              const sem = semester + 2;
              if (sem <= semesters) {
                semester = sem;
                complete_status = 0;
              } else {
                semester = 0;
                complete_status = 1;
              }
              // Update Student Profile
              await db.query(
                "update ais.student set ? where indexno = '" + indexno + "'",
                { semester, complete_status }
              );
              // Log Progression
              await db.query("insert into ais.progression set ?", {
                session_id: sid,
                indexno,
                semester,
                meta: JSON.stringify(s),
              });
            }
          }
        }
        return true;
      }
    }
    return null;
  },

  // CORRECT STUDENT NAMES
  runUpgradeNames: async () => {
    var count = 0;
    const st = await db.query(
      "select * from ais.student where complete_status = 0"
    );
    if (st && st.length > 0) {
      for (var s of st) {
        var { fname, mname, lname, refno } = s;
        const fnames = fname && fname.trim().split(" ");
        const lnames = lname && lname.trim().split(" ");

        if (fnames && fnames.length == 2 && !lname && !mname) {
          fname = fnames[0];
          lname = fnames[1];
        } else if (fnames && fnames.length == 3 && !lname && !mname) {
          fname = fnames[0];
          mname = fnames[1];
          lname = fnames[2];
        } else if (fnames && fnames.length == 4 && !lname && !mname) {
          fname = fnames[0];
          mname = `${fnames[1]} ${fnames[2]}`;
          lname = fnames[3];
        } else if (lnames && lnames.length == 2 && !fname && !mname) {
          fname = lnames[0];
          lname = lnames[1];
        } else if (lnames && lnames.length == 3 && !fname && !mname) {
          fname = lnames[0];
          mname = lnames[1];
          lname = lnames[2];
        } else if (lnames && lnames.length == 4 && !fname && !mname) {
          fname = lnames[0];
          mname = `${lnames[1]} ${lnames[2]}`;
          lname = lnames[3];
        }

        if (!lname && mname) {
          const mnames = mname.split(" ");
          if (mnames.length > 1) {
            lname = mnames[mnames.length - 1];
            mname = mnames[0];
          } else {
            lname = mname;
            mname = null;
          }
        }

        if (!fname && mname) {
          const mnames = mname.split(" ");
          if (mnames.length > 1) {
            fname = mnames[mnames.length - 1];
            mname = mnames[0];
          } else {
            fname = mname;
            mname = null;
          }
        }

        const data = { fname, mname, lname };
        await db.query(
          "update ais.student set ? where refno = '" + refno + "'",
          data
        );
      }
    }
  },

  // PAYMENTS DUPLICATES  - SCRIPT
  runRemovePaymentDuplicates: async () => {
    var count = 0;
    const st = await db.query(
      "select *,id,refno,amount,transtag,date_format(transdate,'%Y-%m-%d') as transdate from fms.transaction where transtype_id = 2 order by id"
    );
    const dup = [];
    const obj = {};
    if (st && st.length > 0) {
      for (var s of st) {
        const key = `${s.refno}_${s.amount}_${s.transdate}`;
        if (obj[key]) {
          //dup.push(key)
          count += 1;
          const m = s.id;
          await db.query("delete from fms.transaction where id = " + m);
          await db.query("delete from fms.studtrans where tid = " + m);
          await db.query("insert into fms.fmsdelete_log set ?", {
            tid: m,
            meta: JSON.stringify(s),
          });
        } else {
          obj[key] = s.id;
        }
      }
    }
    return count;
  },

  // UPDATE COMPLETE STATUS OF STUDENT - SCRIPT
  runData: async () => {
    const data = require("../../config/data.json");
    if (data && data.length > 0) {
      // Update All Students To Completed
      await db.query("update ais.student set complete_status = 1");
      // Update ALl Post Graduates
      await db.query(
        "update ais.student set complete_status = 0 where prog_id in (3,4,5)"
      );
      // Update Undergraduates in data.json
      for (var d of data) {
        const val = d["AUDM09211001"].trim();
        await db.query(
          "update ais.student set complete_status = 0 where refno = '" +
            val +
            "' or indexno = '" +
            val +
            "'"
        );
        console.log(val);
      }
    }
    /*
      var count = 0;
      const st = await db.query("select *,id,refno,amount,transtag,date_format(transdate,'%Y-%m-%d') as transdate from fms.transaction where transtype_id = 2 order by id")
      const dup = []
      const obj = {}
      if(st && st.length > 0){
         for(var s of st){
           const key = `${s.refno}_${s.amount}_${s.transdate}`
           if(obj[key]){ 
              //dup.push(key)
              count +=1
              const m = s.id
              await db.query("delete from fms.transaction where id = "+m)
              await db.query("delete from fms.studtrans where tid = "+m)
              await db.query("insert into fms.fmsdelete_log set ?", {tid:m,meta:JSON.stringify(s)})

           }else{
              obj[key] = s.id
           }
         }
      }  return count
      */
  },

  // BILL ITEMS - FMS

  fetchBillItems: async (page, keyword) => {
    var sql =
      "select s.academic_year,i.* from fms.billitem i left join utility.session s on i.session_id = s.id";
    var cql =
      "select count(*) as total from fms.billitem i left join utility.session s on i.session_id = s.id";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` where i.narrative like '%${keyword}%' or i.amount = '${keyword}'`;
      cql += ` where i.narrative like '%${keyword}%' or i.amount = '${keyword}'`;
    }

    sql += ` order by i.id desc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchBillItem: async (id) => {
    const res = await db.query(
      "select b.*,p.`short` as program_name from fms.billinfo b left join utility.program p on p.id = b.prog_id where bid = " +
        id
    );
    return res;
  },

  insertBillItem: async (data) => {
    const res = await db.query("insert into fms.billitem set ?", data);
    return res;
  },

  updateBillItem: async (id, data) => {
    const res = await db.query(
      "update fms.billitem set ? where id = " + id,
      data
    );
    return res;
  },

  deleteBillItem: async (id) => {
    const res = await db.query("delete from fms.billitem where id = " + id);
    return res;
  },

  addToBill: async (id, bid) => {
    var res;
    const it = await db.query("select * from fms.billitem where id = " + id);
    if (it && it.length > 0) {
      const bids = it[0].bid ? it[0].bid + "," + bid : bid;
      res = await db.query("update fms.billitem set ? where id = " + id, {
        bid: bids,
      });
    }
    return res;
  },

  // FEE PAYMENTS - FMS

  fetchPayments: async (page, keyword) => {
    var sql = "select * from ais.fetchtrans where transtype_id = 2";
    var cql =
      "select count(*) as total from ais.fetchtrans where transtype_id = 2";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` and (transtag like '%${keyword.trim()}%' or fname like '%${keyword.trim()}%' or lname like '%${keyword.trim()}%' or amount = '${keyword.trim()}')`;
      cql += ` and (transtag like '%${keyword.trim()}%' or fname like '%${keyword.trim()}%' or lname like '%${keyword.trim()}%' or amount = '${keyword.trim()}')`;
    }

    sql += ` order by transdate desc,id`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);
    console.log("PAYMENTS SQL: ", sql);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchOtherPayments: async (page, keyword) => {
    var sql = "select * from ais.fetchtrans where transtype_id not in (1,2)";
    var cql =
      "select count(*) as total from ais.fetchtrans where transtype_id not in (1,2)";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` and fname like '%${keyword}%' or lname like '%${keyword}%' or amount = '${keyword}' or reference like '%${keyword}%' or transtag like '%${keyword}%' `;
      cql += ` and fname like '%${keyword}%' or lname like '%${keyword}%' or amount = '${keyword}' or reference like '%${keyword}%' or transtag like '%${keyword}%' `;
    }

    sql += ` order by id desc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    console.log("PAYMENTS SQL: ", sql);
    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchVoucherSales: async (page, keyword) => {
    var sql = "select * from ais.fetchvouchs";
    var cql = "select count(*) as total from ais.fetchvouchs";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` and name like '%${keyword}%' or buyer_phone like '%${keyword}%' `;
      cql += ` and name like '%${keyword}%' or buyer_phone like '%${keyword}%' `;
    }

    sql += ` order by id desc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchPayment: async (id) => {
    const res = await db.query("select * from ais.fetchtrans where id = " + id);
    return res;
  },

  fetchItemsByBid: async (id) => {
    const res = await db.query(
      "select b.* from fms.billitem b where find_in_set('" +
        id +
        "',bid) > 0 and status = 1"
    );
    return res;
  },

  insertPayment: async (data) => {
    const res = await db.query("insert into fms.transaction set ?", data);
    return res;
  },

  updatePayment: async (id, data) => {
    const res = await db.query(
      "update fms.transaction set ? where id = " + id,
      data
    );
    return res;
  },

  deletePayment: async (id) => {
    const resm = await db.query("delete from fms.studtrans where tid = " + id);
    const res = await db.query("delete from fms.transaction where id = " + id);
    return res;
  },

  updateStudFinance: async (tid, refno, amount, transid) => {
    const session_id = await SR.getActiveSessionByRefNo(refno);
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

  verifyFeesQuota: async (refno) => {
    const st = await db.query(
      "select x.id from ais.student s left join utility.program p on s.prog_id = p.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and s.refno = " +
        refno
    );
    const fin = await db.query(
      "select * fms.studtrans where bill is not null and session_id = " +
        st[0].id
    );
    const dt = {
      tid,
      amount,
      refno,
      narrative: `${refno} : FEES PAYMENT - AUCC_FIN `,
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
      r;
      resp = await db.query("insert into fms.studtrans set ?", dt);
      fid = resp && resp.insertId;
    }
    return fid;
  },

  generateIndexNo: async (refno) => {
    const st = await db.query(
      "select p.prefix,p.stype,date_format(s.doa,'%m%y') as code,s.indexno from ais.student s left join utility.program p on s.prog_id = p.id where s.refno = '" +
        refno +
        "'"
    );
    if (
      st &&
      st.length > 0 &&
      (st[0].indexno == "UNIQUE" || st[0].indexno == null)
    ) {
      if (!st[0].code) return null;
      const prefix = `${st[0].prefix.trim()}${st[0].code}${st[0].stype}`;
      var newIndex, resp, no;
      const sm = await db.query(
        "select indexno,prog_count from ais.student where indexno like '" +
          prefix +
          "%' order by prog_count desc limit 1"
      );
      if (sm && sm.length > 0) {
        no = parseInt(sm[0].prog_count) + 1;
        var newNo;
        switch (no.toString().length) {
          case 1:
            newNo = `00${no}`;
            break;
          case 2:
            newNo = `0${no}`;
            break;
          case 3:
            newNo = `${no}`;
            break;
          default:
            newNo = `${no}`;
            break;
        }
        newIndex = `${prefix}${newNo}`;
      } else {
        no = 1;
        newIndex = `${prefix}00${no}`;
      }

      while (true) {
        const sf = await db.query(
          "select indexno from ais.student where indexno = '" + newIndex + "'"
        );
        if (sf && sf.length == 0) break;
        no++;
        // Regenerate or Re-compute Index Number
        var newNo;
        switch (no.toString().length) {
          case 1:
            newNo = `00${no}`;
            break;
          case 2:
            newNo = `0${no}`;
            break;
          case 3:
            newNo = `${no}`;
            break;
          default:
            newNo = `${no}`;
            break;
        }
        newIndex = `${prefix}${newNo}`;
      }
      resp = await db.query(
        "update ais.student set ? where refno = '" + refno + "'",
        { indexno: newIndex, prog_count: no }
      );
      if (resp) return newIndex;
    }
    return null;
  },

  savePaymentToAccount: async (data) => {
    const res = await db.query("insert into fms.studtrans set ?", data);
    return res;
  },

  moveToFees: async (id, amount, refno, transid) => {
    const rs = await db.query(
      "update fms.transaction set transtype_id = 2 where id = " + id
    );
    console.log(rs);
    const ms = await SR.updateStudFinance(id, refno, amount, transid);
    console.log(ms);
    if (rs && ms) return rs;
    return null;
  },

  // DEBTORS - FMS MODELS

  fetchDebtors: async (page, keyword) => {
    var sql =
      "select s.*,u.uid,u.flag_locked,u.flag_disabled,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(s.mname,' '),''),s.lname) as name from ais.student s left join identity.user u on s.refno = u.tag left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id where s.transact_account > 0";
    var cql =
      "select count(*) as total from ais.student s left join identity.user u on s.refno = u.tag left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id where s.transact_account > 0";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` and s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.refno = '${keyword}' or s.indexno = '${keyword}'`;
      cql += ` and s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.refno = '${keyword}' or s.indexno = '${keyword}'`;
    }

    sql += ` order by s.complete_status asc,s.prog_id asc,s.lname asc, s.fname asc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchFMSDebtorsReport: async ({
    prog_id,
    major_id,
    year_group,
    session,
    gender,
    entry_group,
    defer_status,
    type,
  }) => {
    var sql =
      "select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(s.mname,' '),''),s.lname) as name from ais.student s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id where s.complete_status = 0 and transact_account > 0";
    var res;
    if (prog_id) sql += ` and s.prog_id = ${prog_id}`;
    if (major_id) sql += ` and s.major_id = ${major_id}`;
    if (year_group) sql += ` and ceil(s.semester/2) = ${year_group}`;
    if (session) sql += ` and s.session = '${session}'`;
    if (gender) sql += ` and s.gender = '${major_id}'`;
    if (entry_group) sql += ` and s.entry_group = '${entry_group}'`;
    if (defer_status) sql += ` and s.defer_status = ${defer_status}`;

    sql += ` order by s.prog_id,s.semester,s.major_id,s.session,s.lname asc`;
    res = await db.query(sql);
    if (res && res.length > 0) return res;
    return res;
  },

  // HRSTAFF - HRS MODELS

  fetchHRStaff: async (page, keyword) => {
    var sql =
      "select s.*,u.uid,u.flag_locked,u.flag_disabled,ifnull(j.title,s.position) as designation,m.title as unit_name,concat(s.fname,' ',ifnull(concat(s.mname,' '),''),s.lname) as name from hrs.staff s left join identity.user u on s.staff_no = u.tag left join hrs.job j on s.job_id = j.id left join utility.unit m on s.unit_id = m.id";
    var cql =
      "select count(*) as total from hrs.staff s left join identity.user u on s.staff_no = u.tag left join hrs.job j on s.job_id = j.id left join utility.unit m on s.unit_id = m.id";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` where s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.staff_no = '${keyword}' or s.staff_no = '${keyword}' or s.title like '${keyword}%' or j.title like '${keyword}%' or s.position like '${keyword}%'`;
      cql += ` where s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.staff_no = '${keyword}' or s.staff_no = '${keyword}' or s.title like '${keyword}%' or j.title like '${keyword}%' or s.position like '${keyword}%'`;
    }

    sql += ` order by s.staff_no asc,s.lname asc, s.fname asc`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  fetchActiveStListHRS: async () => {
    const res = await db.query(
      "select s.*,u.uid,u.flag_locked,u.flag_disabled,ifnull(j.title,s.position) as designation,m.title as unit_name,concat(s.fname,' ',ifnull(concat(s.mname,' '),''),s.lname) as name from hrs.staff s left join identity.user u on s.staff_no = u.tag left join hrs.job j on s.job_id = j.id left join utility.unit m on s.unit_id = m.id"
    );
    return res;
  },

  insertHRStaff: async (data) => {
    const res = await db.query("insert into hrs.staff set ?", data);
    return res;
  },

  updateHRStaff: async (id, data) => {
    const res = await db.query("update hrs.staff set ? where id = " + id, data);
    return res;
  },

  deleteHRStaff: async (id) => {
    const st = await db.query(
      "select u.uid from hrs.staff s left join identity.user u on u.tag = s.staff_no where s.id = " +
        id
    );
    var resp;
    if (st && st.length > 0) {
      var res = await db.query(
        "delete from identity.photo where uid = " + st[0].uid
      );
      var res = await db.query(
        "delete from identity.user where uid = " + st[0].uid
      );
      var res = await db.query(
        "delete from identity.user_role where uid = " + st[0].uid
      );
      resp = await db.query("delete from hrs.staff where id = " + id);
    }
    return res;
  },

  getNewStaffNo: async () => {
    const res = await db.query(
      "select staff_no+1 as staff_no from hrs.staff where staff_no not in ('15666','16000') order by staff_no desc limit 1"
    );
    if (res && res.length > 0) return res[0].staff_no;
    return null;
  },

  fetchStaffProfile: async (staff_no) => {
    const res = await db.query(
      "select s.*,x.title as unit_name,m.title as designation,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name from hrs.staff s left join identity.user u on u.tag = s.staff_no left join utility.unit x on s.unit_id = x.id left join hrs.job m on s.job_id = m.id  where s.staff_no = " +
        staff_no
    );
    return res;
  },

  updateHRSUnitHead: async (id, sno) => {
    const m1 = await db.query("select * from utility.unit where id = " + id);
    if (m1 && m1.length > 0 && m1[0].head) {
      const role = m1[0].level == 3 ? 21 : 22;
      const m2 = await db.query(
        "select * from identity.user where tag = '" + m1[0].head + "'"
      );
      if (m2 && m2.length > 0 && m1[0].type == "ACADEMIC")
        await db.query(
          "delete from identity.user_role where uid = " +
            m2[0].uid +
            " and arole_id = " +
            role
        );
      await db.query(
        "update utility.unit set head = " + sno + " where id = " + id
      );
      const m3 = await db.query(
        "select * from identity.user where tag = '" + sno + "'"
      );
      if (m3 && m3.length > 0 && m1[0].type == "ACADEMIC")
        await db.query("insert into identity.user_role set ?", {
          arole_id: role,
          role_meta: id,
          uid: m3[0].uid,
          status: 1,
        });
    }
    return m1;
  },

  updateStaffProfile: async (staff_no, data) => {
    const res = await db.query(
      "update hrs.staff s set ? where s.staff_no = " + staff_no,
      data
    );
    return res;
  },

  findEmail: async (email) => {
    const res = await db.query(
      "select * from hrs.staff where inst_mail = '" + email + "'"
    );
    return res;
  },

  // HRUNIT - HRS MODELS

  fetchHRUnit: async (page, keyword) => {
    var sql =
      "select u.*,upper(concat(s.fname,' ',s.lname)) as head_name,s.staff_no as head_no,m.title as school from utility.unit u left join hrs.staff s on u.head = s.staff_no left join utility.unit m on u.lev2_id = m.id";
    var cql =
      "select count(*) as total from utility.unit u left join hrs.staff s on u.head = s.staff_no left join utility.unit m on u.lev2_id = m.id";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql += ` where u.title like '%${keyword}%' or u.code like '%${keyword}%' or u.location like '%${keyword}%' or u.head = '${keyword}'`;
      cql += ` where u.title like '%${keyword}%' or u.code like '%${keyword}%' or u.location like '%${keyword}%' or u.head = '${keyword}'`;
    }

    sql += ` order by u.title`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  insertHRUnit: async (data) => {
    const res = await db.query("insert into utility.unit set ?", data);
    return res;
  },

  updateHRUnit: async (id, data) => {
    const res = await db.query(
      "update utility.unit set ? where id = " + id,
      data
    );
    return res;
  },

  deleteHRUnit: async (id) => {
    var res = await db.query("delete from utility.unit where id = " + id);
    return res;
  },

  // HRUNIT - HRS MODELS

  fetchHRJob: async (page, keyword) => {
    var sql = "select j.* from hrs.job j";
    var cql = "select count(*) as total from hrs.job j";

    const size = 10;
    const pg = parseInt(page);
    const offset = pg * size || 0;

    if (keyword) {
      sql +=
        " where j.title like '%${keyword}%' or j.`type` like '%${keyword}%'";
      cql +=
        " where j.title like '%${keyword}%' or j.`type` like '%${keyword}%'";
    }

    sql += ` order by j.title`;
    sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`;

    const ces = await db.query(cql);
    const res = await db.query(sql);
    const count = Math.ceil(ces[0].total / size);

    return {
      totalPages: count,
      totalData: ces[0].total,
      data: res,
    };
  },

  insertHRJob: async (data) => {
    const res = await db.query("insert into hrs.job set ?", data);
    return res;
  },

  updateHRJob: async (id, data) => {
    const res = await db.query("update hrs.job set ? where id = " + id, data);
    return res;
  },

  deleteHRJob: async (id) => {
    var res = await db.query("delete from hrs.job where id = " + id);
    return res;
  },

  // EVS MODELS

  fetchEvsData: async (id, tag) => {
    var data = {};
    // Portfolio data
    var res = await db.query(
      "select * from vote.portfolio where status = 1 and election_id = " + id
    );
    if (res && res.length > 0) data.portfolios = res;
    // Candidate data
    var res = await db.query(
      "select c.*,p.name as portfolio,p.id as pid from vote.candidate c left join vote.portfolio p on c.portfolio_id = p.id where c.status = 1 and p.election_id = " +
        id
    );
    if (res && res.length > 0) data.candidates = res;
    // Election data
    var res = await db.query(
      "select e.*,v.vote_status,vote_time,vote_sum from vote.election e left join vote.elector v on e.id = v.election_id where e.id = " +
        id +
        " and v.tag = '" +
        tag +
        "'"
    );
    if (res && res.length > 0) data.election = res;
    // Voters data
    var res = await db.query(
      "select * from vote.elector where election_id = " + id
    );
    if (res && res.length > 0) data.electors = res;

    return data;
  },

  fetchEvsMonitor: async (id) => {
    var data = {};
    // Portfolio data
    var res = await db.query(
      "select * from vote.portfolio where status = 1 and election_id = " + id
    );
    if (res && res.length > 0) data.portfolios = res;
    // Candidate data
    var res = await db.query(
      "select c.*,p.name as portfolio from vote.candidate c left join vote.portfolio p on c.portfolio_id = p.id where c.status = 1 and p.election_id = " +
        id
    );
    if (res && res.length > 0) data.candidates = res;
    // Election data
    var res = await db.query("select * from vote.election where id = " + id);
    if (res && res.length > 0) data.election = res;
    // Voters data
    var res = await db.query(
      "select * from vote.elector where election_id = " + id
    );
    if (res && res.length > 0) data.electors = res;

    return data;
  },

  fetchEvsReceipt: async (id, tag) => {
    // Voters data
    let data = {},
      selections = [];
    var res = await db.query(
      "select * from vote.elector where election_id = " + id
    );
    if (res && res.length > 0) data.electors = res;
    var res = await db.query(
      "select * from vote.elector where election_id = " +
        id +
        " and tag = '" +
        tag +
        "'"
    );
    if (res && res.length > 0) {
      const candidates = res[0].vote_sum && res[0].vote_sum.split(",");
      if (candidates) {
        for (const candid of candidates) {
          var cs = await db.query(
            "select c.*,p.name as portfolio from vote.candidate c left join vote.portfolio p on c.portfolio_id = p.id where p.election_id = " +
              id +
              " and c.id = " +
              candid
          );
          if (cs && cs.length > 0) selections.push(cs[0]);
        }
      }
    }
    return { ...data, selections };
  },

  fetchEvsRegister: async (id) => {
    // Voters data
    let data = {},
      electors = [];
    var vs = await db.query(
      "select * from vote.elector where election_id = " + id
    );
    var res = await db.query("select * from vote.election where id = " + id);
    if (res && res.length > 0) {
      const voters =
        (res[0].voters_whitelist && JSON.parse(res[0].voters_whitelist)) || [];
      const voters_data =
        (res[0].voters_whitedata && JSON.parse(res[0].voters_whitedata)) || [];
      const { group_id } = res[0];
      // electors = voters;
      if (voters.length > 0 && voters.length != voters_data.length) {
        for (const tag of voters) {
          let sql;
          if (group_id === 2)
            sql = `select s.staff_no as tag,concat(s.fname,ifnull(concat(' ',s.mname),' '),' ',s.lname) as name,s.inst_mail as mail from hrs.staff s where s.staff_no = ?`;
          if (group_id === 1)
            sql = `select s.refno as tag,s.name,s.inst_email as mail from ais.fetchstudents s where s.refno = ?`;
          const ss = await db.query(sql, [tag]);
          if (ss && ss.length > 0) electors.push(ss[0]);
        }
        // Update Voters_whitedata
        await db.query(
          "update vote.election set voters_whitedata = ?, voters_count = ? where id = ?",
          [JSON.stringify(electors), electors.length, id]
        );
      } else if (voters_data.length > 0) {
        electors = voters_data;
      }

      if (vs && vs.length > 0) {
        electors = electors.map((row) => {
          const tag = row.tag;
          const vf = vs.find((r) => r.tag == tag);
          if (vf) return { ...row, voted: 1 };
          return { ...row, voted: 0 };
        });
      }
    }

    return { ...(res && res[0]), electors };
  },

  postEvsData: async (data) => {
    const { id, tag, votes, name } = data;

    // START TRANSACTION
    //await db.query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
    //await db.beginTransaction();
    try {
      // Get Portfolio count & Verify whether equal to data posted
      var res = await db.query(
        "select * from vote.portfolio where status = 1 and election_id = " + id
      );
      if (res && res.length > 0) {
        const count = res.length;
        var vt = await db.query(
          "select * from vote.elector where election_id = " +
            id +
            " and trim(tag) = '" +
            tag +
            "' and vote_status = 1"
        );
        if (vt && vt.length <= 0) {
          if (count == Object.values(votes).length) {
            // Update Candidate Votes Count
            const vals = Object.values(votes);
            var update_count = 0;
            if (vals.length > 0) {
              for (var val of vals) {
                const cs = await db.query(
                  "select * from vote.candidate where id = " + val
                );
                if (cs && cs.length > 0) {
                  const ups = await db.query(
                    "update vote.candidate set votes = (votes+1) where id = " +
                      val
                  );
                  if (ups.affectedRows > 0) update_count += 1;
                }
              }
            }

            if (count != update_count) {
              throw new Error(`Votes partially received`);
              //return { success: false, msg: 'Votes partially recorded', code: 1001 }
            }
            // Insert Into Elector Database
            const dm = {
              vote_status: 1,
              vote_sum: Object.values(votes).join(","),
              vote_time: new Date(),
              name,
              tag,
              election_id: id,
            };
            const ins = await db.query("insert into vote.elector set ?", dm);

            if (ins && ins.insertId > 0) {
              //await db.commit();
              return { success: true, msg: "Voted successfully", code: 1000 };
            } else {
              throw new Error(`Votes saved for elector`);
              //return { success: false, msg: 'Votes saved for elector', code: 1002 }
            }
          } else {
            // Votes Not Received
            throw new Error(`Votes partially received`);
            //return { success: false, msg: 'Votes partially received', code: 1003 }
          }
        } else {
          // Voted Already
          throw new Error(`Elector already voted`);
          //return { success: false, msg: 'Elector already voted', code: 1004 }
        }
      } else {
        throw new Error(`Portfolio not found`);
        //return { success: false, msg: 'Portfolio not found', code: 1005 }
      }
    } catch (e) {
      //db.rollback();
      //console.info('Rollback successful');
      return {
        success: false,
        msg: e?.getMessage() || "Please re-submit again",
        code: 1004,
      };
    }
  },

  updateEvsControl: async (id, data) => {
    const sql = "update vote.election set ? where id = " + id;
    const res = await db.query(sql, data);
    return res;
  },

  removeVoter: async (id, tg) => {
    // Voters data
    let data = {},
      electors = [];
    var gs = await db.query(
      "select * from vote.elector where tag = '" +
        tg +
        "' and election_id = " +
        id
    );
    var vs = await db.query(
      "select * from vote.elector where election_id = " + id
    );
    var res = await db.query("select * from vote.election where id = " + id);
    console.log(gs);
    if (res && res.length > 0 && gs.length <= 0) {
      var voters =
        (res[0].voters_whitelist && JSON.parse(res[0].voters_whitelist)) || [];
      const { group_id } = res[0];
      // electors = voters;
      if (voters.length > 0) {
        voters = voters.filter((r) => r != tg);
        for (const tag of voters) {
          let sql;
          if (group_id === 2)
            sql = `select s.staff_no as tag,concat(s.fname,ifnull(concat(' ',s.mname),' '),' ',s.lname) as name,s.inst_mail as mail from hrs.staff s where s.staff_no = ?`;
          if (group_id === 1)
            sql = `select s.refno as tag,s.name,s.inst_email as mail from ais.fetchstudents s where s.refno = ?`;
          const ss = await db.query(sql, [tag]);
          if (ss && ss.length > 0) electors.push(ss[0]);
        }
        // Update Voters_whitedata
        await db.query(
          "update vote.election set voters_whitelist = ?, voters_whitedata = ?, voters_count = ? where id = ?",
          [
            JSON.stringify(voters),
            JSON.stringify(electors),
            electors.length,
            id,
          ]
        );
      }

      if (vs && vs.length > 0) {
        electors = electors.map((row) => {
          const tag = row.tag;
          const vf = vs.find((r) => r.tag == tag);
          if (vf) return { ...row, voted: 1 };
          return { ...row, voted: 0 };
        });
      }
      return { ...(res && res[0]), electors };
    } else {
      return null;
    }
  },

  addVoter: async (id, tg) => {
    // Voters data
    let data = {},
      electors = [];
    var gs = await db.query(
      "select * from vote.elector where tag = '" +
        tg +
        "' and election_id = " +
        id
    );
    var vs = await db.query(
      "select * from vote.elector where election_id = " + id
    );
    var res = await db.query("select * from vote.election where id = " + id);
    console.log(gs);
    if (res && res.length > 0 && gs.length <= 0) {
      var voters =
        (res[0].voters_whitelist && JSON.parse(res[0].voters_whitelist)) || [];
      const { group_id } = res[0];
      voter = voters.find((r) => r == tg);
      // electors = voters;
      if (voters.length > 0 && !voter) {
        voters.unshift(tg);
        for (const tag of voters) {
          let sql;
          if (group_id === 2)
            sql = `select s.staff_no as tag,concat(s.fname,ifnull(concat(' ',s.mname),' '),' ',s.lname) as name,s.inst_mail as mail from hrs.staff s where s.staff_no = ?`;
          if (group_id === 1)
            sql = `select s.refno as tag,s.name,s.inst_email as mail from ais.fetchstudents s where s.refno = ?`;
          const ss = await db.query(sql, [tag]);
          if (ss && ss.length > 0) electors.push(ss[0]);
        }
        // Update Voters_whitedata
        await db.query(
          "update vote.election set voters_whitelist = ?, voters_whitedata = ?, voters_count = ? where id = ?",
          [
            JSON.stringify(voters),
            JSON.stringify(electors),
            electors.length,
            id,
          ]
        );

        if (vs && vs.length > 0) {
          electors = electors.map((row) => {
            const tag = row.tag;
            const vf = vs.find((r) => r.tag == tag);
            if (vf) return { ...row, voted: 1 };
            return { ...row, voted: 0 };
          });
        }
        return { ...(res && res[0]), electors };
      } else {
        return null;
      }
    } else {
      return null;
    }
  },

  removePortfolio: async (id) => {
    var res = await db.query("delete from vote.portfolio where id = " + id);
    return res;
  },

  insertPortfolio: async (data) => {
    var res = await db.query("insert into vote.portfolio set ?", data);
    return res;
  },

  updatePortfolio: async (id, data) => {
    var res = await db.query(
      "update vote.portfolio set ? where id = " + id,
      data
    );
    return res;
  },

  // HELPERS

  fetchFMShelpers: async () => {
    const progs = await db.query(
      "select * from utility.program where status = 1"
    );
    const bankacc = await db.query(
      "select * from fms.bankacc where status = 1"
    );
    const sessions = await db.query(
      "select * from utility.session where status = 1 order by id desc"
    );
    //const resm = await db.query("select s.session_id as `sessionId`,s.title as `sessionName` from P06.session s where s.status = 1");
    if (progs && progs.length > 0)
      return { programs: progs, bankacc, sessions };
    return null;
  },

  fetchAIShelpers: async () => {
    const progs = await db.query(
      "select * from utility.program where status = 1"
    );
    const majs = await db.query(
      "select m.*,p.short as program_name,p.code from ais.major m left join utility.program p on m.prog_id = p.id where m.status = 1"
    );
    const depts = await db.query(
      "select * from utility.unit where type = 'ACADEMIC' and level = '3' and active = '1'"
    );
    const courses = await db.query(
      "select * from utility.course where status = 1 order by title"
    );
    const sessions = await db.query(
      "select *,date_format(admission_date,'%m%y') as admission_code from P06.session where status = 1"
    );
    //const resm = await db.query("select s.session_id as `sessionId`,s.title as `sessionName` from P06.session s where s.status = 1");
    if (progs && majs)
      return {
        programs: progs,
        majors: majs,
        departments: depts,
        courses,
        sessions,
      };
    return null;
  },

  fetchHRShelpers: async () => {
    const countries = await db.query(
      "select * from utility.country where status = 1"
    );
    const regions = await db.query(
      "select * from utility.region where status = 1"
    );
    const units = await db.query(
      "select * from utility.unit where active = '1'"
    );
    const jobs = await db.query("select * from hrs.job where active = '1'");
    const parents = await db.query(
      "select * from utility.unit where active = '1'"
    );
    const schools = await db.query(
      "select * from utility.unit where level = '2' and active = '1'"
    );
    const depts = await db.query(
      "select * from utility.unit where level = '3' and active = '1'"
    );
    const roles = await db.query(
      "select a.arole_id,a.role_name,a.role_desc,p.app_name from identity.app_role a left join identity.app p on a.app_id = p.app_id"
    );

    if (jobs && units)
      return {
        units,
        jobs,
        countries,
        regions,
        parents,
        schools,
        depts,
        roles,
      };
    return null;
  },

  fetchAMShelpers: async () => {
    const vendors = await db.query("select * from P06.vendor where status = 1");
    const session = await db.query(
      "select * from P06.session where status = 1"
    );
    const calendars = await db.query(
      "select * from utility.session where `default` = 1"
    );
    const programs = await db.query(
      "select * from utility.program where status = 1"
    );
    const majors = await db.query(
      "select m.*,p.`short` as program_name from ais.major m left join utility.program p on p.id = m.prog_id where m.status = 1"
    );
    const stages = await db.query("select * from P06.stage where status = 1");
    const applytypes = await db.query(
      "select * from P06.apply_type where status = 1"
    );
    const letters = await db.query("select * from P06.letter where status = 1");
    var adm_programs = await db.query(
      "select m.title as major_name,m.id as major_id,p.`short` as program_name,p.id as prog_id from ais.major m join utility.program p on m.prog_id = p.id union select null as major_name, null as major_id, `short` as program_name, id as prog_id from utility.program where flag_majors = 0"
    );
    if (adm_programs && adm_programs.length > 0) {
      adm_programs = adm_programs.map((row, i) => {
        row.id = i + 1;
        return row;
      });
    }
    const countries = await db.query(
      "select code_name,title from utility.country where status = 1 order by title asc"
    );
    if (vendors && programs && stages && session && majors && applytypes)
      return {
        vendors,
        programs,
        majors,
        stages,
        applytypes,
        session: session && session[0],
        adm_programs,
        countries,
        letters,
        calendars,
      };
    return null;
  },

  // UTILITY
};
