var jwt = require('jsonwebtoken');
const fs = require('fs');
const sha1 = require('sha1');
const path = require('path');
const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwzyx',8)
const mailer = require('../../config/email')
const sms = require('../../config/sms')

const { API } = require('../../model/mysql/apiModel');
const { Student } = require('../../model/mysql/studentModel');
const { SSO } = require('../../model/mysql/ssoModel');

module.exports = {
 
  loadservices : async (req,res) => {
    try{
      var services = await API.fetchServices();
      if(services) res.status(200).json({success:true, data: services}) 
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Please try again later."});
    }
  },

  loadservice : async (req,res) => {
    const type = req.params.type;
    const refno = req.params.refno;
    try{
      // OTHER services
      if(refno && parseInt(type) !== 1){ 
        var dt,ft;
        const st = await Student.fetchStudentProfile(refno);
        if(st && st.length > 0){
          dt = { studentId:st[0].refno,indexNo:st[0].indexno, name:`${st[0].lname ?st[0].lname.trim():''}, ${st[0].fname ? st[0].fname.trim():''} ${st[0].mname ? ' '+st[0].mname.trim():''}`, program:`${st[0].program_name}${st[0].major_name ?'- '+st[0].major_name:''}`,year: st[0].semester ? Math.ceil(st[0].semester/2) : 'none',serviceId:type }
          switch(parseInt(type)){
            case 2: ft = await Student.fetchFeesAccount(refno);break;
            case 3: ft = await Student.fetchResitAccount(st[0].indexno);break; // Retire resit account on successful payment ( flag paid to '1')
            case 4: ft = await Student.fetchGraduationAccount(st[0].indexno);break; // Automate graduation insertion after second sem certified result
          } res.status(200).json({success:true, data: {...dt,serviceCharge:ft}}) 
        }else{
          res.status(200).json({success:false, data: null, msg: "Invalid StudentID or Index number"});
        }

      // VOUCHER services
      }else if(type && parseInt(type) === 1){
        const st = await SSO.fetchVoucherGroups();
        res.status(200).json({success:true, data: { serviceId:type,...st }}) 
      }else{
        res.status(403).json({success:false, data: null, msg: "Invalid request"});
      }

    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Please try again later."});
    }
  },

  payservice : async (req,res) => {
    try{
      const api = req.query.api;
      //const cl = await SSO.fetchCollector(api);
      const cl = { id : 1, vendor_id: 1, collector_name:'Calbank Limited'}

      const { serviceId,amountPaid,currency,studentId,refNote,transRef,buyerName,buyerPhone,formId,sessionId } = req.body
      const dt = { collector_id:cl.id,transtype_id:serviceId,currency,amount:amountPaid,paytype:'BANK',reference:refNote,refno:studentId,transtag:transRef }
      
      /* VOUCHER SERVICE */
      if(serviceId == 1 ){ 
          if(!sessionId) res.status(200).json({success:false, data: null, msg: `No Admission Session indicated!`})// Check for Required but Empty field and return error
          const ins = await SSO.sendTransaction(dt);
          if(ins){
            const vouch = await SSO.sellVoucher(formId,cl.id,sessionId,buyerName,buyerPhone,ins.insertId);
            if(vouch){ 
              // Send SMS to Buyer
              const msg = `Hi! AUCC Voucher info are, Serial: ${vouch.serial} Pin: ${vouch.pin} Goto https://portal.aucc.edu.gh/applicant to apply!`
              const send = await sms(buyerPhone,msg)
              // Log SMS Status
              if(send) await SSO.updateVoucherLog(vouch.logId, { sms_code:send.code }) 
              res.status(200).json({success:true, data: { voucherSerial:vouch.serial,voucherPin:vouch.pin,buyerName,buyerPhone,transId:ins.insertId,serviceId } })
            
            }else{ 
              res.status(200).json({success:false, data: null, msg: `Voucher quota exhausted`}) 
            }
          
          }else{ 
            res.status(200).json({success:false, data: null, msg: `Transaction failed`})
          }
          
      /* OTHER PAYMENT SERVICE (ACADEMIC FEES, RESIT, GRADUATION) */  
      }else{ 
          const ins = await SSO.sendTransaction(dt);
          if(ins){
            
            if(serviceId == 2){
              // Send to studtrans tbl, If Payservice = Academic Fees
              const dt = { tid: ins.insertId,refno:studentId, amount: (-1*amountPaid),currency,narrative:`Online Fees Payment, StudentID: ${studentId}`}
              const insm = await SSO.savePaymentToAccount(dt)
              // Send SMS to Buyer
              //const msg = `Hi ${studentId}! You paid ${currency} ${amountPaid}, TransactId: ${transRef}`
              //if(insm) await sms(buyerPhone,msg)
              
            }
            res.status(200).json({success:true, data: { transId: ins.insertId,studentId,serviceId } }) 
          }else{
            res.status(200).json({success:false, data: null, msg: `Transaction failed`})
          }
      }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Please try again later."});
    }
  },

/*
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

*/
  


   

}

