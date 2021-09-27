var bcrypt = require('bcrypt');
var moment = require('moment');
var jwt = require('jsonwebtoken');
const fs = require('fs');
const sha1 = require('sha1');
const path = require('path');
const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwzyx', 8)
const digit = customAlphabet('1234567890', 4)
const mailer = require('../../config/email')
const sms = require('../../config/sms')

const { SSO } = require('../../model/mysql/ssoModel');
const { Admission } = require('../../model/mysql/admissionModel');
const { Student } = require('../../model/mysql/studentModel');

const decodeBase64Image = (dataString) => {
  var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
  response = {};
  if (matches.length !== 3) return new Error('Invalid input string');
  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');
  return response;
}

module.exports = {
 
  authenticateUser : async (req,res) => {
      const { username,password } = req.body;
      try{
            var user = await SSO.verifyUser({username,password});
            if(user && user.length > 0){
                var roles = await SSO.fetchRoles(user[0].uid); // Roles
                var photo = await SSO.fetchPhoto(user[0].uid); // Photo
                var userdata = await SSO.fetchUser(user[0].uid,user[0].group_id); // UserData
                userdata[0] = userdata ? { ...userdata[0], user_group : user[0].group_id, mail: user[0].username } : null;
                var data = { roles, photo: ((photo && photo.length) > 0 ? `${req.protocol}://${req.get('host')}/api/photos/?tag=${photo && photo[0].tag}`: `${req.protocol}://${req.get('host')}/api/photos/?tag=00000000`), user:userdata && userdata[0] };
                // Generate Session Token 
                const token = jwt.sign({ data:user }, 'secret', { expiresIn: 60 * 60 });
                data.token = token;
                
                const lgs = await SSO.logger(user[0].uid,'LOGIN_SUCCESS',{username}) // Log Activity
                console.log(lgs)
                res.status(200).json({success:true, data});

            }else{
                const lgs = await SSO.logger(0,'LOGIN_FAILED',{username}) // Log Activity
                console.log(lgs)
                res.status(200).json({success:false, data: null, msg:"Invalid username or password!"});
            }
      }catch(e){
          console.log(e)
          const lgs = await await SSO.logger(0,'LOGIN_ERROR',{username,error:e}) // Log Activity
          console.log(lgs)
          res.status(200).json({success:false, data: null, msg: "System error detected."});
      }
  },


  sendOtp : async (req,res) => {
    var {email} = req.body;
    try{
      var user = !email.includes('@') ? await SSO.fetchUserByPhone(email) : await SSO.verifyUserByEmail({email});
      if(user && user.length > 0){
        const otp = digit() // Generate OTP 
        const dt = { access_token:otp,access_expire:moment().add(5,'minutes').format('YYYY-MM-DD HH:mm:ss') }
        const ups = await SSO.updateUserByEmail(user[0].username,dt)
        var sendcode;
        if(ups){
          const person = await SSO.fetchUser(user[0].uid,user[0].group_id)
          
          // Send OTP-SMS
          const msg = `Hi ${person[0].fname}, Reset OTP code is ${otp}`
          const sm = await sms(person && person[0].phone,msg)
          console.log(sm.code)
          if(sm && sm.code == '1000') sendcode = '1000'
        }
        if(sendcode) { res.status(200).json({success:true, data: {otp,email:user[0].username } }) }
        else { res.status(200).json({ success:false, data: null, msg:"OTP was not sent!" }) }
        
      }else{
        res.status(200).json({ success:false, data: null, msg:"User does not exist!" });
      }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Please try again later."});
    }
  },


  verifyOtp : async (req,res) => {
    const {email,token} = req.body;
    try{
      var user = await SSO.verifyUserByEmail({email});
      if(user && user.length > 0 && user[0].access_token == token){
        res.status(200).json({success:true, data: token }) 
      }else{
        res.status(200).json({ success:false, data: null, msg:"OTP verification failed!" });
      }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Please try again later."});
    }
  },


  sendPwd : async (req,res) => {
    const {email,password} = req.body;
    try{
      const dt = { password : sha1(password.trim()) }
      const ups = await SSO.updateUserByEmail(email,dt)
      if(ups){ res.status(200).json({success:true, data: 'password changed!' }) 
      }else{
        res.status(200).json({ success:false, data: null, msg:"Password change failed!" });
      }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Please try again later."});
    }
  },

  stageusers : async (req,res) => {
    try{
        const students = await Student.fetchUsers('01');
        const staff = await Student.fetchUsers('02');
        var count = 0;
        if(students && students.length > 0){
          for(user of students){
            const pwd = nanoid()
            if(user.phone && count < 1){
              const ups = await SSO.updateUserByEmail(user.username,{password: sha1(pwd)})
              const msg = `Hello ${user.fname.toLowerCase()}, Login info, U: ${user.username}, P: ${pwd} Goto https://portal.aucc.edu.gh to access portal.`
              const resp = sms(user.phone,msg);
              //if(resp.code == '1000') 
              count = count + 1
              console.log(count)
              console.log(resp.code)
            }
          }
        }
        if(staff && staff.length > 0){
          for(user of staff){
            const pwd = nanoid()
            if(user.phone){
              const ups = await SSO.updateUserByEmail(user.username,{password: sha1(pwd)})
              const msg = `Hello ${user.fname.toLowerCase()}, Login info, U: ${user.username}, P: ${pwd} Goto https://portal.aucc.edu.gh to access portal.`
              const resp = sms(user.phone,msg);
              //if(resp.code == '1000') 
              count += 1
              console.log(count)
              console.log(resp.code)
            }
          } 
        }
        res.status(200).json({success:true, data: count })
       
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Please try again later."});
    }
  },

  testsms : async (req,res) => {
    try{
      const pwd = nanoid()
       const msg = `Hello kobby, Login info, U: test\@st.aucc.edu.gh, P: ${pwd} Goto https://portal.aucc.edu.gh to access portal.`
       const resp = sms('0277675089',msg);
       //if(resp.code == '1000') 
       console.log(resp.code)
       res.status(200).json({success:true, data: resp })
       
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Please try again later."});
    }
  },

  
  fetchPhoto : async (req,res) => {
      const tag = req.query.tag;
      var pic = await SSO.fetchPhoto(tag); // Photo
      if(pic.length > 0){
          var filepath = path.join(__dirname,'/../../', pic[0].path);
          try{
            var stats = fs.statSync(filepath);
            console.log(stats);
            if(stats){
              res.status(200).sendFile(path.join(__dirname,'/../../', pic[0].path));
            }else{
              res.status(200).sendFile(path.join(__dirname, '/../../public/cdn/photo', 'none.png'));
            } 
          }catch(e){
             console.log(e);
             res.status(200).sendFile(path.join(__dirname, '/../../public/cdn/photo', 'none.png'));
          }
      }else{
          res.status(200).sendFile(path.join(__dirname, '/../../public/cdn/photo', 'none.png'));
      }
  },

  postPhoto : async (req,res) => {
      const { tag,group_id,lock } = req.body;
      var mpath;
      switch(group_id){
        case '01': mpath = 'student'; break;
        case '02': mpath = 'staff'; break;
        case '03': mpath = 'nss'; break;
        case '04': mpath = 'applicant'; break;
        case '05': mpath = 'alumni'; break;
        default: mpath = 'student'; break;
      }
      var imageBuffer = decodeBase64Image(req.body.photo);
      const dest = path.join(__dirname, '/../../public/cdn/photo/'+mpath, tag.trim().toLowerCase()+'.'+(imageBuffer.type.split('/')[1]));
      const dbpath = './public/cdn/photo/'+mpath+'/'+tag.trim().toLowerCase()+'.'+(imageBuffer.type.split('/')[1]);
      console.log(`Tag: ${tag}, Group ID: ${group_id}`)
      fs.writeFile(dest, imageBuffer.data, async function(err) {
        if(err) res.status(200).json({success:false, data: null, msg:"Photo not saved!"});
        const ssoUser = await SSO.fetchSSOUser(tag)
        if(ssoUser.length > 0){
         
          const insertData = !ssoUser[0].photo_id ? await SSO.insertPhoto(ssoUser[0].uid,tag,group_id,dbpath) : await SSO.updatePhoto(ssoUser[0].photo_id,dbpath)
          if(lock){
            if(group_id == '01'){
              const slk = await Student.updateStudentProfile(tag,{flag_photo_lock:1})
            }
          } 
          const stphoto = `${req.protocol}://${req.get('host')}/api/photos/?tag=${tag}`
          if(insertData) res.status(200).json({success:true, data:stphoto});
        }
      });
  },

  // APPLICATION MODULES

  /* AMS Module Logics */

  
  // SESSION CONTROLS

  fetchSessions : async (req,res) => {
    try{
        var sessions = await SSO.fetchSessions();
        if(sessions && sessions.length > 0){
            res.status(200).json({success:true, data:sessions});
        }else{
            res.status(200).json({success:false, data: null, msg:"No records!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong error !"});
    }
  },


  postSession : async (req,res) => {
    console.log(req.body);
      try{
        const { session_id } = req.body;
        var resp
        if(session_id > 0){ // Updates
          resp = await SSO.updateSession(session_id,req.body);
        }else{ // Insert
          resp = await SSO.insertSession(req.body);
        }

        if(resp){
          res.status(200).json({success:true, data:resp});
        }else{
          res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
      }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong happened!"});
      }
  },

  deleteSession : async (req,res) => {
    try{
        const { id } = req.params;
        var resp = await SSO.deleteSession(id);
        if(resp){
            res.status(200).json({success:true, data:resp});
        }else{
            res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong !"});
    }
  },

  setDefaultSession : async (req,res) => {
     try{
        const { id } = req.params;
        var resp = await SSO.setDefaultSession(id);
        if(resp){
            res.status(200).json({success:true, data:resp});
        }else{
            res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
     }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong !"});
     }
  },



  // VENDOR CONTROLS

  fetchVendors : async (req,res) => {
    try{
        var vendors = await SSO.fetchVendors();
        if(vendors && vendors.length > 0){
            res.status(200).json({success:true, data:vendors});
        }else{
            res.status(200).json({success:false, data: null, msg:"No records!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong !"});
    }
  },


  postVendor : async (req,res) => {
    console.log(req.body);
      try{
        const { vendor_id } = req.body;
        var resp
        if(vendor_id > 0){ // Updates
          resp = await SSO.updateVendor(vendor_id,req.body);
        }else{ // Insert
          resp = await SSO.insertVendor(req.body);
        }

        if(resp){
          res.status(200).json({success:true, data:resp});
        }else{
          res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
      }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong happened!"});
      }
  },

  deleteVendor : async (req,res) => {
    try{
        const { id } = req.params;
        var resp = await SSO.deleteVendor(id);
        if(resp){
            res.status(200).json({success:true, data:resp});
        }else{
            res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong !"});
    }
  },


  // VOUCHER CONTROLS

  fetchVouchers : async (req,res) => {
    try{
        const id = req.params.id;
        const sell_type = req.query.sell_type;
        const page = req.query.page;
        const keyword = req.query.keyword;
        
        if(sell_type){
          var vouchers = await SSO.fetchVouchersByType(id,sell_type);
        }else{
          var vouchers = await SSO.fetchVouchers(id,page,keyword);
        }
       
        if(vouchers && vouchers.data.length > 0){
          res.status(200).json({success:true, data:vouchers});
        }else{
          res.status(200).json({success:false, data: null, msg:"No records!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong !"});
    }
  },


  postVoucher : async (req,res) => {
      try{
        const { session_id,quantity,group_id,sell_type,vendor_id,created_by } = req.body;
        var resp
        if(session_id && session_id > 0){ 
          var lastIndex = await SSO.getLastVoucherIndex(session_id)
          if(quantity > 0){
            for(var i = 1; i <= quantity; i++){
              let dt = { serial: lastIndex+i, pin: nanoid(),session_id,group_id,sell_type,vendor_id,created_by}
              resp = await SSO.insertVoucher(dt);
            }
          }
        }

        if(resp){
          res.status(200).json({success:true, data:resp});
        }else{
          res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
      }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong happened!"});
      }
  },

  deleteVoucher : async (req,res) => {
    try{
        const { id } = req.params;
        var resp = await SSO.deleteVoucher(id);
        if(resp){
            res.status(200).json({success:true, data:resp});
        }else{
            res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong !"});
    }
  },

  recoverVoucher : async (req,res) => {
    try{
      const { serial,email,phone } = req.body;
      console.log(req.body)
      var resp
      if(serial && email){ 
         const sr = await SSO.fetchVoucherBySerial(serial);
         if(sr && sr.length > 0){
           const ms = { title: "AUCC VOUCHER", message : `Your recovered voucher details are: [ SERIAL: ${serial}, PIN: ${sr[0].pin} ]` }
           mailer(email.trim(),ms.title,ms.message)
           resp = sr;
         }
      }else if(phone){
         const sr = await SSO.fetchVoucherByPhone(phone);
         console.log(phone)
         if(sr && sr.length > 0){
           const message = `Hello! voucher for ${sr[0].applicant_name} is : ( SERIAL: ${sr[0].serial} PIN: ${sr[0].pin} )`;
           sms(phone,message)
           resp = sr;
         }
      }

      if(resp){
        res.status(200).json({success:true, data:resp});
      }else{
        res.status(200).json({success:false, data: null, msg:"INVALID VOUCHER INFO PROVIDED !"});
      }
    }catch(e){
      console.log(e)
      res.status(200).json({success:false, data: null, msg: "Something wrong happened!"});
    }
},


// APPLICANTS CONTROLS

fetchApplicants : async (req,res) => {
  try{
      const id = req.params.id;
      const sell_type = req.query.sell_type;
      const page = req.query.page;
      const keyword = req.query.keyword;
      if(sell_type){
        var applicants = await SSO.fetchApplicantsByType(id,sell_type);
      }else{
        var applicants = await SSO.fetchApplicants(id,page,keyword);
      }
     
      if(applicants && applicants.data.length > 0){
          res.status(200).json({success:true, data:applicants});
      }else{
          res.status(200).json({success:false, data: null, msg:"No records!"});
      }
  }catch(e){
      console.log(e)
      res.status(200).json({success:false, data: null, msg: "Something went wrong !"});
  }
},


fetchApplicant : async (req,res) => {
  try{
      const { serial } = req.params;
      var data = {};
      // Get Instance of Applicant
      const instance = await Admission.fetchMeta(serial);
      if(instance && instance.length > 0){
         data.isNew = false
         data.user = { photo : instance[0].photo, serial:instance[0].serial, name: instance[0].applicant_name, group_name: instance[0].group_name }
         data.flag_submit = instance[0].flag_submit
         data.stage_id = instance[0].stage_id
         data.apply_type = instance[0].apply_type
         // Load Applicant Form Meta
         var meta;
         if(instance[0].meta != null){
           meta = JSON.parse(instance[0].meta);
         }else{
           let stage = await Admission.fetchStageByGroup(applicant[0].group_id);
           meta = stage && JSON.parse(stage[0].formMeta);
         }
         var newMeta = {}
         for(var mt of meta){
            if(!['complete','review'].includes(mt.tag)){
               const vl = await Admission.fetchTagData(serial,mt.tag)
               if(vl && vl.length > 0) newMeta = { ...newMeta, [mt.tag] : (['profile','guardian'].includes(mt.tag) ? vl[0]:vl) }
            }
            if(mt.tag == 'result'){
              const grades = await Admission.fetchResultGrades(serial);
              if(grades && grades.length > 0) newMeta = { ...newMeta, grade:grades }
            }
         } 
          data.data = newMeta  
          data.meta = meta
          data.count = meta.length;
          console.log(data.user)
          res.json({success:true, data});

      }else{
          res.json({success:false, data: null, msg:"Action failed!"});
      }

  }catch(e){
      console.log(e)
      res.json({success:false, data: null, msg: "Something wrong !"});
  }
},



// STUDENT CONTROLS

fetchStudents : async (req,res) => {
  try{
      const page = req.query.page;
      const keyword = req.query.keyword;
      
      var students = await SSO.fetchStudents(page,keyword);
     
      if(students && students.data.length > 0){
        res.status(200).json({success:true, data:students});
      }else{
        res.status(200).json({success:false, data: null, msg:"No records!"});
      }
  }catch(e){
      console.log(e)
      res.status(200).json({success:false, data: null, msg: "Something went wrong !"});
  }
},


postVoucher : async (req,res) => {
    try{
      const { session_id,quantity,group_id,sell_type,vendor_id,created_by } = req.body;
      var resp
      if(session_id && session_id > 0){ 
        var lastIndex = await SSO.getLastVoucherIndex(session_id)
        if(quantity > 0){
          for(var i = 1; i <= quantity; i++){
            let dt = { serial: lastIndex+i, pin: nanoid(),session_id,group_id,sell_type,vendor_id,created_by}
            resp = await SSO.insertVoucher(dt);
          }
        }
      }

      if(resp){
        res.status(200).json({success:true, data:resp});
      }else{
        res.status(200).json({success:false, data: null, msg:"Action failed!"});
      }
    }catch(e){
      console.log(e)
      res.status(200).json({success:false, data: null, msg: "Something wrong happened!"});
    }
},

deleteVoucher : async (req,res) => {
  try{
      const { id } = req.params;
      var resp = await SSO.deleteVoucher(id);
      if(resp){
          res.status(200).json({success:true, data:resp});
      }else{
          res.status(200).json({success:false, data: null, msg:"Action failed!"});
      }
  }catch(e){
      console.log(e)
      res.status(200).json({success:false, data: null, msg: "Something wrong !"});
  }
},

recoverVoucher : async (req,res) => {
  try{
    const { serial,email,phone } = req.body;
    console.log(req.body)
    var resp
    if(serial && email){ 
       const sr = await SSO.fetchVoucherBySerial(serial);
       if(sr && sr.length > 0){
         const ms = { title: "AUCC VOUCHER", message : `Your recovered voucher details are: [ SERIAL: ${serial}, PIN: ${sr[0].pin} ]` }
         mailer(email.trim(),ms.title,ms.message)
         resp = sr;
       }
    }else if(phone){
       const sr = await SSO.fetchVoucherByPhone(phone);
       console.log(phone)
       if(sr && sr.length > 0){
         const message = `Hello! voucher for ${sr[0].applicant_name} is : ( SERIAL: ${sr[0].serial} PIN: ${sr[0].pin} )`;
         sms(phone,message)
         resp = sr;
       }
    }

    if(resp){
      res.status(200).json({success:true, data:resp});
    }else{
      res.status(200).json({success:false, data: null, msg:"INVALID VOUCHER INFO PROVIDED !"});
    }
  }catch(e){
    console.log(e)
    res.status(200).json({success:false, data: null, msg: "Something wrong happened!"});
  }
},


  


   

}

