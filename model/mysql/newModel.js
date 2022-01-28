const moment =  require('moment');
const email = require('../../config/email');
var db = require('../../config/mysql');
const sha1 = require('sha1')
const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwzyx', 8)
const Student = require('../../model/mysql/studentModel');
const { getUsername } = require('../../middleware/util');
//const SSO = require('../../model/mysql/newModel')

module.exports = {
   
    
   verifyUser : async ({ username,password }) => {
      const sql = "select u.* from identity.user u where u.username = '"+username+"' and password = sha1('"+password+"')";
      const res = await db.query(sql);
      return res;
   },

   verifyUserByEmail : async ({ email }) => {
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
      //const sql = "select p.tag,p.path from identity.photo p where p.uid = '"+uid+"' or p.tag = '"+uid+"'";
      const sql = "select p.tag,p.path from identity.photo p where p.tag = '"+uid+"'";
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
           sql = "select s.*,j.title as designation,x.title as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,c.title as countryname, r.title as regioname,u.uid from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.job j on j.id = s.job_id left join utility.unit x on s.unit_id = x.id left join utility.region r on r.id = s.region_id left join utility.country c on c.id = s.country_id where u.uid = "+uid; break;
        case '03': // NSS
           sql = "select from identity.photo p where p.uid = "+uid; break;
        case '04': // Applicant (Job)
           sql = "select from identity.photo p where p.uid = "+uid; break;
        case '05': // Alumni
           sql = "select from identity.photo p where p.uid = "+uid; break;
        default :  // Staff
           sql = "select s.*,j.title as designation,x.title as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,c.title as countryname, r.title as regioname,u.uid from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.job j on j.id = s.job_id left join utility.unit x on s.unit_id = x.id left join utility.region r on r.id = s.region_id left join utility.country c on c.id = s.country_id where u.uid = "+uid; break;
      } const res = await db.query(sql);
        return res;
   },

   fetchUserByPhone : async (phone) => {
        // Student
        const res1 = await db.query("select s.*,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name, x.title as session_name,x.academic_year as session_year,x.academic_sem as session_semester,x.id as session_id,x.cal_register_start,x.cal_register_end,u.username,u.uid,u.group_id,u.group_id as gid from identity.user u left join ais.student s on u.tag = s.refno left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and s.phone = "+phone);
        // Staff
        const res2 = await db.query("select s.*,j.title as designation,x.title as unitname,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name,u.username,u.uid,u.group_id,u.group_id as gid from identity.user u left join hrs.staff s on u.tag = s.staff_no left join hrs.job j on j.id = s.job_id left join utility.unit x on s.unit_id = x.id where s.phone = "+phone);
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

   insertSSOUser : async (data) => {
      const sql = "insert into identity.user set ?";
      const res = await db.query(sql,data);
      return res;
   },

   insertSSORole : async (data) => {
      const sql = "insert into identity.user_role set ?";
      const res = await db.query(sql,data);
      return res;
   },

   deleteSSORole : async (uid,role) => {
      const sql = "delete from identity.user_role where uid = "+uid+" and arole_id = "+role;
      const res = await db.query(sql);
      return res;
   },
   

   logger : async (uid,action,meta) => {
      const data = { uid, title: action, meta: JSON.stringify(meta) }
      const res = await db.query("insert into identity.`activity` set ?", data);
      return res;
   },

   apilogger : async (ip,action,meta) => {
      const data = { ip, title: action, meta: JSON.stringify(meta) }
      const res = await db.query("insert into fms.`activity_api` set ?", data);
      return res;
   },

   applicantlogger : async (serial,action,meta) => {
      const data = { serial, title: action, meta: JSON.stringify(meta) }
      const res = await db.query("insert into P06.`activity_applicant` set ?", data);
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
      const res = await db.query("select * from vendor order by vendor_id");
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
      
      const size = 20;
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

   fetchVoucherGroups : async () => {
      const res = await db.query("select p.price_id as formId,p.title as formName,p.currency,p.amount as serviceCharge from P06.price p where p.status = 1");
      const resm = await db.query("select s.session_id as `sessionId`,s.title as `sessionName` from P06.session s where s.status = 1");
      if(res && res.length > 0 && resm && resm.length > 0) return {...resm[0],forms:[...res]}
      return null;
   },

   fetchSMSFailedVouchers: async () => {
      const res = await db.query("select * from fms.voucher_log where sms_code > 1000");
      if(res && res.length > 0) return res[0]
      return null;
   },

   resendVoucherBySms: async (serial) => {
      const res = await db.query("select * from fms.voucher_log where serial = "+serial);
      if(res && res.length > 0) return res[0]
      return null;
   },


   updateVoucherLogBySerial: async (serial,data) => {
      const res = await db.query("update fms.voucher_log set ? where serial = "+serial,data);
      return res;
   },


   sellVoucher : async (formId,collectorId,sessionId,buyerName,buyerPhone,tid) => {
      const pr = await db.query("select * from P06.price p where p.price_id = "+formId);
      const vd = await db.query("select c.vendor_id from fms.collector c left join P06.vendor v on c.vendor_id = v.vendor_id where c.id = "+collectorId);
      if(pr && vd){
        const vc = await db.query("select serial,pin from P06.voucher where vendor_id = "+vd[0].vendor_id+" and session_id ="+sessionId+" and group_id = '"+pr[0].group_id+"' and sell_type = "+pr[0].sell_type+" and sold_at is null");
        if(vc && vc.length > 0){
            // Update Voucher Status & Buyer Details
            const dm = { applicant_name: buyerName, applicant_phone: buyerPhone, sold_at: new Date()}
            const ups = await db.query("update P06.voucher set ? where serial = "+vc[0].serial,dm);
            if(ups.affectedRows > 0) {    
               const isIn = await db.query("select * from fms.voucher_log where tid = "+tid+" and session_id = "+sessionId)
               if(isIn && isIn.length > 0){
                  // Update Voucher Sales Log - Success
                  const vlog = { serial:vc[0].serial,pin:vc[0].pin,generated:1 }
                  const vins = await db.query("update fms.voucher_log set ? where tid = "+tid+" and session_id = "+sessionId,vlog);
                  return { ...vc[0],logId:vins.insertId }
               }else{
                  // Insert Voucher Sales Log - Success
                  const vlog = { tid,session_id:sessionId,serial:vc[0].serial,pin:vc[0].pin,buyer_name:buyerName,buyer_phone:buyerPhone,generated:1 }
                  const vins = await db.query("insert into fms.voucher_log set ? ",vlog);
                  return { ...vc[0],logId:vins.insertId }
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
        }else{
          
           // Insert Voucher Sales Log - Error
           const isIn = await db.query("select * from fms.voucher_log where tid = "+tid+" and session_id = "+sessionId)
           if(isIn && isIn.length == 0){
               // Insert Voucher Sales Log - Success
               const vlog = { tid,session_id:sessionId,serial:null,pin:null,buyer_name:buyerName,buyer_phone:buyerPhone,generated:0 }
               const vins = await db.query("insert into fms.voucher_log set ? ",vlog);
           }   return null
        }
      }else{
         // Insert Voucher Sales Log - Error
         const isIn = await db.query("select * from fms.voucher_log where tid = "+tid+" and session_id = "+sessionId)
         if(isIn && isIn.length == 0){
             // Insert Voucher Sales Log - Success
             const vlog = { tid,session_id:sessionId,serial:null,pin:null,buyer_name:buyerName,buyer_phone:buyerPhone,generated:0 }
             const vins = await db.query("insert into fms.voucher_log set ? ",vlog);
         }   return null
      }
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
      const res = await db.query("select serial from P06.voucher where session_id = "+session+" order by serial desc limit 1");
      if(res && res.length > 0) return res[0].serial;
      const sess = await db.query("select voucher_index from P06.session where session_id = "+session);
      const algo = `${moment().format('YY')}${ parseInt(moment().format('YY'))+parseInt(moment().format('MM'))}${1000}`
      //return parseInt(algo)
      return sess && sess[0].voucher_index;
   },

   updateVoucherLog : async (id,data) => {
      const res = await db.query("update fms.voucher_log set ? where id = "+id,data);
      return res;
   },

  


   // APPLICANTS - AMS MODELS

   fetchApplicants : async (page,keyword) => {
      var sid = await db.query("select session_id from P06.session where status = 1")
      if(sid && sid.length > 0){
         var sql = "select p.serial,p.started_at,p.photo,p.flag_submit,p.grade_value,p.class_value,ifnull(convert(i.phone,CHAR),convert(v.applicant_phone,CHAR)) as phone,ifnull(concat(i.fname,' ',i.lname),concat('Buyer: ',v.applicant_name)) as name,i.dob,v.sell_type,i.gender,p.flag_submit,g.title as group_name,v.group_id,a.title as applytype,(select concat(r1.`short`,ifnull(concat(' ( ',m1.title,' ) '),'')) as choice_name1 from step_choice c1 left join utility.program r1 on r1.id = c1.program_id left join ais.major m1 on c1.major_id = m1.id where c1.serial = p.serial order by c1.choice_id asc limit 1) as choice_name1,(select concat(r2.`short`,ifnull(concat(' ( ',m2.title,' ) '),'')) as choice_name2 from step_choice c2 left join utility.program r2 on r2.id = c2.program_id left join ais.major m2 on c2.major_id = m2.id where c2.serial = p.serial order by c2.choice_id desc limit 1) as choice_name2 from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join `group` g on v.group_id = g.group_id left join apply_type a on a.type_id = p.apply_type left join P06.sorted s on s.serial = p.serial where s.serial is null and v.session_id = "+sid[0].session_id
         var cql = "select count(*) as total from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join `group` g on v.group_id = g.group_id left join apply_type a on a.type_id = p.apply_type where v.session_id = "+sid[0].session_id
         
         const size = 20;
         const pg  = parseInt(page);
         const offset = (pg * size) || 0;
         
         if(keyword){
            sql += ` and (p.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%')`
            cql += ` and (p.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%')`
         }

         sql += ` order by p.started_at, p.serial`
         sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`
         
         const ces = await db.query(cql);
         const res = await db.query(sql);
         const count = Math.ceil(ces[0].total/size)
         return {
            totalPages: count,
            totalData: ces[0].total,
            data: res,
         }
      }else{
         return {
            totalPages: 1,
            totalData: 0,
            data: [],
         }
      }

   },

   fetchApplicantsByType : async (sell_type) => {
      var sid = await db.query("select session_id from P06.session where status = 1")
      if(sid && sid.length > 0){
        const res = await db.query("select p.serial,p.started_at,p.photo,concat(i.fname,' ',i.lname) as name,v.sell_type,i.gender,p.flag_submit,r.`short` as choice_name,g.title as group_name,v.group_id,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join step_choice c on p.serial = c.serial left join utility.program r on r.id = c.program_id left join `group` g on v.group_id = g.group_id where v.session_id = "+sid[0].session_id+" and v.sell_type = "+sell_type+" order by p.serial asc");
        return { data:res };
      }else{
        return null;
      }
   },

   fetchDocuments : async (serial) => {
      const res = await db.query("select * from P06.step_document where serial = "+serial);
      return res;
   },

   addToSort : async (serial) => {
      var sid = await db.query("select session_id from P06.session where status = 1")
      if(sid && sid.length > 0){
         var vs = await db.query("select p.serial,p.stage_id,p.apply_type,v.sell_type,v.group_id,p.grade_value,p.class_value,p.flag_admit,(select choice_id from step_choice c1 where c1.serial = p.serial order by c1.choice_id asc limit 1) as choice1_id,(select choice_id from step_choice c2 where c2.serial = p.serial order by c2.choice_id desc limit 1) as choice2_id from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial where v.session_id = "+sid[0].session_id+" and p.serial = "+serial)
         if(vs && vs.length > 0){
           const data = { serial:serial, session_id:sid[0].session_id, group_id:vs[0].group_id, stage_id:vs[0].stage_id, apply_type:vs[0].apply_type, sell_type:vs[0].sell_type, choice1_id:vs[0].choice1_id, choice2_id:vs[0].choice2_id, grade_value:vs[0].grade_value, class_value:vs[0].class_value, flag_admit:vs[0].flag_admit, created_at: new Date() }
           const res = await db.query("insert into P06.sorted set ?", data);
           return { data:res };
         }
      }  return null;
   },


    // SORTED APPLICANTS - AMS
    
    fetchSortedApplicants : async (page,keyword) => {
      var sid = await db.query("select session_id from P06.session where status = 1")
      if(sid && sid.length > 0){
         var sql = "select h.*,concat(i.fname,' ',i.lname) as name,i.dob,i.gender,r1.`short` as choice_name1,r2.`short` as choice_name2,p.started_at,p.photo,v.sell_type,g.title as group_name,v.group_id,t.title as applytype from P06.sorted h left join step_profile i on h.serial = i.serial left join P06.applicant p on p.serial = h.serial left join voucher v on v.serial = h.serial left join step_choice c1 on h.choice1_id = c1.choice_id left join utility.program r1 on r1.id = c1.program_id left join step_choice c2 on h.choice2_id = c2.choice_id left join utility.program r2 on r2.id = c2.program_id left join `group` g on v.group_id = g.group_id left join P06.apply_type t on h.apply_type = t.type_id left join admitted a on h.serial = a.serial where a.serial is null and h.session_id = "+sid[0].session_id
         var cql = "select count(*) as total from P06.sorted h left join step_profile i on h.serial = i.serial left join P06.applicant p on p.serial = h.serial left join voucher v on v.serial = h.serial left join step_choice c1 on h.choice1_id = c1.choice_id left join utility.program r1 on r1.id = c1.program_id left join step_choice c2 on h.choice2_id = c2.choice_id left join utility.program r2 on r2.id = c2.program_id left join `group` g on v.group_id = g.group_id left join P06.apply_type t on h.apply_type = t.type_id left join admitted a on h.serial = a.serial where a.serial is null and h.session_id = "+sid[0].session_id
         
         const size = 50;
         const pg  = parseInt(page);
         const offset = (pg * size) || 0;
         
         if(keyword){
            sql += ` and h.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%' or g.title like '%${keyword}%' or r2.\`short\` like '%${keyword}%' or r1.\`short\` like '%${keyword}%' or t.title like '%${keyword}%'`
            cql += ` and h.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%' or g.title like '%${keyword}%' or r2.\`short\` like '%${keyword}%' or r1.\`short\` like '%${keyword}%' or t.title like '%${keyword}%'`
         }

         sql += ' order by r1.`short` asc'
         sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`
         
         const ces = await db.query(cql);
         const res = await db.query(sql);
         const count = Math.ceil(ces[0].total/size)

         return {
            totalPages: count,
            totalData: ces[0].total,
            data: res,
         }

      }else{
         return {
            totalPages: 0,
            totalData: 0,
            data: [],
         }
      }
   },

   fetchSortedApplicantsByType : async (session_id,sell_type) => {
      const res = await db.query("select p.serial,p.started_at,p.photo,concat(i.fname,' ',i.lname) as name,v.sell_type,i.gender,p.flag_submit,r.`short` as choice_name,g.title as group_name,v.group_id,if(v.sell_type = 0, g.title, if(v.sell_type = 1,'MATURED','INTERNATIONAL')) as group_title from applicant p left join step_profile i on p.serial = i.serial left join voucher v on v.serial = p.serial left join step_choice c on p.serial = c.serial left join utility.program r on r.id = c.program_id left join `group` g on v.group_id = g.group_id where v.session_id = "+session_id+" and v.sell_type = "+sell_type+" order by p.serial asc");
      return { data:res };
   },

   admitApplicant : async (data) => {
      console.log(data)
      // Fetch active session for acdemic session (vs )
      const vs = await db.query("select * from P06.session where status = 1")
      // Fetch step_profile [ biodata, study_mode ] (sp)
      const sp = await db.query("select * from P06.step_profile where serial = "+data.serial)
      // Fetch step_guardian [ biodata] (sg)
      const sg = await db.query("select * from P06.step_guardian where serial = "+data.serial)
      // Fetch Program Info
      const pg = await db.query("select * from utility.program where id = "+data.program_id)
      
      if(sg && sp && vs && vs.length > 0 && sp.length > 0 && sg.length > 0){
         
         // Fetch fms.billinfo for bill_id for freshers bill (bl)
         var bl,bql; 
         if(sp[0].resident_country == 84 || sp[0].resident_country == 'GH'){
            const group_code = data.start_semester > 1 ? '0100,0101,0110,0111,1100,1101,1110,1111':'1000,1001,1010,1011,1100,1101,1110,1111'
            bql = "select * from fms.billinfo where prog_id = "+data.program_id+" and session_id = "+vs[0].academic_session_id+" and group_code in ("+group_code+") and post_type = 'GH' and post_status = 1"
            bl = await db.query(bql)
         }else{
            bql = "select * from fms.billinfo where session_id = "+vs[0].academic_session_id+" and post_type = 'INT' and post_status = 1"
            bl = await db.query(bql)
         }

         const bid = bl && bl.length > 0 ? bl[0].bid : null

         // Generate Email Address
         var email,count = 1;
         const username = getUsername(sp[0].fname,sp[0].lname)
         email = `${username}@st.aucc.edu.gh`
         while(true){
            var isExist = await Student.findEmail(email)
            if(isExist && isExist.length > 0){
               count = count+1
               email = `${username}${count}@st.aucc.edu.gh`
            }else{
               break;
            }
         }
         // Generate Password
         const password = nanoid()
         // Insert into P06.admitted tbl
         const da = { serial:data.serial, admit_session:data.session_id, academ_session:vs[0].academic_session_id, group_id:data.group_id, stage_id:data.stage_id, apply_type:data.apply_type, sell_type:data.sell_type, bill_id: bid, prog_id:data.program_id, major_id:data.major_id, start_semester:data.start_semester, session_mode:sp[0].session_mode, username:email, password }
         await db.query("insert into P06.admitted set ?", da)
         // Update into P06.step_profile tbl
         const dz = { flag_admit:1 }
         await db.query("update P06.applicant set ? where serial = "+data.serial, dz)
         // Insert data into ais.student
         const dp = { refno:data.serial, fname:sp[0].fname, lname:sp[0].lname, prog_id:data.program_id, major_id:data.major_id, gender:sp[0].gender, dob:sp[0].dob, phone:sp[0].phone, email:sp[0].email, address:sp[0].resident_address, hometown:sp[0].home_town, session:sp[0].session_mode, country_id:sp[0].resident_country, semester:data.start_semester, entry_semester:data.start_semester, entry_group:(sp[0].resident_country == 84 || sp[0].resident_country == 'GH') ? 'GH':'INT', doa:vs[0].admission_date, institute_email:email, guardian_name:`${sg[0].fname} ${sg[0].lname}`, guardian_phone:sg[0].phone, religion_id:sp[0].religion, disability:sp[0].disabled  }
         await db.query("insert into ais.student set ?", dp)
         // Insert into ais.mail 
         const dm = { refno:data.serial, mail:email }
         await db.query("insert into ais.mail set ?", dm)
         // Insert data into identity.user
         const du = { group_id:1, tag:data.serial, username:email, password:sha1(password) }
         await db.query("insert into identity.user set ?", du)
         // Insert Photo into Database
         
         if(bid){
            // Insert Academic Fees or Bill charged
            const df = { session_id:vs[0].academic_session_id, bill_id:bid, refno:data.serial, narrative: bl[0].narrative, currency:bl[0].currency, amount:bl[0].amount }
            await db.query("insert into fms.studtrans set ?", df)
            // Insert Discount (Payment)
            const dj = { session_id:vs[0].academic_session_id, bill_id:bid, refno:data.serial, narrative: `DISCOUNT ON ${bl[0].narrative} FEES`, currency:bl[0].currency, amount:(-1 * bl[0].discount)}
            await db.query("insert into fms.studtrans set ?", df)
            
         }
         return { ...da,...dp,...dm,...du, program:pg[0].short, phone:sp[0].phone }

      }else{
         return null
      }
   },


    // MATRICULANTS - AMS MODELS
    
    fetchFreshers : async (page,keyword) => {
      var sid = await db.query("select session_id from P06.session where status = 1")
      if(sid && sid.length > 0){
         var sql = "select h.start_semester,h.created_at,h.serial,concat(i.fname,' ',i.lname) as name,i.dob,i.gender,i.phone,p.`short` as program_name from P06.admitted h left join ais.student i on h.serial = i.refno left join utility.program p on p.id = h.prog_id where h.admit_session = "+sid[0].session_id
         var cql = "select count(*) as total from P06.admitted h left join ais.student i on h.serial = i.refno left join utility.program p on p.id = h.prog_id where h.admit_session = "+sid[0].session_id
         
         const size = 50;
         const pg  = parseInt(page);
         const offset = (pg * size) || 0;
         
         if(keyword){
            sql += ` and h.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%' or p.\`short\` like '%${keyword}%'`
            cql += ` and h.serial = '${keyword}' or i.fname like '%${keyword}%' or i.lname like '%${keyword}%' or p.\`short\` like '%${keyword}%'`
         }

         sql += ' order by p.`short`, h.created_at'
         sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`
         
         const ces = await db.query(cql);
         const res = await db.query(sql);
         const count = Math.ceil(ces[0].total/size)

         return {
            totalPages: count,
            totalData: ces[0].total,
            data: res,
         }

      }else{
         return {
            totalPages: 0,
            totalData: 0,
            data: [],
         }
      }
   },


   fetchFreshersData : async () => {
      var sid = await db.query("select session_id from P06.session where status = 1")
      if(sid && sid.length > 0){
         var sql = "select h.start_semester,h.created_at,h.serial,concat(i.fname,' ',i.lname) as name,i.dob,i.gender,i.phone,p.`short` as program_name from P06.admitted h left join ais.student i on h.serial = i.refno left join utility.program p on p.id = h.prog_id where h.admit_session = "+sid[0].session_id
         sql += ' order by p.`short`, h.created_at'
         const res = await db.query(sql);
         return res
      }
   },


   removeFresherData : async (serial) => {
        // Delete from P06.admitted tbl
        var ins = await db.query("delete from P06.admitted where serial = "+serial)
        // Reset Flag_admit from P06.applicant tbl
        var ins = await db.query("update P06.applicant set flag_admit = 0 where serial = "+serial)
        // Delete from ais.student
        var ins = await db.query("delete from ais.student where refno = '"+serial+"'")
        // Delete from ais.mail 
        var ins = await db.query("delete from ais.mail where refno = '"+serial+"'")
        // Delete from identity.user
        var ins = await db.query("delete from identity.user where tag = '"+serial+"'")
        // Delete from Academic Fees or Bill charged
        var ins = await db.query("delete from fms.studtrans where refno = '"+serial+"'")
        if(ins) return ins
        return null
   },


   // LETTERS MODELS

   fetchLetters : async () => {
      const res = await db.query("select * from P06.letter order by id desc");
      return res;
   },

   insertLetter : async (data) => {
      const res = await db.query("insert into P06.letter set ?", data);
      return res;
   },

   updateLetter : async (id,data) => {
      const res = await db.query("update P06.letter set ? where id = "+id,data);
      return res;
   },

   deleteLetter : async (id) => {
      const res = await db.query("delete from P06.letter where id = "+id);
      return res;
   },

   setDefaultLetter : async (id) => {
      await db.query("update P06.letter set status = 0");
      const res = await db.query("update P06.letter set status = 1 where id ="+id);
      return res;
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

   insertAISStudent : async (data) => {
      const res = await db.query("insert into ais.student set ?", data);
      return res;
   },

   updateAISStudent : async (id,data) => {
      const res = await db.query("update ais.student set ? where id = "+id,data);
      return res;
   },

   deleteAISStudent : async (id) => {
      const res = await db.query("delete from ais.student where id = "+id);
      return res;
   },


   // REGISTRATIONS - AIS

   fetchRegsData : async (mode_id,page,keyword) => {
      var sql = "select r.*,s.fname,s.mname,s.lname,s.refno,x.title as session_name from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.session x on x.id = r.session_id where x.mode_id = "+mode_id
      var cql = "select count(*) as total from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.session x on x.id = r.session_id where x.mode_id = "+mode_id
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` and (s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.refno = '${keyword}' or s.indexno = '${keyword}')`
          cql += ` and (s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.refno = '${keyword}' or s.indexno = '${keyword}')`
      }

      sql += ` order by r.created_at`
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

   fetchRegsList : async (session_id,query) => {
      const { level,prog_id,major_id } = query;
      console.log(query)
      var sql;
      if(major_id && prog_id && level){
         sql = "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = "+session_id+" and (ceil(s.semester/2)*100) = "+level+" and s.prog_id ="+prog_id+" and s.major_id ="+major_id
      }else if(prog_id && level && !major_id){
         sql = "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = "+session_id+" and (ceil(s.semester/2)*100) = "+level+" and s.prog_id ="+prog_id
      }else if(major_id && level && !prog_id){
         sql = "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = "+session_id+" and (ceil(s.semester/2)*100) = "+level+" and s.major_id ="+major_id
      }else if(!major_id && level && !prog_id){
         sql = "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = "+session_id+" and (ceil(s.semester/2)*100) = "+level
      }else if(!major_id && !level && prog_id){
         sql = "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = "+session_id+" and s.prog_id ="+prog_id
      }else if(major_id && !level && !prog_id){
         sql = "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = "+session_id+" and s.major_id ="+major_id
      }else{
         sql = "select distinct r.indexno from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id where r.session_id = "+session_id
      }
      var data = []
      const res = await db.query(sql);
      if(res && res.length > 0){
         for(var r of res){
            const resm = await db.query("select r.*,s.fname,s.mname,s.lname,s.refno, ceil(s.semester/2)*100 as level,x.title as session_name,p.`short` as program_name, m.title as major_name from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.program p on s.prog_id = p.id left join ais.major m on m.id = s.major_id left join utility.session x on x.id = r.session_id where r.indexno = '"+r.indexno+"' and r.session_id = "+session_id+" order by r.id desc limit 1");
            if(resm && resm.length > 0) data.push(resm[0])
         }
      }
      return data
   },

   fetchMountList : async (session_no) => {
      var data = []
      var sql = "select distinct x.prog_id,x.major_id,x.semester,p.`short` as program_name,m.title as major_name,t.info from utility.`structure` x left join utility.program p on p.id = x.prog_id left join ais.major m on m.id = x.major_id left join utility.structmeta t on (t.prog_id=x.prog_id and x.semester = t.semester) "
      sql += session_no == 1 ? "where mod(ceil(x.semester),2) = 1 ": "where mod(ceil(x.semester),2) = 0 " 
      sql += "order by x.prog_id,x.semester,x.major_id"
      const res = await db.query(sql);
      if(res && res.length > 0){
         for(var r of res){
            var dt = { program_name:r.program_name, major_name:r.major_name,semester:r.semester}
            const info = JSON.parse(r.info)
            if(info && info.length > 0){
               for(var f of info){
                  if(f.major_id == r.major_id){
                     dt = f.major_id ? 
                       {...dt, max_credit:f.max_credit, min_credit:f.min_credit, max_elective:f.max_elective } :
                       {...dt, max_credit:f.max_credit, min_credit:f.min_credit }
                       
                  }
               }
            }
            const resm = await db.query("select r.*,c.course_code,c.title as course_title,c.credit from utility.structure r left join utility.course c on c.id = r.course_id where r.prog_id = "+r.prog_id+" and r.semester = "+r.semester+" and (r.`type` = 'C' or (r.`type` = 'E' and r.major_id is null) or r.major_id = "+r.major_id+") order by r.type");
            if(resm && resm.length > 0) dt.data = resm
            data.push(dt)
         }
      }
      return data
   },



   // SCORESHEETS - AIS MODELS

   fetchScoresheets : async (session_id,page,keyword) => {
      var sql = "select s.*,p.short as program_name,m.title as major_name,upper(c.title) as course_name,c.course_code,c.credit,n.title as calendar,n.tag as stream,t.title as unit_name from ais.sheet s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.course c on s.course_id = c.id left join utility.session n on n.id = s.session_id left join utility.unit t on t.id = s.unit_id"
      var cql = "select count(*) as total from  ais.sheet s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.course c on s.course_id = c.id left join utility.session n on n.id = s.session_id left join utility.unit t on t.id = s.unit_id";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where c.title like '%${keyword.toLowerCase()}%' or c.course_code like '%${keyword}%' or p.short like '%${keyword}%' or t.title like '%${keyword}%' `
          cql += ` where c.title like '%${keyword.toLowerCase()}%' or c.course_code like '%${keyword}%' or p.short like '%${keyword}%' or t.title like '%${keyword}%'  `
      }

      sql += ` order by s.session_id desc,s.prog_id,s.semester, s.major_id`
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

   fetchMyScoresheets : async (sno,session_id,page,keyword) => {
      var sql = "select s.*,p.short as program_name,m.title as major_name,upper(c.title) as course_name,c.course_code,c.credit,n.title as calendar,n.tag as stream,t.title as unit_name from ais.sheet s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.course c on s.course_id = c.id left join utility.session n on n.id = s.session_id left join utility.unit t on t.id = s.unit_id where find_in_set('"+sno+"',s.tag) > 0"
      var cql = "select count(*) as total from  ais.sheet s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.course c on s.course_id = c.id left join utility.session n on n.id = s.session_id left join utility.unit t on t.id = s.unit_id where find_in_set('"+sno+"',s.tag) > 0";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` and c.title like '%${keyword.toLowerCase()}%' or c.course_code like '%${keyword}%' or p.short like '%${keyword}%' or t.title like '%${keyword}%' `
          cql += ` and c.title like '%${keyword.toLowerCase()}%' or c.course_code like '%${keyword}%' or p.short like '%${keyword}%' or t.title like '%${keyword}%' `
      }

      sql += ` order by s.session_id desc,s.prog_id,s.semester, s.major_id`
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

   insertAISSheet : async (data) => {
      const res = await db.query("insert into ais.sheet set ?", data);
      return res;
   },

   updateAISSheet : async (id,data) => {
      const res = await db.query("update ais.sheet set ? where id = "+id,data);
      return res;
   },

   deleteAISSheet : async (id) => {
      const res = await db.query("delete from ais.sheet where id = "+id);
      return res;
   },

   
   loadSheet : async (id) => {
      var data = []
      const res = await db.query("select * from ais.sheet where id = "+id);
      if(res && res.length > 0 ){
         const vs = res[0];
         let sql = `select x.*,s.refno,concat(s.lname,', ',s.fname,ifnull(concat(' ',s.mname),'')) as name,c.grade_meta from ais.assessment x left join ais.student s on x.indexno = s.indexno left join utility.scheme c on c.id = x.scheme_id where x.session_id=${vs.session_id} and x.course_id=${vs.course_id} and s.prog_id = ${vs.prog_id} and x.semester = ${vs.semester} and s.session = '${vs.session}' order by s.lname`
         const rs = await db.query(sql)
         if(rs && rs.length > 0){
            for(var r of rs){
               const c_name = `${r.session_id}_${r.course_id}_${r.indexno}_c`
               const c_value = r.class_score
               const e_name = `${r.session_id}_${r.course_id}_${r.indexno}_e`
               const e_value = r.exam_score
               let dt = { name:r.name, indexno:r.indexno, refno:r.refno, class: { name:c_name, value:c_value }, exam: { name:e_name, value:e_value }, scheme: r.grade_meta }
               data.push(dt)
            }
         }
      }
      return data;
   },


   saveSheet : async (data) => {
      var count = 0
      var sid = 0;
      const keys = Object.keys(data);
      if(keys.length > 0){
         for(var key of keys){
            const keyinfo = key.split('_')
            if(keyinfo.length > 0){
               sid = keyinfo[0];
               const session_id = keyinfo[0]
               const course_id = keyinfo[1]
               const indexno = keyinfo[2]
               const type = keyinfo[3]
               const value = data[key]
               // Update Database with Record
               const dt = type == 'c' ? { class_score:value } : { exam_score:value }
               const ups = await db.query("update ais.assessment set ? where session_id = "+session_id+" and course_id = "+course_id+" and indexno = '"+indexno+"'",dt)
               if(ups && ups.affectedRows > 0) count += 1
            }
         }
      }
      if(count > 0) await SSO.retireAssessmentTotal(sid) // Return Assessment for Session
      return count;
   },
   
   retireAssessmentTotal : async (session_id) => {
      const res = await db.query("update ais.assessment set total_score = (class_score+exam_score) where session_id = "+session_id);
      return res
   },

   publishSheet : async (id) => {
      const res = await db.query("update ais.sheet set flag_assessed = 1 where id = "+id);
      if(res && res.affectedRows > 0) return true
      return false;
   },

   certifySheet : async (id) => {
      const res = await db.query("update ais.sheet set flag_certified = 1 where id = "+id);
      var count = 0;
      if(res && res.affectedRows > 0){
         const resx = await db.query("select * from ais.sheet where id = "+id);
         if(resx && resx.length > 0 ){
            const vs = resx[0];
            let sql = `select x.* from ais.assessment x left join ais.student s on x.indexno = s.indexno where x.session_id=${vs.session_id} and x.course_id=${vs.course_id} and s.prog_id = ${vs.prog_id} and x.semester = ${vs.semester} and s.session = '${vs.session}' order by s.lname`
            const rs = await db.query(sql)
            if(rs && rs.length > 0){
               for(var r of rs){
                  const ups = await db.query("update ais.assessment set flag_visible = 1 where session_id = "+r.session_id+" and course_id = "+r.course_id+" and indexno = '"+r.indexno+"'")
                  if(ups && ups.affectedRows > 0) count += 1
               }
            }
         }
      }
      return count;
   },

   uncertifySheet : async (id) => {
      const res = await db.query("update ais.sheet set flag_certified = 0 where id = "+id);
      var count = 0;
      if(res && res.affectedRows > 0){
         const resx = await db.query("select * from ais.sheet where id = "+id);
         if(resx && resx.length > 0 ){
            const vs = resx[0];
            let sql = `select x.* from ais.assessment x left join ais.student s on x.indexno = s.indexno where x.session_id=${vs.session_id} and x.course_id=${vs.course_id} and s.prog_id = ${vs.prog_id} and x.semester = ${vs.semester} and s.session = '${vs.session}' order by s.lname`
            const rs = await db.query(sql)
            if(rs && rs.length > 0){
               for(var r of rs){
                  const ups = await db.query("update ais.assessment set flag_visible = 0 where session_id = "+r.session_id+" and course_id = "+r.course_id+" and indexno = '"+r.indexno+"'")
                  if(ups && ups.affectedRows > 0) count += 1
               }
            }
         }
      }
      return count;
   },


   assignSheet : async (id,sno) => {
      var count = 0;
      const res = await db.query("select * from ais.sheet where id = "+id);
      const sm = await db.query("select s.* from hrs.staff s left join utility.unit u on s.unit_id where s.staff_no = "+sno)
      if(res && sm && res.length > 0 && sm.length > 0/* && sm[0].unit_id == res[0].unit_id*/){
         const vs = res[0];
         var tags = vs['tag'] ? vs['tag'].split(','): []
         const isExist = tags.find(r => r == sno)
         if(!isExist){
            tags.push(sno)
            // Add Staff and Update  
            const ups = await db.query("update ais.sheet set tag = '"+tags.join(',')+"' where id = "+id)
            if(ups && ups.affectedRows > 0) count += 1
         }
      }  return { count, phone:sm && sm[0].phone };
   },

   unassignSheet : async (id,sno) => {
      var count = 0;
      const res = await db.query("select * from ais.sheet where id = "+id);
      const sm = await db.query("select s.* from hrs.staff s left join utility.unit u on s.unit_id where s.staff_no = "+sno)
      if(res && sm && res.length > 0 && sm.length > 0/* && sm[0].unit_id == res[0].unit_id*/){
         const vs = res[0];
         var tags = vs['tag'] ? vs['tag'].split(','): []
         const isExist = tags.find(r => r == sno)
         if(isExist){
            tags = tags.filter(r => r != sno)
            // Add Staff and Update  
            const ups = await db.query("update ais.sheet set tag = '"+tags.join(',')+"' where id = "+id)
            if(ups && ups.affectedRows > 0) count += 1
         }
      }  return { count, phone:sm && sm[0].phone };
   },


   loadCourseList : async (id) => {
      var data = []
      const res = await db.query("select * from ais.sheet where id = "+id);
      if(res && res.length > 0 ){
         const vs = res[0];
         let sql = `select x.indexno,s.refno,concat(s.lname,', ',s.fname,ifnull(concat(' ',s.mname),'')) as name, if(x.course_id is null, 'Not Registered','Registered') as regstatus,if(x.created_at is null, 'No Date',date_format(x.created_at,'%M %d, %Y')) as regdate from ais.student s left join ais.assessment x on s.indexno = x.indexno where x.session_id = ${vs.session_id} and x.course_id = ${vs.course_id} and s.prog_id = ${vs.prog_id} and s.semester = ${vs.semester} and s.session = '${vs.session}' order by s.lname asc`
         const rs = await db.query(sql)
         if(rs && rs.length > 0){
            data = rs
         }
      }
      console.log(data)
      return data;
   },


   // CURRICULUM -AIS

   fetchStruct : async (page,keyword) => {
      var sql = "select s.*,p.short as program_name,m.title as major_name,upper(c.title) as course_name,c.course_code,c.credit,t.title as unit_name from utility.structure s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.course c on s.course_id = c.id left join utility.unit t on t.id = s.unit_id"
      var cql = "select count(*) as total from utility.structure s left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id left join utility.course c on s.course_id = c.id left join utility.unit t on t.id = s.unit_id";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where c.title like '%${keyword.toLowerCase()}%' or c.course_code like '%${keyword}%' or p.short like '%${keyword}%' or t.title like '%${keyword}%' `
          cql += ` where c.title like '%${keyword.toLowerCase()}%' or c.course_code like '%${keyword}%' or p.short like '%${keyword}%' or t.title like '%${keyword}%'  `
      }

      sql += ` order by s.prog_id,s.semester,s.type`
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


   insertAISMeta : async (data) => {
      const res = await db.query("insert into utility.structure set ?", data);
      return res;
   },

   updateAISMeta : async (id,data) => {
      const res = await db.query("update utility.structure set ? where id = "+id,data);
      return res;
   },

   deleteAISMeta : async (id) => {
      const res = await db.query("delete from utility.structure where id = "+id);
      return res;
   },


   // CALENDAR -AIS


   fetchCalendar : async (page,keyword) => {
      var sql = "select s.* from utility.session s"
      var cql = "select count(*) as total from utility.session s";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where s.title like '%${keyword.toLowerCase()}%' or s.tag like '%${keyword}%' or s.academic_sem = '%${keyword == 'first' ? 1 : null}%' or s.academic_sem = '%${keyword == 'second' ? 1 : null}%' `
          cql += ` where s.title like '%${keyword.toLowerCase()}%' or s.tag like '%${keyword}%' or s.academic_sem = '%${keyword == 'first' ? 1 : null}%' or s.academic_sem = '%${keyword == 'second' ? 1 : null}%' `
      }

      sql += ` order by s.id desc`
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


   insertAISCalendar : async (data) => {
      const res = await db.query("insert into utility.session set ?", data);
      return res;
   },

   updateAISCalendar : async (id,data) => {
      const res = await db.query("update utility.session set ? where id = "+id,data);
      return res;
   },

   deleteAISCalendar : async (id) => {
      const res = await db.query("delete from utility.session where id = "+id);
      return res;
   },

   activateAISCalendar : async (id) => {
      const cs = await db.query("select * from utility.session where id = "+id);
      const vs = await db.query("update utility.session set `default` = 0 where tag = '"+cs[0].tag+"'");
      const res = await db.query("update utility.session set `default` = 1 where id = "+id);
      return res;
   },

   
   getActiveSessionByMode : async (mode_id) => {
      const res = await db.query("select * from utility.session where tag = 'MAIN' and `default` = 1 and mode_id = "+mode_id);
      return res && res[0]
   },

   getActiveSessionByDoa : async (doa) => {
      const res = await db.query("select s.* from ais.student where `default` = 1  and mode_id = "+doa);
      return res && res[0]
   },

   getActiveSessionByRefNo : async (refno) => {
      var sid;
      const st = await db.query("select s.*,date_format(doa,'%m') as admission_code,semester,entry_semester from ais.student s where s.refno = '"+refno+"'");
      const sx = await db.query("select id,substr(admission_code,1,2) as admission_code,tag from utility.session where `default` = 1 and status = 1");
      if(sx && sx.length == 1) sid = sx[0].id
      if(sx && sx.length > 1){
        if(st && st.length > 0){
            if(st[0].semester <= 2 && st[0].admission_code == '09'){
               sid = (sx.find(r => r.tag == 'SUB')).id
            }else if(st[0].semester <= 4 && st[0].admission_code == '09' && [3,4].includes(st[0].entry_semester)){
               sid = (sx.find(r => r.tag == 'SUB')).id
            }else{
               sid = (sx.find(r => r.tag == 'MAIN')).id
            }
        }
      } 
      return sid;
   },


   // INFORMER -AIS
   fetchInformer : async (page,keyword) => {
      var sql = "select s.* from ais.informer s"
      var cql = "select count(*) as total from ais.informer s";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where s.tag like '%${keyword.toLowerCase()}%' or s.title like '%${keyword}%' or s.message = '%${keyword}%' `
          cql += ` where s.tag like '%${keyword.toLowerCase()}%' or s.title like '%${keyword}%' or s.message = '%${keyword}%' `
      }

      sql += ` order by s.id desc`
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


   insertAISInformer : async (data) => {
      const res = await db.query("insert into ais.informer set ?", data);
      return res;
   },

   updateAISInformer : async (id,data) => {
      const res = await db.query("update ais.informer set ? where id = "+id,data);
      return res;
   },

   deleteAISInformer : async (id) => {
      const res = await db.query("delete from ais.informer where id = "+id);
      return res;
   },

   fetchInformerData : async () => {
      const res = await db.query("select * from ais.informer where status = 1 and send_status = 0");
      return res;
   },

   msgStudentData : async () => {
      const res = await db.query("select s.refno as tag, s.phone, s.lname,s.fname from ais.student s where s.complete_status = 0 and s.phone is not null");
      return res;
   },

   msgStaffData : async () => {
      //const res = await db.query("select s.staff_no as tag, s.phone, s.lname,s.fname from hrs.staff s where s.phone is not null");
      const res = await db.query("select s.staff_no as tag, s.phone, s.lname,s.fname from hrs.staff s where s.phone is not null and s.staff_no = 15666");
      return res;
   },

   msgFresherData : async () => {
      const res = await db.query("select s.refno as tag, s.phone, s.lname,s.fname from ais.student s where s.complete_status = 0 and (s.semester = 1 or s.semester = 2) and s.phone is not null");
      return res;
   },

   msgApplicantData : async () => {
      const res = await db.query("select s.serial as tag, s.applicant_phone as phone, s.applicant_name as lname,s.applicant_name as fname from P06.voucher s left join P06.session x on x.session_id = s.session_id where x.status = 1 and s.applicant_phone is not null");
      return res;
   },

   msgDeanData : async () => {
      const res = await db.query("select s.staff_no as tag, s.phone, s.lname,s.fname from hrs.staff s left join hrs.job j on s.job_id = j.id where (s.position like '%dean%' or j.title like '%dean%') and s.phone is not null");
      return res;
   },

   msgHeadData : async () => {
      const res = await db.query("select s.staff_no as tag, s.phone, s.lname,s.fname from hrs.staff s left join hrs.job j on s.job_id = j.id where (s.position like '%head%' or j.title like '%head%') and s.phone is not null");
      return res;
   },

   msgAssessorData : async () => {
      const res = await db.query("select s.staff_no as tag, s.phone, s.lname,s.fname from hrs.staff s left join hrs.job j on s.job_id = j.id where (s.position like '%lecturer%' or j.title like '%lecturer%') and s.phone is not null");
      return res;
   },

   msgUndergradData : async () => {
      const res = await db.query("select s.refno as tag, s.phone, s.lname,s.fname from ais.student s left join utility.program p on s.prog_id = p.id where (p.group_id = 'UG' or p.group_id = 'DP') and s.complete_status = 0 and s.phone is not null");
      return res;
   },

   msgPostgradData : async () => {
      const res = await db.query("select s.refno as tag, s.phone, s.lname,s.fname from ais.student s left join utility.program p on s.prog_id = p.id where p.group_id = 'PG' and s.complete_status = 0 and s.phone is not null");
      return res;
   },

   insertInformerLog : async (data) => {
      const res = await db.query("insert into ais.informer_log set ?",data);
      return res;
   },

   updateInformerLog : async (id,data) => {
      const res = await db.query("update ais.informer_log set ? where id = "+id,data);
      return res;
   },


   // PROGRAM CHANGE - AIS

   fetchProgchange : async (page,keyword) => {
      var sql = "select c.*,concat(s.lname,' ',ifnull(concat(s.mname,' '),''),s.fname) as name,cp.short as program_cname,cm.title as major_cname,np.short as program_nname from ais.change_prog c left join ais.student s on c.refno = s.refno left join utility.program cp on cp.id = c.current_prog_id left join ais.major cm on c.current_major_id = cm.id left join utility.program np on np.id = c.new_prog_id"
      var cql = "select count(*) as total from ais.change_prog c left join ais.student s on c.refno = s.refno left join utility.program cp on cp.id = c.current_prog_id left join ais.major cm on c.current_major_id = cm.id left join utility.program np on np.id = c.new_prog_id";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where c.refno like '%${keyword.toLowerCase()}%' or c.current_indexno like '%${keyword}%' or c.new_indexno like '%${keyword}%' or cp.title like '%${keyword}%' `
          cql += ` where c.refno like '%${keyword.toLowerCase()}%' or c.current_indexno like '%${keyword}%' or c.new_indexno like '%${keyword}%' or cp.title like '%${keyword}%' `
      }

      sql += ` order by c.id desc`
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


   insertAISProgchange : async (data) => {
      const res = await db.query("insert into ais.change_prog set ?", data);
      return res;
   },

   updateAISProgchange : async (id,data) => {
      const res = await db.query("update ais.change_prog set ? where id = "+id,data);
      return res;
   },

   deleteAISProgchange : async (id) => {
      const res = await db.query("delete from ais.change_prog where id = "+id);
      return res;
   },

   approveAISProgchange : async (id,staff_no) => {
      const chg = await db.query("select c.*,p.prefix,p.stype,date_format(s.doa,'%m%y') as code from ais.change_prog c left join ais.student s on s.refno = c.refno left join utility.program p on c.new_prog_id = p.id left join utility.session x on x.mode_id = p.mode_id where (x.`default` = 1 and x.admission_code = date_format(s.doa,'%m%y')) and c.id = "+id);
      if(chg && chg.length > 0){
         const refno = chg[0].refno
         const prog_id = chg[0].new_prog_id
         const prefix = `${chg[0].prefix.trim()}${chg[0].code.trim()}${chg[0].stype}`
         var newIndex, no;
         const sm = await db.query("select indexno,prog_count from ais.student where indexno like '"+prefix+"%' order by prog_count desc limit 1");
         if(sm && sm.length > 0){
            no = parseInt(sm[0].prog_count)+1;
            var newNo;
            switch(no.toString().length){
              case 1: newNo = `00${no}`; break;
              case 2: newNo = `0${no}`; break;
              case 3: newNo = `${no}`; break;
              default: newNo = `${no}`; break;
            }
            newIndex = `${prefix}${newNo}`
         }else{
            no = 1
            newIndex = `${prefix}00${no}`
         }

         while(true){
            const sf = await db.query("select indexno from ais.student where indexno = '"+newIndex+"'");
            if(sf && sf.length <= 0) break;
            no++
         }
         var resp = await db.query("update ais.student set ? where refno = '"+refno+"'",{ indexno: newIndex, prog_count: no, prog_id , major_id: null });
         var ups = await db.query("update ais.change_prog set ? where id = "+id, { new_indexno: newIndex, new_semester: 1, approved_at: new Date(), approved_by:staff_no, approved_status:1 });
         if(resp && ups) return newIndex

      }
      return null;
   },

  
  

   // TRANSACTION - FMS
  
   sendTransaction : async (data) => {
      const isRec = await db.query("select * from fms.transaction where transtag = '"+data.transtag+"'");
      if(isRec && isRec.length > 0){ 
        return { insertId:isRec[0].id,...isRec[0] }
      }else{
        const res = await db.query("insert into fms.transaction set ?", data);
        return res;
      }
     
      
   },

   
   // BILLS - FMS
   
   fetchBills : async (page,keyword) => {
      var sql = "select b.*,p.`short` as program_name,s.tag as session_tag from fms.billinfo b left join utility.program p on p.id = b.prog_id left join utility.session s on b.session_id = s.id"
      var cql = "select count(*) as total from fms.billinfo b";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where b.narrative like '%${keyword}%' or s.title like '%${keyword}%' or b.tag like '%${keyword}%' or b.group_code = '${keyword}' or b.amount = '${keyword}'`
          cql += ` where b.narrative like '%${keyword}%' or s.title like '%${keyword}%' or b.tag like '%${keyword}%' or b.group_code = '${keyword}' or b.amount = '${keyword}'`
      }

      sql += ` order by b.bid desc,b.narrative asc`
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

   fetchCurrentBills : async () => {
      var res;
      const sid = await db.query("select * from utility.session where `default` = 1")
      if(sid && sid.length > 0){
         res = await db.query("select b.*,p.`short` as program_name from fms.billinfo b left join utility.program p on p.id = b.prog_id where b.post_status = 1 and b.session_id = "+sid[0].id);
      }
      return res;
   },

   fetchBill : async (id) => {
      const res = await db.query("select b.*,p.`short` as program_name from fms.billinfo b left join utility.program p on p.id = b.prog_id where bid = "+id);
      return res;
   },

   fetchItemsByBid: async (id) => {
      const res = await db.query("select b.* from fms.billitem b where find_in_set('"+id+"',bid) > 0 and status = 1");
      return res;
   },

   insertBill : async (data) => {
      const res = await db.query("insert into fms.billinfo set ?", data);
      return res;
   },

   updateBill : async (id,data) => {
      const res = await db.query("update fms.billinfo set ? where bid = "+id,data);
      return res;
   },

   deleteBill : async (id) => {
      const res = await db.query("delete from fms.billinfo where bid = "+id);
      return res;
   },

   revokeBill: async (id,refno) => {
      var resp;
      if(refno){
         resp = await db.query("delete from fms.studtrans where refno = '"+refno+"' and bill_id = "+id)
      }else{
         resp = await db.query("delete from fms.studtrans where bill_id = "+id)
      }
      return resp;
   },

   sendStudentBillGh : async (bid,bname,amount,prog_id,sem,sess,discount,dsem,currency) => {
      var count = 0, dcount = 0;
      const sts = await db.query("select s.refno,s.indexno from ais.student s where s.complete_status = 0 and s.defer_status = 0 and s.prog_id  = "+prog_id+" and s.entry_group = 'GH' and find_in_set(s.semester,'"+sem+"') > 0");
      const dts = await db.query("select s.refno,s.indexno from ais.student s where s.complete_status = 0 and s.defer_status = 0 and s.prog_id  = "+prog_id+" and s.entry_group = 'GH' and find_in_set(s.semester,'"+dsem+"') > 0");
      if(sts.length > 0){
         for(var st of sts){
            const session_id = await getActiveSessionByRefNo(st.refno)
            if(session_id == sess){
               const isExist = await db.query("select * from fms.studtrans where refno = '"+st.refno+"' and bill_id = "+bid+" and amount > 0")
               if(isExist && isExist.length <= 0){
                  const ins = await db.query("insert into fms.studtrans set ?", { narrative:bname, bill_id:bid, amount, refno:st.refno, session_id:sess, currency })
                  if(ins.insertId > 0) count++;
               }
            }
         }
      }
      if(dts.length > 0 && (discount && discount > 0)){
         for(var st of dts){
            const session_id = await getActiveSessionByRefNo(st.refno)
            if(session_id == sess){
               const isExist = await db.query("select * from fms.studtrans where refno = '"+st.refno+"' and bill_id = "+bid+" and amount < 0")
               if(isExist && isExist.length <= 0){
                  const ins = await db.query("insert into fms.studtrans set ?",{ narrative:`DISCOUNT - ${bname}`, bill_id:bid, amount:(-1*discount), refno:st.refno, session_id:sess, currency })
                  if(ins.insertId > 0) dcount++;
               }
            }
         }
      }
      return { count, dcount };
   },

   sendStudentBillInt : async (bid,bname,amount,sem,sess,discount,dsem,currency) => {
      var count = 0;
      const sts = await db.query("select s.refno,s.indexno from ais.student s where s.complete_status = 0 and s.defer_status = 0 and s.entry_group = 'INT' and find_in_set(s.semester,'"+sem+"') > 0");
      const dts = await db.query("select s.refno,s.indexno from ais.student s where s.complete_status = 0 and s.defer_status = 0 and s.entry_group = 'INT' and find_in_set(s.semester,'"+dsem+"') > 0");
      
      if(sts.length > 0){
         for(var st of sts){
            const session_id = await getActiveSessionByRefNo(st.refno)
            if(session_id == sess){
               const isExist = await db.query("select * from fms.studtrans where refno = '"+st.refno+"' and bill_id = "+bid+" and amount > 0")
               if(isExist && isExist.length <= 0){
                  const ins = await db.query("insert into fms.studtrans set ?",{narrative:bname,bill_id:bid,amount,refno:st.refno,session_id:sess})
                  if(discount && discount > 0 ) await db.query("insert into fms.studtrans set ?",{narrative:`DISCOUNT - ${bname}`,bill_id:bid,amount:(-1*discount),refno:st.refno,session_id:sess,currency})
                  if(ins.insertId > 0) count++;
               }
            }
         }
      }

      if(dts.length > 0 && (discount && discount > 0)){
         for(var st of sts){
            const session_id = await getActiveSessionByRefNo(st.refno)
            if(session_id == sess){
               const isExist = await db.query("select * from fms.studtrans where refno = '"+st.refno+"' and bill_id = "+bid+" and amount < 0")
               if(isExist && isExist.length <= 0){
                  const ins = await db.query("insert into fms.studtrans set ?",{ narrative:bname,bill_id:bid,amount,refno:st.refno,session_id:sess })
                  if(discount && discount > 0 ) await db.query("insert into fms.studtrans set ?",{narrative:`DISCOUNT - ${bname}`,bill_id:bid,amount:(-1*discount),refno:st.refno,session_id:sess,currency})
                  if(ins.insertId > 0) count++;
               }
            }
         }
      }
      return count;
   },


   retireAccount : async () => {
      var count = 0;
      const st = await db.query("select distinct(refno) as refno from fms.studtrans")
      if(st && st.length > 0){
         for(let s of st){
            const bal = await db.query("select sum(amount) as amount from fms.studtrans where refno = '"+s.refno+"'")
            if(bal && bal.length > 0){
               const ups = await db.query("update ais.student s set ? where refno = '"+s.refno+"'",{transact_account:bal[0].amount})
               if(ups.affectedRows > 0) count++;
            }
         }
      }  
      return count;
   },

 
   retireFeesTransact : async () => {
      var count = 0;
      const st = await db.query("insert into fms.studtrans(tid,refno,amount,transdate,currency,session_id,narrative) select t.id as tid,t.refno,(t.amount*-1) as amount,t.transdate,t.currency,i.id as session_id,concat('Online Fees Payment, StudentID: ',upper(t.refno)) as narrative from fms.transaction t left join fms.studtrans m on t.id = m.tid left join ais.student s on s.refno = t.refno left join utility.program p on p.id = s.prog_id left join utility.session i on i.mode_id = p.mode_id where t.transtype_id in (2) and m.tid is null and i.`default` = 1 order by tid")
      if(st) count = st.affectedRows
      return count;
   },


   retireResitTransact : async () => {
      var count = 0;
      const st = await db.query("insert into fms.studtrans(tid,refno,amount,transdate,currency,session_id,narrative) select t.id as tid,t.refno,(t.amount*-1) as amount,t.transdate,t.currency,i.id as session_id,concat('Online Fees Payment, StudentID: ',upper(t.refno)) as narrative from fms.transaction t left join fms.studtrans m on t.id = m.tid left join ais.student s on s.refno = t.refno left join utility.program p on p.id = s.prog_id left join utility.session i on i.mode_id = p.mode_id where t.transtype_id in (3 ) and m.tid is null and i.`default` = 1 order by tid")
      if(st) count = st.affectedRows
      return count;
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
      const main_stream = await db.query("select * from utility.session where tag = 'MAIN' and `default` =  1")
      const sub_stream = await db.query("select * from utility.session where tag = 'SUB' and `default` =  1")
      
      // Stage for Main Stream
      const main_meta = await db.query("select x.*,p.group_id from utility.structure x left join utility.program p on x.prog_id = p.id where x.status = 1 and p.status = 1")
      if(main_meta && main_meta.length > 0 && main_stream && main_stream.length > 0){
         var data = []
         for(var meta of main_meta){
            if(meta.semester%2 ==  (main_stream[0].academic_sem == 2 ? 1 : 0)) continue;
            var loop_count,session_modes;
            data.push(meta)
            switch(meta.group_id){
              case 'CP': 
               loop_count = 1; 
               session_modes = ['M'];break;
              case 'DP': 
               loop_count = 2; 
               session_modes = ['M','W'];break;
              case 'UG': 
               loop_count = 3; 
               session_modes = ['M','E','W'];break;
              case 'PG': 
               loop_count = 1; 
               session_modes = ['W'];break;
            }
            
            // Run Data For All Existing Session Modes
            if(session_modes && session_modes.length > 0){
               for(var i = 0; i < session_modes.length; i++){
                  var sql = "select * from ais.sheet where session_id = "+main_stream[0].id+" and prog_id = "+meta.prog_id+" and course_id = "+meta.course_id+" and semester = "+parseInt(meta.semester)+" and session = '"+session_modes[i]+"' and mode_id = 1"
                  sql += meta.major_id ? " and major_id = "+meta.major_id : " and major_id is null"
                  const isExist = await db.query(sql)
                  if(isExist && isExist.length <= 0){
                     const dt = { prog_id:meta.prog_id, major_id:meta.major_id, course_id:meta.course_id, semester:parseInt(meta.semester), session_id:main_stream[0].id, session:session_modes[i], mode_id:1 }
                     const ins = await db.query("insert into ais.sheet set ?",dt)
                  }
               }
            }
         }
      }

      // Stage for Sub Stream
      const sub_meta = await db.query("select x.*,p.group_id from utility.structure x left join utility.program p on x.prog_id = p.id where x.status = 1 and p.status = 1")
      if(sub_meta && sub_meta.length > 0 && sub_stream && sub_stream.length > 0){
         var data = []
         for(var meta of sub_meta){
            if(meta.semester%2 ==  (main_stream[0].academic_sem == 2 ? 1 : 0)) continue;
            var loop_count,session_modes;
            data.push(meta)
            switch(meta.group_id){
            case 'CP': 
               loop_count = 1; 
               session_modes = ['M'];break;
            case 'DP': 
               loop_count = 2; 
               session_modes = ['M','W'];break;
            case 'UG': 
               loop_count = 3; 
               session_modes = ['M','E','W'];break;
            case 'PG': 
               loop_count = 1; 
               session_modes = ['W'];break;
            }
            
            // Run Data For All Existing Session Modes
            if(session_modes && session_modes.length > 0){
               for(var i = 0; i < session_modes.length; i++){
                  var sql = "select * from ais.sheet where session_id = "+main_stream[0].id+" and prog_id = "+meta.prog_id+" and course_id = "+meta.course_id+" and semester = "+parseInt(meta.semester)+" and session = '"+session_modes[i]+"' and mode_id = 1"
                  sql += meta.major_id ? " and major_id = "+meta.major_id : " and major_id is null"
                  const isExist = await db.query(sql)
                  if(isExist && isExist.length <= 0){
                     const dt = { prog_id:meta.prog_id, major_id:meta.major_id, course_id:meta.course_id, semester:parseInt(meta.semester), session_id:main_stream[0].id, session:session_modes[i], mode_id:1 }
                     const ins = await db.query("insert into ais.sheet set ?",dt)
                  }
               }
            }
         }
      }

      return data;
   },


   // CORRECT STUDENT NAMES
   runUpgradeNames : async () => {
      var count = 0;
      const st = await db.query("select * from ais.student where complete_status = 0")
      if(st && st.length > 0){
         for(var s of st){
            var { fname,mname,lname,refno } = s;
            const fnames = fname && fname.trim().split(' ');
            const lnames = lname && lname.trim().split(' ');

            if(fnames && fnames.length == 2 && !lname && !mname){
               fname = fnames[0]
               lname =  fnames[1]

            }else if(fnames && fnames.length == 3 && !lname && !mname){
               fname = fnames[0]
               mname =  fnames[1]
               lname =  fnames[2]

            }else if(fnames && fnames.length == 4 && !lname && !mname){
               fname = fnames[0]
               mname = `${fnames[1]} ${fnames[2]}`
               lname = fnames[3]

            }else if(lnames && lnames.length == 2 && !fname && !mname){
               fname = lnames[0]
               lname = lnames[1]

            }else if(lnames && lnames.length == 3 && !fname && !mname){
               fname = lnames[0]
               mname = lnames[1]
               lname = lnames[2]

            }else if(lnames && lnames.length == 4 && !fname && !mname){
               fname = lnames[0]
               mname = `${lnames[1]} ${lnames[2]}`
               lname = lnames[3]
            }

            if(!lname && mname){
               const mnames = mname.split(' ')
               if(mnames.length > 1){
                   lname = mnames[mnames.length-1]
                   mname = mnames[0]
               }else{
                   lname = mname
                   mname = null
               }
            }

            if(!fname && mname){
               const mnames = mname.split(' ')
               if(mnames.length > 1){
                   fname = mnames[mnames.length-1]
                   mname = mnames[0]
               }else{
                   fname = mname
                   mname = null
               }
            }
            
            const data = { fname,mname,lname }
            await db.query("update ais.student set ? where refno = '"+refno+"'",data) 
         }
      }
   },


   // PAYMENTS DUPLICATES  - SCRIPT
   runRemovePaymentDuplicates : async () => {
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
   },


   // UPDATE COMPLETE STATUS OF STUDENT - SCRIPT
   runData : async () => {
      const data = require('../../config/data.json')
      if(data && data.length > 0){
         // Update All Students To Completed
         await db.query("update ais.student set complete_status = 1")
         // Update ALl Post Graduates
         await db.query("update ais.student set complete_status = 0 where prog_id in (3,4,5)")
         // Update Undergraduates in data.json
         for(var d of data){
            const val = d['AUDM09211001'].trim()
            await db.query("update ais.student set complete_status = 0 where refno = '"+val+"' or indexno = '"+val+"'")
            console.log(val)
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

   fetchBillItems : async (page,keyword) => {
      var sql = "select s.academic_year,i.* from fms.billitem i left join utility.session s on i.session_id = s.id"
      var cql = "select count(*) as total from fms.billitem i left join utility.session s on i.session_id = s.id";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where i.narrative like '%${keyword}%' or i.amount = '${keyword}'`
          cql += ` where i.narrative like '%${keyword}%' or i.amount = '${keyword}'`
      }

      sql += ` order by i.id desc`
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

   fetchBillItem : async (id) => {
      const res = await db.query("select b.*,p.`short` as program_name from fms.billinfo b left join utility.program p on p.id = b.prog_id where bid = "+id);
      return res;
   },

   
   insertBillItem : async (data) => {
      const res = await db.query("insert into fms.billitem set ?", data);
      return res;
   },

   updateBillItem : async (id,data) => {
      const res = await db.query("update fms.billitem set ? where id = "+id,data);
      return res;
   },

   deleteBillItem : async (id) => {
      const res = await db.query("delete from fms.billitem where id = "+id);
      return res;
   },

   addToBill: async (id,bid) => {
      var res;
      const it = await db.query("select * from fms.billitem where id = "+id);
      if(it && it.length > 0){
         const bids = it[0].bid ? it[0].bid+','+bid : bid
         res = await db.query("update fms.billitem set ? where id = "+id,{ bid:bids });
      }
      return res;
   },






   // FEE PAYMENTS - FMS
   
   fetchPayments : async (page,keyword) => {
      var sql = "select t.*,s.indexno,concat(trim(s.fname),' ',trim(s.lname)) as name,b.tag as tag,b.bank_account from fms.transaction t left join ais.student s on trim(s.refno) = trim(t.refno) left join fms.bankacc b on b.id = t.bankacc_id where t.transtype_id = 2"
      var cql = "select count(*) as total from fms.transaction t left join ais.student s on s.refno = t.refno where t.transtype_id = 2";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` and (t.transtag like '%${keyword.trim()}%' or s.fname like '%${keyword.trim()}%' or s.lname like '%${keyword.trim()}%' or t.amount = '${keyword.trim()}')`
          cql += ` and (t.transtag like '%${keyword.trim()}%' or s.fname like '%${keyword.trim()}%' or s.lname like '%${keyword.trim()}%' or t.amount = '${keyword.trim()}')`
      }

      sql += ` order by t.transdate desc,t.id`
      sql += !keyword ? ` limit ${offset},${size}` : ` limit ${size}`
      
      const ces = await db.query(cql);
      const res = await db.query(sql);
      const count = Math.ceil(ces[0].total/size)
      console.log(res)
      return {
         totalPages: count,
         totalData: ces[0].total,
         data: res,
      }
   },

   fetchOtherPayments : async (page,keyword) => {
      var sql = "select t.*,s.indexno,concat(trim(s.fname),' ',trim(s.lname)) as name,b.tag as tag,b.bank_account,m.title as transtitle from fms.transaction t left join ais.student s on s.refno = t.refno left join fms.transtype m on m.id = t.transtype_id left join fms.bankacc b on b.id = t.bankacc_id where t.transtype_id not in (1,2)"
      var cql = "select count(*) as total from fms.transaction t left join ais.student s on s.refno = t.refno left join fms.transtype m on m.id = t.transtype_id where t.transtype_id not in (1,2)";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` and s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or t.amount = '${keyword}' or t.reference like '%${keyword}%' or t.transtag like '%${keyword}%' `
          cql += ` and s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or t.amount = '${keyword}' or t.reference like '%${keyword}%' or t.transtag like '%${keyword}%' `
      }

      sql += ` order by t.id desc`
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


   fetchVoucherSales : async (page,keyword) => {
      var sql = "select t.*,s.serial,trim(s.buyer_name) as name,s.buyer_phone,s.pin,s.sms_code,b.tag as tag,b.bank_account,m.title as transtitle from fms.transaction t left join fms.voucher_log s on s.tid = t.id left join fms.transtype m on m.id = t.transtype_id left join fms.bankacc b on b.id = t.bankacc_id where t.transtype_id = 1"
      var cql = "select count(*) as total from fms.transaction t left join fms.voucher_log s on s.tid = t.id left join fms.transtype m on m.id = t.transtype_id where t.transtype_id = 1";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` and s.buyer_name like '%${keyword}%' or s.buyer_phone like '%${keyword}%' `
          cql += ` and s.buyer_name like '%${keyword}%' or s.buyer_phone like '%${keyword}%' `
      }

      sql += ` order by t.id desc`
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

   
   fetchPayment : async (id) => {
      const res = await db.query("select t.*,s.indexno,concat(trim(s.fname),' ',trim(s.lname)) as name,b.tag as tag,b.bank_account,m.title as transtitle from fms.transaction t left join ais.student s on s.refno = t.refno left join fms.transtype m on m.id = t.transtype_id left join fms.bankacc b on b.id = t.bankacc_id where t.id = "+id);
      return res;
   },

   fetchItemsByBid: async (id) => {
      const res = await db.query("select b.* from fms.billitem b where find_in_set('"+id+"',bid) > 0 and status = 1");
      return res;
   },

   insertPayment : async (data) => {
      const res = await db.query("insert into fms.transaction set ?", data);
      return res;
   },

   updatePayment : async (id,data) => {
      const res = await db.query("update fms.transaction set ? where id = "+id,data);
      return res;
   },

   deletePayment : async (id) => {
      const resm = await db.query("delete from fms.studtrans where tid = "+id);
      const res = await db.query("delete from fms.transaction where id = "+id);
      return res;
   },

   updateStudFinance : async (tid,refno,amount,transid) => {
         const session_id = await SSO.getActiveSessionByRefNo(refno)
         const fin = await db.query("select * from fms.studtrans where tid = "+tid);
         const dt = { tid,amount,refno,session_id,narrative:`${refno} FEES PAYMENT, TRANSID: ${transid}`}
         var resp;
         var fid;
         if(fin && fin.length > 0){
            resp = await db.query("update fms.studtrans set ? where tid = "+tid,dt);
            fid = resp && fin[0].id
         }else{
            resp = await db.query("insert into fms.studtrans set ?",dt);
            fid = resp && resp.insertId
         }
         return fid;
   },

   verifyFeesQuota : async (refno) => {
      const st = await db.query("select x.id from ais.student s left join utility.program p on s.prog_id = p.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and s.refno = "+refno);
      const fin = await db.query("select * fms.studtrans where bill is not null and session_id = "+st[0].id);
      const dt = { tid,amount,refno,narrative:`${refno} : FEES PAYMENT - AUCC_FIN `}
      var resp;
      var fid;
      if(fin && fin.length > 0){
         resp = await db.query("update fms.studtrans set ? where tid = "+tid,dt);
         fid = resp && fin[0].id
      }else{r
         resp = await db.query("insert into fms.studtrans set ?",dt);
         fid = resp && resp.insertId
      }
      return fid;
   },

   generateIndexNo : async (refno) => {
      const st = await db.query("select x.id,p.prefix,p.stype,date_format(s.doa,'%m%y') as code,s.indexno from ais.student s left join utility.program p on s.prog_id = p.id left join utility.session x on x.mode_id = p.mode_id where (x.`default` = 1 and x.admission_code = date_format(s.doa,'%m%y')) and s.refno = '"+refno+"'");
      if(st && st.length > 0 && (st[0].indexno == 'UNIQUE' || st[0].indexno == null)){
         const prefix = `${st[0].prefix.trim()}${st[0].code.trim()}${st[0].stype}`
         var newIndex, resp, no;
         const sm = await db.query("select indexno,prog_count from ais.student where indexno like '"+prefix+"%' order by prog_count desc limit 1");
         if(sm && sm.length > 0){
            no = parseInt(sm[0].prog_count)+1;
            var newNo;
            switch(no.toString().length){
              case 1: newNo = `00${no}`; break;
              case 2: newNo = `0${no}`; break;
              case 3: newNo = `${no}`; break;
              default: newNo = `${no}`; break;
            }
            newIndex = `${prefix}${newNo}`
         }else{
            no = 1
            newIndex = `${prefix}00${no}`
         }

         while(true){
            const sf = await db.query("select indexno from ais.student where indexno = '"+newIndex+"'");
            if(sf && sf.length <= 0) break;
            no++
         }
         resp = await db.query("update ais.student set ? where refno = '"+refno+"'",{ indexno: newIndex, prog_count: no });
         if(resp) return newIndex
      }
      return null;
   },

   savePaymentToAccount : async (data) => {
      const res = await db.query("insert into fms.studtrans set ?", data);
      return res;
   },

   moveToFees : async (id,amount,refno,transid) => {
      const rs = await db.query("update fms.transaction set transtype_id = 2 where id = "+id);
      console.log(rs)
      const ms = await SSO.updateStudFinance(id,refno,amount,transid)
      console.log(ms)
      if(rs && ms) return rs;
      return null
   },
   

   // DEBTORS - FMS MODELS

   fetchDebtors : async (page,keyword) => {
      var sql = "select s.*,u.uid,u.flag_locked,u.flag_disabled,p.short as program_name,m.title as major_name,concat(s.fname,' ',ifnull(concat(s.mname,' '),''),s.lname) as name from ais.student s left join identity.user u on s.refno = u.tag left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id where s.transact_account > 0"
      var cql = "select count(*) as total from ais.student s left join identity.user u on s.refno = u.tag left join utility.program p on s.prog_id = p.id left join ais.major m on s.major_id = m.id where s.transact_account > 0";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` and s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.refno = '${keyword}' or s.indexno = '${keyword}'`
          cql += ` and s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.refno = '${keyword}' or s.indexno = '${keyword}'`
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


   // HRSTAFF - HRS MODELS

   fetchHRStaff : async (page,keyword) => {
      var sql = "select s.*,u.uid,u.flag_locked,u.flag_disabled,ifnull(j.title,s.position) as designation,m.title as unit_name,concat(s.fname,' ',ifnull(concat(s.mname,' '),''),s.lname) as name from hrs.staff s left join identity.user u on s.staff_no = u.tag left join hrs.job j on s.job_id = j.id left join utility.unit m on s.unit_id = m.id"
      var cql = "select count(*) as total from hrs.staff s left join identity.user u on s.staff_no = u.tag left join hrs.job j on s.job_id = j.id left join utility.unit m on s.unit_id = m.id";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.staff_no = '${keyword}' or s.staff_no = '${keyword}' or s.title like '${keyword}%' or j.title like '${keyword}%' or s.position like '${keyword}%'`
          cql += ` where s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or s.staff_no = '${keyword}' or s.staff_no = '${keyword}' or s.title like '${keyword}%' or j.title like '${keyword}%' or s.position like '${keyword}%'`
      }

      sql += ` order by s.staff_no asc,s.lname asc, s.fname asc`
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

   
   fetchActiveStListHRS : async () => {
      const res = await db.query("select s.*,u.uid,u.flag_locked,u.flag_disabled,ifnull(j.title,s.position) as designation,m.title as unit_name,concat(s.fname,' ',ifnull(concat(s.mname,' '),''),s.lname) as name from hrs.staff s left join identity.user u on s.staff_no = u.tag left join hrs.job j on s.job_id = j.id left join utility.unit m on s.unit_id = m.id");
      return res;
   },

   insertHRStaff : async (data) => {
      const res = await db.query("insert into hrs.staff set ?", data);
      return res;
   },

   updateHRStaff : async (id,data) => {
      const res = await db.query("update hrs.staff set ? where id = "+id,data);
      return res;
   },


   deleteHRStaff : async (id) => {
      const st = await db.query("select u.uid from hrs.staff s left join identity.user u on u.tag = s.staff_no where s.id = "+id);
      var resp;
      if(st && st.length > 0){
         var res = await db.query("delete from identity.photo where uid = "+st[0].uid);
         var res = await db.query("delete from identity.user where uid = "+st[0].uid);
         var res = await db.query("delete from identity.user_role where uid = "+st[0].uid);
         resp = await db.query("delete from hrs.staff where id = "+id);
      }
      return res;
   },

   getNewStaffNo : async () => {
      const res = await db.query("select staff_no+1 as staff_no from hrs.staff where staff_no not in ('15666','16000') order by staff_no desc limit 1");
      if(res && res.length > 0) return res[0].staff_no;
      return null;
   },

   fetchStaffProfile : async (staff_no) => {
      const res = await db.query("select s.*,x.title as unit_name,m.title as designation,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name from hrs.staff s left join identity.user u on u.tag = s.staff_no left join utility.unit x on s.unit_id = x.id left join hrs.job m on s.job_id = m.id  where s.staff_no = "+staff_no);
      return res;
   },

   updateStaffProfile : async (staff_no,data) => {
      const res = await db.query("update hrs.staff s set ? where s.staff_no = "+staff_no,data);
      return res;
   },

   findEmail : async (email) => {
      const res = await db.query("select * from hrs.staff where inst_mail = '"+email+"'");
      return res;
   },


   
   // HRUNIT - HRS MODELS

   fetchHRUnit : async (page,keyword) => {
      var sql = "select u.*,upper(concat(s.fname,' ',s.lname)) as head_name,s.staff_no as head_no,m.title as school from utility.unit u left join hrs.staff s on u.head = s.staff_no left join utility.unit m on u.lev2_id = m.id"
      var cql = "select count(*) as total from utility.unit u left join hrs.staff s on u.head = s.staff_no left join utility.unit m on u.lev2_id = m.id";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
         sql += ` where u.title like '%${keyword}%' or u.code like '%${keyword}%' or u.location like '%${keyword}%' or u.head = '${keyword}'`
         cql += ` where u.title like '%${keyword}%' or u.code like '%${keyword}%' or u.location like '%${keyword}%' or u.head = '${keyword}'`
      }

      sql += ` order by u.title`
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

   insertHRUnit : async (data) => {
      const res = await db.query("insert into utility.unit set ?", data);
      return res;
   },

   updateHRUnit : async (id,data) => {
      const res = await db.query("update utility.unit set ? where id = "+id,data);
      return res;
   },


   deleteHRUnit : async (id) => {
      var res = await db.query("delete from utility.unit where id = "+id);
      return res;
   },


   
  // HRUNIT - HRS MODELS

  fetchHRJob : async (page,keyword) => {
      var sql = "select j.* from hrs.job j"
      var cql = "select count(*) as total from hrs.job j";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
         sql += " where j.title like '%${keyword}%' or j.`type` like '%${keyword}%'"
         cql += " where j.title like '%${keyword}%' or j.`type` like '%${keyword}%'"
      }

      sql += ` order by j.title`
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

   insertHRJob : async (data) => {
      const res = await db.query("insert into hrs.job set ?", data);
      return res;
   },

   updateHRJob : async (id,data) => {
      const res = await db.query("update hrs.job set ? where id = "+id,data);
      return res;
   },


   deleteHRJob : async (id) => {
      var res = await db.query("delete from hrs.job where id = "+id);
      return res;
   },



   // HELPERS

   fetchFMShelpers : async () => {
      const progs = await db.query("select * from utility.program where status = 1");
      const bankacc = await db.query("select * from fms.bankacc where status = 1");
      const sessions = await db.query("select * from utility.session where status = 1 order by id desc");
      //const resm = await db.query("select s.session_id as `sessionId`,s.title as `sessionName` from P06.session s where s.status = 1");
      if(progs && progs.length > 0) return { programs:progs, bankacc, sessions }
      return null;
   },

   fetchAIShelpers : async () => {
      const progs = await db.query("select * from utility.program where status = 1");
      const majs = await db.query("select m.*,p.short as program_name,p.code from ais.major m left join utility.program p on m.prog_id = p.id where m.status = 1");
      const depts = await db.query("select * from utility.unit where type = 'ACADEMIC' and level = '3' and active = '1'");
      const courses = await db.query("select * from utility.course where status = 1 order by title");
      //const resm = await db.query("select s.session_id as `sessionId`,s.title as `sessionName` from P06.session s where s.status = 1");
      if(progs && majs) return { programs:progs,majors:majs, departments:depts, courses }
      return null;
   },

   fetchHRShelpers : async () => {
      const countries = await db.query("select * from utility.country where status = 1");
      const regions = await db.query("select * from utility.region where status = 1");
      const units = await db.query("select * from utility.unit where active = '1'");
      const jobs = await db.query("select * from hrs.job where active = '1'");
      const parents = await db.query("select * from utility.unit where active = '1'");
      const schools = await db.query("select * from utility.unit where level = '2' and active = '1'");
      const depts = await db.query("select * from utility.unit where level = '3' and active = '1'");
      const roles = await db.query("select a.arole_id,a.role_name,a.role_desc,p.app_name from identity.app_role a left join identity.app p on a.app_id = p.app_id");
      
      if(jobs && units) return { units,jobs,countries,regions,parents,schools,depts,roles }
      return null;
   },

   fetchAMShelpers : async () => {
      const vendors = await db.query("select * from P06.vendor where status = 1");
      const session = await db.query("select * from P06.session where status = 1");
      const calendars = await db.query("select * from utility.session where `default` = 1");
      const programs = await db.query("select * from utility.program where status = 1");
      const majors = await db.query("select m.*,p.`short` as program_name from ais.major m left join utility.program p on p.id = m.prog_id where m.status = 1");
      const stages = await db.query("select * from P06.stage where status = 1");
      const applytypes = await db.query("select * from P06.apply_type where status = 1");
      const letters = await db.query("select * from P06.letter where status = 1");
      var adm_programs = await db.query("select m.title as major_name,m.id as major_id,p.`short` as program_name,p.id as prog_id from ais.major m join utility.program p on m.prog_id = p.id union select null as major_name, null as major_id, `short` as program_name, id as prog_id from utility.program where flag_majors = 0");
      if(adm_programs && adm_programs.length > 0){
         adm_programs = adm_programs.map((row,i) => {
            row.id = i+1
            return row
         })
      }
      const countries = await db.query("select code_name,title from utility.country where status = 1 order by title asc");
      if(vendors && programs && stages && session && majors && applytypes) return { vendors,programs,majors,stages,applytypes,session: session && session[0],adm_programs,countries,letters,calendars }
      return null;
   },



   // UTILITY


   
};

