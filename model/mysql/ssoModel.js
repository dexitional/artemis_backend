const moment =  require('moment');
var db = require('../../config/mysql');

module.exports.SSO = {
   
   verifyUser : async ({username,password}) => {
      const sql = "select u.* from identity.user u where u.username = '"+username+"' and password = sha1('"+password+"')";
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

   sellVoucher : async (formId,collectorId,sessionId,buyerName,buyerPhone,tid) => {
      const pr = await db.query("select * from P06.price p where p.price_id = "+formId);
      const vd = await db.query("select c.vendor_id from fms.collector c left join P06.vendor v on c.vendor_id = v.vendor_id where c.id = "+collectorId);
      if(pr && vd){
        const vc = await db.query("select serial,pin from P06.voucher where vendor_id = "+vd[0].vendor_id+" and session_id ="+sessionId+" and group_id = '"+pr[0].group_id+"' and sell_type = "+pr[0].sell_type+" and sold_at is null");
        if(vc && vc.length > 0){
            console.log(vc);
            // Update Voucher Status & Buyer Details
            const dm = { applicant_name: buyerName, applicant_phone: buyerPhone, sold_at: new Date()}
            const ups = await db.query("update P06.voucher set ? where serial = "+vc[0].serial,dm);
            if(ups.affectedRows > 0) { 
               // Insert Voucher Sales Log - Success
               const vlog = { tid,session_id:sessionId,serial:vc[0].serial,pin:vc[0].pin,buyer_name:buyerName,buyer_phone:buyerPhone,generated:1 }
               const vins = await db.query("insert into fms.voucher_log set ?",vlog);
               return { ...vc[0],logId:vins.insertId }

            } else{ 
               // Insert Voucher Sales Log - Error
               const vlog = { tid,session_id:sessionId,serial:null,pin:null,buyer_name:buyerName,buyer_phone:buyerPhone,generated:0 }
               const vins = await db.query("insert into fms.voucher_log set ?",vlog);
               return null
            }
        }else{
          
          // Insert Voucher Sales Log - Error
          const vlog = { tid,session_id:sessionId,serial:null,pin:null,buyer_name:buyerName,buyer_phone:buyerPhone,generated:0 }
          const vins = await db.query("insert into fms.voucher_log set ?",vlog);
          return null
        }
      }else{
         // Insert Voucher Sales Log - Error
         const vlog = { tid,session_id:sessionId,serial:null,pin:null,buyer_name:buyerName,buyer_phone:buyerPhone,generated:0 }
         const vins = await db.query("insert into fms.voucher_log set ?",vlog);
         return null
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

   fetchRegsList : async (session_id) => {
      var data = []
      const res = await db.query("select distinct r.indexno from ais.activity_register r where r.session_id = "+session_id);
      if(res && res.length > 0){
         for(var r of res){
            const resm = await db.query("select r.*,s.fname,s.mname,s.lname,s.refno,x.title as session_name from ais.activity_register r left join ais.student s on r.indexno = s.indexno left join utility.session x on x.id = r.session_id where r.indexno = '"+r.indexno+"' and r.session_id = "+session_id+" order by r.id desc limit 1");
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

   


   // CALENDAR -AIS
   
   getActiveSessionByMode : async (mode_id) => {
      const res = await db.query("select * from utility.session where `default` = 1  and mode_id = "+mode_id);
      return res && res[0]
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
      var sql = "select b.*,p.`short` as program_name from fms.billinfo b left join utility.program p on p.id = b.prog_id"
      var cql = "select count(*) as total from fms.billinfo b";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where b.narrative like '%${keyword}%' or b.tag like '%${keyword}%' or b.group_code = '${keyword}' or b.amount = '${keyword}'`
          cql += ` where b.narrative like '%${keyword}%' or b.tag like '%${keyword}%' or b.group_code = '${keyword}' or b.amount = '${keyword}'`
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

   sendStudentBillGh : async (bid,bname,amount,prog_id,sem) => {
      var count = 0;
      const sess = await db.query("select id from utility.session where mode_id = 1 and `default` = 1");
      const sts = await db.query("select s.refno,s.indexno from ais.student s where s.complete_status = 0 and s.prog_id  = "+prog_id+" and find_in_set(s.semester,'"+sem+"') > 0");
      if(sts.length > 0){
         for(var st of sts){
            const ins = await db.query("insert into fms.studtrans set ?",{narrative:bname,bill_id:bid,amount,refno:st.refno,session_id:sess[0].id})
            if(ins.insertId > 0) count++;
         }
      }
      return count;
   },

   sendStudentBillInt : async (bid,bname,amount,sem) => {
      var count = 0;
      const sess = await db.query("select id from utility.session where mode_id = 1 and `default` = 1");
      const sts = await db.query("select s.refno,s.indexno from ais.student s where s.complete_status = 0 and s.entry_mode = 'INT' and find_in_set(s.semester,'"+sem+"') > 0");
      if(sts.length > 0){
         for(var st of sts){
            const ins = await db.query("insert into fms.studtrans set ?",{narrative:bname,bill_id:bid,amount,refno:st.refno,session_id:sess[0].id})
            if(ins.insertId > 0) count++;
         }
      }
      return count;
   },


   // BILL ITEMS - FMS

   fetchBillItems : async (page,keyword) => {
      var sql = "select b.* from fms.billitem i left join fms.billinfo b on find_in_set(b.bid,i.bid) > 0"
      var cql = "select count(*) as total from fms.billitem i left join fms.billinfo b on find_in_set(b.bid,i.bid) > 0";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where i.narrative like '%${keyword}%' or b.narrative like '%${keyword}%' or b.tag like '%${keyword}%' or b.group_code = '${keyword}' or b.amount = '${keyword}'`
          cql += ` where i.narrative like '%${keyword}%' or b.narrative like '%${keyword}%' or b.tag like '%${keyword}%' or b.group_code = '${keyword}' or b.amount = '${keyword}'`
      }

      sql += ` order by i.narrative asc`
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


   // FEE PAYMENTS - FMS
   
   fetchPayments : async (page,keyword) => {
      var sql = "select t.*,s.indexno,concat(trim(s.fname),' ',trim(s.lname)) as name,b.tag as tag,b.bank_account from fms.transaction t left join ais.student s on s.refno = t.refno left join fms.bankacc b on b.id = t.bankacc_id where t.transtype_id = 2"
      var cql = "select count(*) as total from fms.transaction t left join ais.student s on s.refno = t.refno  where t.transtype_id = 2";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` and s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or t.amount = '${keyword}'`
          cql += ` and s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or t.amount = '${keyword}'`
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
      const st = await db.query("select x.id from ais.student s left join utility.program p on s.prog_id = p.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and s.refno = '"+refno+"'");
      const fin = await db.query("select * from fms.studtrans where tid = "+tid);
      const dt = { tid,amount,refno,session_id:(st && st[0].id),narrative:`${refno} FEES PAYMENT, TRANSID: ${transid}`}
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
      const st = await db.query("select x.id,p.prefix,p.stype,date_format(s.doa,'%m%y') as code,s.indexno from ais.student s left join utility.program p on s.prog_id = p.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and s.refno = '"+refno+"'");
      if(st && st.length > 0){
         const prefix = `${st[0].prefix.trim()}${st[0].code.trim()}${st[0].stype}`
         var newIndex, resp, no;
         const sm = await db.query("select indexno,prog_count from ais.student where indexno like '"+prefix+"%' order by prog_count desc limit 1");
         if(sm && sm.length > 0){
            no = sm[0].prog_count+1;
            var newNo;
            switch(no.toString().length){
               case 1: newNo = `00${no}`; break;
               case 2: newNo = `0${no}`; break;
               case 3: newNo = `${no}`; break;
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
      const ms = await this.SSO.updateStudFinance(id,refno,amount,transid)
      console.log(ms)
      if(rs && ms) return rs;
      return null
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
      const res = await db.query("select s.*,x.long_name as unit_name,m.title as designation,concat(s.fname,' ',ifnull(concat(mname,' '),''),s.lname) as name from hrs.staff s left join identity.user u on u.tag = s.staff_no left join utility.unit x on s.unit_id = x.id left join hrs.job m on s.job_id = m.id  where s.staff_no = "+staff_no);
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
      //const resm = await db.query("select s.session_id as `sessionId`,s.title as `sessionName` from P06.session s where s.status = 1");
      if(progs && progs.length > 0) return { programs:progs, bankacc }
      return null;
   },

   fetchAIShelpers : async () => {
      const progs = await db.query("select * from utility.program where status = 1");
      const majs = await db.query("select * from ais.major where status = 1");
      //const resm = await db.query("select s.session_id as `sessionId`,s.title as `sessionName` from P06.session s where s.status = 1");
      if(progs && majs) return { programs:progs,majors:majs }
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
      const programs = await db.query("select * from utility.program where status = 1");
      const majors = await db.query("select m.*,p.`short` as program_name from ais.major m left join utility.program p on p.id = m.prog_id where m.status = 1");
      const stages = await db.query("select * from P06.stage where status = 1");
      const applytypes = await db.query("select * from P06.apply_type where status = 1");
      if(vendors && programs && stages && session && majors && applytypes) return { vendors,programs,majors,stages,applytypes,session: session && session[0] }
      return null;
   },

   
};

