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

   insertSSOUser : async (data) => {
      const sql = "insert into identity.user set ?";
      const res = await db.query(sql,data);
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

   fetchVoucherGroups : async () => {
      const res = await db.query("select p.price_id as formId,p.title as formName,p.currency,p.amount as serviceCharge from P06.price p where p.status = 1");
      const resm = await db.query("select s.session_id as `sessionId`,s.title as `sessionName` from P06.session s where s.status = 1");
      if(res && res.length > 0 && resm && resm.length > 0) return {...resm[0],forms:[...res]}
      return null;
   },

   sellVoucher : async (formId,collectorId,sessionId,buyerName,buyerPhone) => {
      const pr = await db.query("select * from P06.price p where p.price_id = "+formId);
      const vd = await db.query("select c.vendor_id from fms.collector c left join P06.vendor v on c.vendor_id = v.vendor_id where c.id = "+collectorId);
      if(pr && vd){
        const vc = await db.query("select serial,pin from P06.voucher where vendor_id = "+vd[0].vendor_id+" and session_id ="+sessionId+" and group_id = '"+pr[0].group_id+"' and sell_type = "+pr[0].sell_type+" and sold_at is null");
        if(vc && vc.length > 0){
          console.log(vc);
          const dm = { applicant_name: buyerName, applicant_phone: buyerPhone, sold_at: new Date()}
          const ups = await db.query("update P06.voucher set ? where serial = "+vc[0].serial,dm);
          if(ups.affectedRows > 0) { return vc[0] } else{ return null }
        }else{
          return null
        }
      }else{
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
      const res = await db.query("insert into fms.transaction set ?", data);
      return res;
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
      var sql = "select t.*,s.indexno,concat(trim(s.fname),' ',trim(s.lname)) as name,b.tag as tag,b.bank_account from fms.transaction t left join ais.student s on s.refno = t.refno left join fms.bankacc b on b.id = t.bankacc_id"
      var cql = "select count(*) as total from fms.transaction t left join ais.student s on s.refno = t.refno";
      
      const size = 10;
      const pg  = parseInt(page);
      const offset = (pg * size) || 0;
      
      if(keyword){
          sql += ` where s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or t.amount = '${keyword}'`
          cql += ` where s.fname like '%${keyword}%' or s.lname like '%${keyword}%' or t.amount = '${keyword}'`
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
      const res = await db.query("select t.*,s.indexno,concat(trim(s.fname),' ',trim(s.lname)) as name,b.tag as tag,b.bank_account from fms.transaction t left join ais.student s on s.refno = t.refno left join fms.bankacc b on b.id = t.bankacc_id where t.id = "+id);
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

   updateStudFinance : async (tid,refno,amount) => {
      const st = await db.query("select x.id from ais.student s left join utility.program p on s.prog_id = p.id left join utility.session x on x.mode_id = p.mode_id where x.default = 1 and s.refno = "+refno);
      const fin = await db.query("select * from fms.studtrans where tid = "+tid);
      const dt = { tid,amount,refno,session_id:st && st[0].id,narrative:`${refno} : FEES PAYMENT - AUCC_FIN `}
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

   
};

