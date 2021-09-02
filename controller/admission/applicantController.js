var bcrypt = require('bcrypt');
var moment = require('moment');
var jwt = require('jsonwebtoken');
const { Admission } = require('../../model/mysql/admissionModel');

module.exports = {
 
  authenticateApplicant : async (req,res) => {
      const { serial,pin } = req.body;
      try{
            var applicant = await Admission.verifyVoucher({serial,pin});
            if(applicant && applicant.length > 0 && applicant[0].status == 1){
                var data = {};
                // Generate Session Token 
                const token = jwt.sign({data:applicant}, 'secret', { expiresIn: 60 * 60 });
                data.token = token;
                // Get Instance of Applicant
                const instance = await Admission.fetchMeta(serial);
                if(instance && instance.length > 0){
                   data.isNew = false
                   data.user = { photo : instance[0].photo, serial, pin, name: instance[0].applicant_name, group_name: instance[0].group_name }
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
                        console.log(grades)
                        if(grades && grades.length > 0) newMeta = { ...newMeta, grade:grades }
                     }
                   } 
                   data.data = newMeta  
                   data.meta = meta
                   data.count = meta.length;
                   // Load Notes
                   const notes = await Admission.fetchNotes(serial);
                   data.notification = notes;
                
                }else{

                   data.isNew = true
                   // Load Staged Form Meta
                   let stage = await Admission.fetchStageByGroup(applicant[0].group_id);
                   var meta = stage && JSON.parse(stage[0].formMeta);
                   data.meta = meta
                   data.count = meta.length
                   // Make Applicant & Set User
                   let ap = { serial, stage_id:stage[0].stage_id, meta:JSON.stringify(meta) }
                   await Admission.makeApplicant(ap);
                   data.user = { serial, pin, stage_id:stage[0].stage_id }
                   
                   // Make Welcome Note
                   let nt = { serial, title:'Welcome ',content:'<p>We are happy to notify you that you have successfully started application procedure. Please feel free to contact support if challenges encountered. Thank you!</p>',excerpt:'We are happy to notify you that you have successfully started application procedure.',receiver:'cherished applicant' }
                   await Admission.makeNote(nt);
                   // Load Notes
                   const notes = await Admission.fetchNotes(serial);
                   data.notification = notes;
                }
                console.log(data);
                res.status(200).json({success:true, data});

            }else if(applicant && applicant.length > 0 && applicant[0].status == 0){
                res.status(200).json({success:false, data: null, msg:"Voucher is inactive!"});
            }else{
                res.status(200).json({success:false, data: null, msg:"Voucher does not exist!"});
            }
      }catch(e){
          console.log(e)
          res.status(200).json({success:false, data: null, msg: "System error detected."});
      }
  },

  saveForm : async (req,res) => {
      //console.log(req.body);
      const { serial,stage_id,apply_type,photo,meta,flag_submit,grade_value,class_value } = req.body;
      const { profile,guardian,education,result,grade,choice,document,referee,qualification,employment } = req.body.data;
      
      const aplData = { serial,stage_id,apply_type,photo,meta: JSON.stringify(meta),flag_submit,grade_value,class_value }
      const profileData = { serial,citizen_country:profile.citizen_country,disabilities:profile.disabilities,disabled:profile.disabled,dob:profile.dob,email:profile.email,fname:profile.fname,home_region:profile.home_region,home_town:profile.home_town,lname:profile.lname,mstatus:profile.mstatus,phone:profile.phone,pobox_address:profile.pobox_address,religion:profile.religion,resident_address:profile.resident_address,resident_country:profile.resident_country,title:profile.title,present_occupation:profile.present_occupation,work_place:profile.work_place,gender:profile.gender,bond_status:profile.bond_status,bond_institute:profile.bond_institute,profile_id:profile.profile_id }
      const guardianData = { serial,address:guardian.address,email:guardian.email,fname:guardian.fname,lname:guardian.lname,occupation:guardian.occupation,phone:guardian.phone,relation:guardian.relation,title:guardian.title,guardian_id:guardian.guardian_id }
      console.log(document);
      try{
        // Save Applicant Tbl Data
        //console.log(aplData);
        
        var apl = await Admission.updateApplicantTbl(aplData); 
        var output = {};
        // Save Form Data
        for(var mt of meta){
          const tag = mt.tag;
          switch(tag){
            case 'profile':
              output['profile'] = await Admission.insReplaceProfileTbl(profileData); break; // Profile
            case 'guardian':
              output['guardian'] = await Admission.insReplaceGuardianTbl(guardianData); break; // Guardian
            case 'education':
              output['education'] = await Admission.insReplaceEducationTbl(serial,education); break; // Education 
            case 'result':
              output['result'] = await Admission.insReplaceResultTbl(serial,result,grade); break; // Result
            case 'choice':
              output['choice'] = await Admission.insReplaceChoiceTbl(serial,choice); break; // Result
            case 'document':
              output['document'] = await Admission.insReplaceDocumentTbl(serial,document); break; // Document
            default: null; break;  
          }
        } console.log(output)
   
        // LOAD NEW DATA FOR APPLICANT
        const instance = await Admission.fetchMeta(serial);
        var data = {};
        if(instance && instance.length > 0){
           data.isNew = false
           data.user = { photo : instance[0].photo, serial, name: instance[0].applicant_name }
           data.flag_submit = instance[0].flag_submit
           data.flag_admit = instance[0].flag_admit
           data.stage_id = instance[0].stage_id
           data.apply_type = instance[0].apply_type
           // Load Applicant Form Meta
           var newMeta = {}
           for(var mt of meta){
              if(!['complete','review'].includes(mt.tag)){
                 const vl = await Admission.fetchTagData(serial,mt.tag)
                 if(vl && vl.length > 0) newMeta = { ...newMeta, [mt.tag] : (['profile','guardian'].includes(mt.tag) ? vl[0]:vl) }
              }
              if(mt.tag == 'result'){
                 const grades = await Admission.fetchResultGrades(serial);
                 console.log(grades)
                 if(grades && grades.length > 0) newMeta = { ...newMeta, grade:grades }
              }
           }  
           data.data = newMeta  
           data.meta = meta
           data.count = meta.length;
           // Load Notes
           const notes = await Admission.fetchNotes(serial);
           data.notification = notes;
        }
        res.status(200).json({success:true, data});

      }catch(e){
        console.log(e);
        res.status(200).json({success:false, data: null, msg: "System error detected."});
      }
    
  },

  formStatus : async (req,res) => {
    console.log(req.body);
    const { serial,status } = req.body;
    try{
      var ok = await Admission.updateApplicationStatus(serial,status);
      if(ok){
        res.status(200).json({success:true, data});
      }else{
        res.status(200).json({success:false, data: null, msg:"Action failed!"});
      }
    }catch(e){
      res.status(200).json({success:false, data: null, msg: "System error detected."});
    }
  },


}

