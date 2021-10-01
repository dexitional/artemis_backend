var db = require('../../config/mysql');

module.exports.API = {
   
   fetchServices : async () => {
      const sql = "select id as serviceId,title as serviceName from fms.transtype where status = 1 and visibility = 'PUBLIC'";
      const res = await db.query(sql);
      return res;
   },

   verifyUserByEmail : async ({email}) => {
      const sql = "select u.* from identity.user u where u.username = '"+email+"'";
      const res = await db.query(sql);
      return res;
   },

   

   fetchRoles : async (uid) => {
      const sql = "select u.arole_id,a.role_name,a.role_desc,x.app_name,x.app_tag from identity.user_role u left join identity.app_role a on u.arole_id = a.arole_id left join identity.app x on a.app_id = x.app_id where u.uid = "+uid;
      const res = await db.query(sql);
      return res;
   },

   fetchPhoto : async (uid) => {
      const sql = "select p.tag,p.path from identity.photo p where p.uid = '"+uid+"' or p.tag = '"+uid+"'";
      const res = await db.query(sql);
      return res;
   },

   fetchSSOUser : async (tag) => {
      const sql = "select u.*,p.photo_id from identity.user u left join identity.photo p on p.uid = u.uid where u.tag = '"+tag+"'";
      const res = await db.query(sql);
      return res;
   },

   insertPhoto : async (uid,tag,group_id,path) => {
      const sql = "insert into identity.photo(uid,tag,path,group_id) values("+uid+",'"+tag+"','"+path+"',"+group_id+")";
      const res = await db.query(sql);
      return res;
   },

   updatePhoto : async (pid,path) => {
      const sql = "update identity.photo set path = '"+path+"' where photo_id = "+pid;
      const res = await db.query(sql);
      return res;
   },

   fetchUser : async (uid,gid) => {
      var sql;
      switch(gid){
        case '01': // Student
           sql = "select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and u.uid = "+uid; break;
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

   fetchUserByPhone : async (phone) => {
        // Student
        const res1 = await db.query("select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end,u.username,u.uid,u.group_id,u.group_id as gid from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and s.phone = "+phone);
        // Staff
        const res2 = await db.query("select s.*,j.title as designation,x.long_name as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,u.username,u.uid,u.group_id,u.group_id as gid from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.promotion p on s.promo_id = p.id left join hrs.job j on j.id = p.job_id left join utility.unit x on p.unit_id = x.id where s.phone = "+phone);
        // NSS
        // Applicant (Job)
        // Alumni
        if(res1 && res1.length > 0) return res1
        if(res2 && res2.length > 0) return res2
   },

   updateUserByEmail : async (email,data) => {
      const sql = "update identity.user set ? where username = '"+email+"'";
      const res = await db.query(sql,data);
      return res;
   },

   logger : async (uid,action,meta) => {
      const data = { uid, title: action, meta: JSON.stringify(meta) }
      const res = await db.query("insert into identity.`activity` set ?", data);
      return res;
   },

   
   // SESSION MODELS

   fetchSessions : async () => {
      const res = await db.query("select * from session order by session_id desc");
      return res;
   },

   insertSession : async (data) => {
      const res = await db.query("insert into session set ?", data);
      return res;
   },

   updateSession : async (session_id,data) => {
      const res = await db.query("update session set ? where session_id = "+session_id,data);
      return res;
   },

   deleteSession : async (session_id) => {
      const res = await db.query("delete from session where session_id = "+session_id);
      return res;
   },

   setDefaultSession : async (session_id) => {
      await db.query("update session set status = 0");
      const res = await db.query("update session set status = 1 where session_id ="+session_id);
      return res;
   },


   // VENDOR MODELS

   fetchVendors : async () => {
      const res = await db.query("select * from vendor order by vendor_id desc");
      return res;
   },

   insertVendor : async (data) => {
      const res = await db.query("insert into vendor set ?", data);
      return res;
   },

   updateVendor : async (vendor_id,data) => {
      const res = await db.query("update vendor set ? where vendor_id = "+vendor_id,data);
      return res;
   },

   deleteVendor : async (vendor_id) => {
      const res = await db.query("delete from vendor where vendor_id = "+vendor_id);
      return res; 
   },

   // VOUCHER - AMS MODELS

   fetchVouchers : async (session_id,page,keyword) => {
      var sql = "select v.*,x.vendor_name,g.title as group_name,case when v.sell_type = 0 then g.title when v.sell_type = 1 then 'MATURED' when v.sell_type = 2 then 'INTERNATIONAL' end as group_title from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where session_id = "+session_id
      var cql = "select count(*) as total from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where session_id = "+session_id;
      
      const size = 3;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` and v.serial = '${keyword}' or v.applicant_name like '%${keyword}%' or v.applicant_phone = '${keyword}'`
          cql += ` and v.serial = '${keyword}' or v.applicant_name like '%${keyword}%' or v.applicant_phone = '${keyword}'`
      }

      sql += ` order by serial asc,vendor_id asc, applicant_name asc`
      sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`
      
      const ces = await db.query(cql);
      const res = await db.query(sql);
      const count = Math.ceil(ces[0].total/size)

      return {
         totalPages: count,
         totalData: ces[0].total,
         data: res,
      }
   },

   fetchVouchersByType : async (session_id,sell_type) => {
      const res = await db.query("select v.*,x.vendor_name,g.title as group_name,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where session_id = "+session_id+" and sell_type = "+sell_type+" order by serial asc,vendor_id asc, applicant_name asc");
      return { data:res };
   },

   fetchVoucherBySerial : async (serial) => {
      const res = await db.query("select v.*,x.vendor_name,g.title as group_name,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where serial = "+serial);
      return res;
   },

   fetchVoucherByPhone: async (phone) => {
      const res = await db.query("select v.*,x.vendor_name,g.title as group_name,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where v.applicant_phone = '"+phone.trim()+"'");
      return res;
   },

   insertVoucher : async (data) => {
      const res = await db.query("insert into voucher set ?", data);
      return res;
   },

   updateVoucher : async (serial,data) => {
      const res = await db.query("update voucher set ? where serial = "+serial,data);
      return res;
   },

   deleteVoucher : async (serial) => {
      const res = await db.query("delete from voucher where serial = "+serial);
      return res;
   },

   getLastVoucherIndex : async (session) => {
      const res = await db.query("select serial from voucher where session_id = "+session+" order by serial desc limit 1");
      if(res && res.length > 0) return res[0].serial;
      const algo = `${moment().format('YY')}${ parseInt(moment().format('YY'))+parseInt(moment().format('MM'))}${1000}`
      return parseInt(algo)
   },


   // APPLICANTS - AMS MODELS

   fetchApplicants : async (session_id,page,keyword) => {
      var sql = "select p.serial,p.started_at,p.photo,concat(i.fname,' ',i.lname) as name,v.sell_type,i.gender,p.flag_submit,r.`short` as choice_name,g.title as group_name,v.group_id from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join step_choice c on p.serial = c.serial left join utility.program r on r.id = c.program_id left join `group` g on v.group_id = g.group_id where v.session_id = "+session_id
      var cql = "select count(*) as total from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join step_choice c on p.serial = c.serial left join utility.program r on r.id = c.program_id left join `group` g on v.group_id = g.group_id where v.session_id = "+session_id
      
      const size = 3;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` and p.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%'`
          cql += ` and p.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%'`
      }

      sql += ` order by p.serial asc, c.choice_id asc`
      sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`
      
      const ces = await db.query(cql);
      const res = await db.query(sql);
      const count = Math.ceil(ces[0].total/size)

      return {
         totalPages: count,
         totalData: ces[0].total,
         data: res,
      }
   },

   fetchApplicantsByType : async (session_id,sell_type) => {
      const res = await db.query("select p.serial,p.started_at,p.photo,concat(i.fname,' ',i.lname) as name,v.sell_type,i.gender,p.flag_submit,r.`short` as choice_name,g.title as group_name,v.group_id,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join step_choice c on p.serial = c.serial left join utility.program r on r.id = c.program_id left join `group` g on v.group_id = g.group_id where v.session_id = "+session_id+" and v.sell_type = "+sell_type+" order by p.serial asc");
      return { data:res };
   },


    // STUDENTS - AIS MODELS

    fetchStudents : async (page,keyword) => {
      var sql = "select s.*,u.uid,u.flag_locked,u.flag_disabled,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(s.mname,' '),''),s.lname) as name from ais.student s left join identity.user u on s.refno = u.tag left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id"
      var cql = "select count(*) as total from ais.student s left join identity.user u on s.refno = u.tag left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.refno = '${keyword}' or s.indexno = '${keyword}'`
          cql += ` where s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.refno = '${keyword}' or s.indexno = '${keyword}'`
      }

      sql += ` order by s.complete_status asc,s.prog_id asc,s.lname asc, s.fname asc`
      sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`
      
      const ces = await db.query(cql);
      const res = await db.query(sql);
      const count = Math.ceil(ces[0].total/size)

      return {
         totalPages: count,
         totalData: ces[0].total,
         data: res,
      }
   },



};

