var bcrypt = require('bcrypt');
var moment = require('moment');
var jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwzyx', 8)
const mailer = require('../../config/email')
const sms = require('../../config/sms')

const { SSO } = require('../../model/mysql/ssoModel');
const { Admission } = require('../../model/mysql/admissionModel');
const { Student } = require('../../model/mysql/studentModel');

module.exports = {
 
  // Profile

  fetchStudentData : async (req,res) => {
    const refno = req.params.refno
    try{
        var student = await Student.fetchStudentProfile(refno);
        if(student && student.length > 0){
            res.status(200).json({success:true, data:student[0]});
        }else{
            res.status(200).json({success:false, data: null, msg:"No records!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong error !"});
    }
  },


  postStudentData : async (req,res) => {
    console.log(req.body);
      try{
        const { refno } = req.body;
        var resp
        if(refno){ 
          resp = await Student.updateStudentProfile(refno,req.body);
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

  deleteStudentData : async (req,res) => {
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

  disableStudent : async (req,res) => {
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
        res.status(200).json({success:false, data: null, msg: "Something went wrong!"});
     }
  },

  // Registration

  fetchStudentSlip : async (req,res) => {
      const indexno = req.query.indexno
      const session_id = req.query.session_id
      try{
          var slip = await Student.fetchStudentSlip(session_id,indexno);
          if(slip && slip.length > 0){
              res.status(200).json({success:true, data:slip});
          }else{
              res.status(200).json({success:true, data:[], msg:"No records!"});
          }
      }catch(e){
          console.log(e)
          res.status(200).json({success:false, data: null, msg: "Something went wrong!"});
      }
  },
  

  fetchStudentSlipAIS : async (req,res) => {
      const indexno = req.query.indexno
      const session_id = req.query.session_id
      try{
          var user = await Student.fetchStudentProfile(indexno);
          var slip = await Student.fetchStudentSlip(session_id,indexno);
          if(slip && slip.length > 0){
              res.status(200).json({success:true, data:{ regdata:slip, user: user && user[0] }});
          }else{
              res.status(200).json({success:true, data:[], msg:"No records!"});
          }
      }catch(e){
          console.log(e)
          res.status(200).json({success:false, data: null, msg: "Something went wrong!"});
      }
  },  

  fetchStudentReg : async (req,res) => {
      const refno = req.query.refno
      const session_id = req.query.session_id
      try{
          var student = await Student.fetchStudentProfile(refno);
          if(student && student.length > 0){
           
            const {prog_id,semester,major_id,indexno,session_semester} = student[0];
            var courses = {core: [], elective: [], trail: [], meta:null}
            
            const ce = await Student.fetchStudentCE(prog_id,semester); // Get Core & General Electives
            const me = await Student.fetchStudentME(major_id,prog_id,semester); // Get Majoring Electives
            const rt = await Student.fetchStudentRT(indexno); // Get Trailed Courses
            const mt = await Student.fetchRegMeta(prog_id,semester); // Get Registration
            if(ce.length  > 0){
              for(var row of ce){
                if(row.type == 'E') courses.elective.push({...row, selected: false})
                if(row.type == 'C') courses.core.push({...row, selected: false})
              }
            }
            if(me.length  > 0){
              for(var row of me){
                if(row.type == 'E') courses.elective.push({...row, selected: false})
              }
            }
            if(rt.length  > 0){
              for(var row of rt){
                /*
                if(session_semester == 1){ // Courses Trailed in First Semeter Only
                  if(row.semester && (row.semester%2) == 1) courses.trail.push({...row, type:'R', selected:false, lock:0 })
                }else{ // Courses Trailed in Second Semeter Only
                  if(row.semester && (row.semester%2) == 0) courses.trail.push({...row, type:'R', selected:false, lock:0 })
                }
                */
                if(session_semester == 1) courses.trail.push({...row, type:'R', selected:false, lock:0 })
              }
            }
            if(mt.length  > 0){
              let mdata = mt[0];
              const mj = JSON.parse(mt[0].info).find(r => r.major_id == major_id)
              if(mj) courses.meta = { min_credit:mj.min_credit, max_credit:mj.max_credit, max_elective:mj.max_elective, elective_remark:`[ ADD ${mj.max_elective} ELECTIVES ONLY ]` };
            }console.log(courses)
            //...mt[0],
            
            res.status(200).json({success:true, data:courses});
          }else{
            res.status(200).json({success:false, data:{}, msg:"No records!"});
          }
      }catch(e){
          console.log(e)
          res.status(200).json({success:false, data: null, msg: "Something went wrong!"});
      }
  },


  postStudentReg : async (req,res) => {
      try{
        const { session_id,scheme_id,semester,indexno,core,elective,trail } = req.body;
        var resp
        if(indexno){ 
          var courses = []
          if(core && core.length > 0){ // Core
             for(var row of core){
                if(row.selected || row.lock == 1) courses.push({course_id:row.course_id,credit:row.credit,semester,indexno,class_score:0,exam_score:0,total_score:0,score_type:'N',session_id,scheme_id})
             }
          }
          if(elective && elective.length > 0){ // Elective
             for(var row of elective){
                if(row.selected || row.lock == 1) courses.push({course_id:row.course_id,credit:row.credit,semester,indexno,class_score:0,exam_score:0,total_score:0,score_type:'N',session_id,scheme_id})
             }
          }
          if(trail && trail.length > 0){ // Trail
             for(var row of trail){
                if(row.selected || row.lock == 1) courses.push({course_id:row.course_id,credit:row.credit,semester,indexno,class_score:0,exam_score:0,total_score:0,score_type:'R',session_id,scheme_id})
             }
          }

          if(courses.length > 0) {
            const rem = await Student.removeRegData(indexno,session_id);
            if(rem){
              for(var row of courses){
                resp = await Student.insertRegData(row);
              }
            } 
          }
          // Log Activity
          const dm = { session_id, indexno:indexno, course_count:courses.length, credits_count: courses.reduce((acc,val) => acc+parseInt(val.credit),0), meta_dump: JSON.stringify(courses) }
          const logReg = await Student.insertRegLog(dm);
          
        }
        if(resp){
          res.status(200).json({success:true, data:resp});
        }else{
          res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
      }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong!"});
      }
  },


  // Results

  fetchStudentResults : async (req,res) => {
      const indexno = req.query.indexno
      try{
          var rows = await Student.fetchStudentResults(indexno);
          if(rows && rows.length > 0){
              res.status(200).json({success:true, data:rows});
          }else{
              res.status(200).json({success:true, data:[], msg:"No records!"});
          }
      }catch(e){
          console.log(e)
          res.status(200).json({success:false, data: null, msg: "Something went wrong!"});
      }
  },

  // Fees && Charges

  fetchFeesAccount : async (req,res) => {
    const indexno = req.query.indexno
    try{
        var rows = await Student.fetchStudentResults(indexno);
        if(rows && rows.length > 0){
            res.status(200).json({success:true, data:rows});
        }else{
            res.status(200).json({success:true, data:[], msg:"No records!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong!"});
    }
  },

  fetchResitAccount : async (req,res) => {
    const refno = req.query.re
    try{
        var rows = await Student.fetchStudentResults(indexno);
        if(rows && rows.length > 0){
            res.status(200).json({success:true, data:rows});
        }else{
            res.status(200).json({success:true, data:[], msg:"No records!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong!"});
    }
  },

  fetchGraduationAccount : async (req,res) => {
    const indexno = req.query.indexno
    try{
        var rows = await Student.fetchStudentResults(indexno);
        if(rows && rows.length > 0){
            res.status(200).json({success:true, data:rows});
        }else{
            res.status(200).json({success:true, data:[], msg:"No records!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong!"});
    }
  },

  


  




   

}


