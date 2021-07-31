const moment =  require('moment');
var db = require('../../config/mysql');

module.exports.SSO = {
   
   verifyUser : async ({username,password}) => {
      const sql = "select u.* from identity.user u where u.username = '"+username+"' and password = '"+password+"'";
      const res = await db.query(sql);
      return res;
   },


   fetchRoles : async (uid) => {
      const sql = "select u.arole_id,a.role_name,a.role_desc,x.app_name,x.app_tag from identity.user_role u left join identity.app_role a on u.arole_id = a.arole_id left join identity.app x on a.app_id = x.app_id where u.uid = "+uid;
      const res = await db.query(sql);
      return res;
   },

   fetchPhoto : async (uid) => {
      const sql = "select p.tag,p.path from identity.photo p where p.uid = "+uid+" or p.tag = '"+uid+"'";
      const res = await db.query(sql);
      return res;
   },

   fetchUser : async (uid,gid) => {
      var sql;
      switch(gid){
        case '01': // Student
           sql = "select from identity.photo p where p.uid = "+uid; break;
        case '02': // Staff
           sql = "select s.*,j.title as designation,x.long_name as unitname from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.promotion p on s.promo_id = p.id left join hrs.job j on j.id = p.job_id left join utility.unit x on p.unit_id = x.id where u.uid = "+uid; break;
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

   // VOUCHER MODELS

   fetchVouchers : async (session_id) => {
      const res = await db.query("select v.*,x.vendor_name,g.title as group_name,case when v.sell_type = 0 then g.title when v.sell_type = 1 then 'MATURED' when v.sell_type = 2 then 'INTERNATIONAL' end as group_title from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where session_id = "+session_id+" order by serial asc,vendor_id asc, applicant_name asc");
      return res;
   },

   fetchVouchersByType : async (session_id,sell_type) => {
      const res = await db.query("select v.*,x.vendor_name,g.title as group_name,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from voucher v left join vendor x on v.vendor_id = x.vendor_id left join `group` g on v.group_id = g.group_id where session_id = "+session_id+" and sell_type = "+sell_type+" order by serial asc,vendor_id asc, applicant_name asc");
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



};

