const sms = require("../config/sms");
//const SSO = require("../model/mysql/ssoModel");
const SSO = require("../model/mysql/newModel");

const getTargetGroup = (group_code) => {
    var yr
    switch(group_code){
      case '1000':  yr = `Year 1 Only`; break;
      case '0100':  yr = `Year 2 Only`; break;
      case '0010':  yr = `Year 3 Only`; break;
      case '0001':  yr = `Year 4 Only`; break;
      case '0011':  yr = `Year 1 & Year 2`; break;
      case '1100':  yr = `Year 1 & Year 2`; break;
      case '1010':  yr = `Year 1 & Year 3`; break;
      case '1001':  yr = `Year 1 & Year 4`; break;
      case '1110':  yr = `Year 1,Year 2 & Year 3`; break;
      case '1101':  yr = `Year 1,Year 2 & Year 4`; break;
      case '1111':  yr = `Year 1,Year 2,Year 3 & Year 4`; break;
      case '0000':  yr = `International students`; break;
      default: yr = `International students`; break;
    }
    return yr
}

const getUsername = (fname,lname) => {
  var username,fr,lr;
  let fs = fname ? fname.trim().split(' '):null
  let ls = lname ? lname.trim().split(' '):null
  if(fs && fs.length > 0){
    for(var i = 0; i < fs.length; i++){
       if(i == 0) fr = fs[i].trim()
    }
  }
  if(ls && ls.length > 0){
     for(var i = 0; i < ls.length; i++){
       if(i == ls.length-1) lr = ls[i].split('-')[0].trim()
     }
   }
   if(!lr && fs.length > 1) lr = fs[1] 
   if(!fr && ls.length > 1){
      fr = fs[1].trim()
      lr = ls[ls.length-1].split('-')[0].trim()
   } 
   return `${fr}.${lr}`.toLowerCase();
}


const getSemestersByCode = (group_code) => {
  console.log(group_code)
  var yr
  switch(group_code){
    case '1000':  yr = `1,2`; break;
    case '0100':  yr = `3,4`; break;
    case '0010':  yr = `5,6`; break;
    case '0001':  yr = `7,8`; break;
    case '0011':  yr = `5,6,7,8`; break;
    case '0101':  yr = `3,4,7,8`; break;
    case '0110':  yr = `3,4,5,6`; break;
    case '0111':  yr = `3,4,5,6,7,8`; break;
    case '1011':  yr = `1,2,5,6,7,8`; break;
    case '1100':  yr = `1,2,3,4`; break;
    case '1010':  yr = `1,2,5,6`; break;
    case '1001':  yr = `1,2,7,8`; break;
    case '1110':  yr = `1,2,3,4,5,6`; break;
    case '1101':  yr = `1,2,3,4,7,8`; break;
    case '1111':  yr = `1,2,3,4,5,6,7,8`; break;
    case '0000':  yr = `1,2,3,4,5,6,7,8`; break;
  }
  return yr
}


const getActiveSessionByDoa = async (doa) => {
  const sess = await SSO.getActiveSessionByMode(1)
  console.log(group_code)
  var yr
  switch(group_code){
    case '1000':  yr = `1,2`; break;
    case '0100':  yr = `3,4`; break;
    case '0010':  yr = `5,6`; break;
    case '0001':  yr = `7,8`; break;
    case '0011':  yr = `5,6,7,8`; break;
    case '0101':  yr = `3,4,7,8`; break;
    case '0110':  yr = `3,4,5,6`; break;
    case '0111':  yr = `3,4,5,6,7,8`; break;
    case '1011':  yr = `1,2,5,6,7,8`; break;
    case '1100':  yr = `1,2,3,4`; break;
    case '1010':  yr = `1,2,5,6`; break;
    case '1001':  yr = `1,2,7,8`; break;
    case '1110':  yr = `1,2,3,4,5,6`; break;
    case '1101':  yr = `1,2,3,4,7,8`; break;
    case '1111':  yr = `1,2,3,4,5,6,7,8`; break;
    case '0000':  yr = `1,2,3,4,5,6,7,8`; break;
  }
  return yr
}




// CRON BOTS

const runBills = async () => {
    var bl = await SSO.fetchCurrentBills();
    const sess = await SSO.getActiveSessionByMode(1)
    var resp = {};
    if(bl && bl.length > 0){
      for(var b of bl){
        const sem = getSemestersByCode(b.group_code)
        var count;
        if(b.post_status == 1){
          if(b.post_type == 'GH'){
            count = await SSO.sendStudentBillGh(b.bid,b.narrative,b.amount,b.prog_id,sem,sess,b.discount,b.currency)
            if(count > 0) resp[`${b.bid}`] = resp[`${b.bid}`] ? count:(resp[`${b.bid}`]+count)
          }else if(b.post_type == 'INT'){
            count = await SSO.sendStudentBillInt(b.bid,b.narrative,b.amount,sem,sess,b.discount,b.currency)
            if(count > 0) resp[`${b.bid}`] = resp[`${b.bid}`] ? count:(resp[`${b.bid}`]+count)
          }
        }
      }
    }
    return resp;
}



const runRetireStudentAccount = async () => {
  var resp = await SSO.retireAccount();
  return resp;
}

const runRetireFeesTransact = async () => {
  var resp = await SSO.retireFeesTransact();
  return resp;
}

const retireResitTransact = async () => {
  var resp = await SSO.retireResitTransact();
  return resp;
}

const runVoucherSender = async () => {
  var count = 0;
  var res = await SSO.fetchSMSFailedVouchers();
  if(res && res.length > 0){
    for(let vs of res){
      const msg = `Hi! AUCC Voucher for ${vs[0].buyer_name} is : ( SERIAL: ${vs[0].serial} PIN: ${vs[0].pin} , Goto https://portal.aucc.edu.gh/applicant )`
      const send = sms(vs[0].buyer_phone,msg)
      if(send.code == 1000) {
        await SSO.updateVoucherLogBySerial(serial,{ sms_code:send.code })
        count++
      }
    }
  }
  return count;
}


const runSetupScoresheet = async () => {
  var resp = await SSO.setupSchoresheet();
  return resp;
}


const runMsgDispatcher = async () => {
  var count = 0;
  var res = await SSO.fetchInformerData();
  if(res && res.length > 0){
    for(let vs of res){
      var users;
      const group = vs.receiver;
      switch(group){
        case 'STUDENT': users = await SSO.msgStudentData(); break;
        case 'STAFF': users = await SSO.msgStaffData(); break;
        case 'ALL': users = await SSO.msgAllData(); break;
        case 'APPLICANT': users = await SSO.msgApplicantData(); break;
        case 'FRESHER': users = await SSO.msgFresherData(); break;
        case 'DEAN': users = await SSO.msgDeanData(); break;
        case 'HEAD': users = await SSO.msgHeadData(); break;
        case 'ASSESSOR': users = await SSO.msgAssessorData(); break;
        case 'UNDERGRAD': users = await SSO.msgUndergradData(); break;
        case 'POSTGRAD': users = await SSO.msgPostgradData(); break;
      }
      
      if(users && users.length > 0){
         for(user of users){
            const send = await sms(user.phone,vs.message)
            if(send.code == 1000) {
              await SSO.insertInformerLog({informer_id:vs.id,tag:user.tag,phone:user.phone,message:vs.message,sms_code:send.code})
              //await SSO.updateInformerLog({user.tag,user.phone,vs.message,{ sms_code:send.code })
              count++
            }
         }
         await SSO.updateAISInformer(vs.id, { send_status:1, sent_at:new Date() })
      }
    }
  }
  return count;
}


const runUpgradeNames = async () => {
  var resp = await SSO.runUpgradeNames();
  return resp;
}

const runRemovePaymentDuplicates = async () => {
  var resp = await SSO.runRemovePaymentDuplicates();
  return resp;
}

const runData = async () => {
  var resp = await SSO.runData();
  return resp;
}



module.exports = { getTargetGroup,getSemestersByCode,getUsername,runBills,runRetireStudentAccount,runVoucherSender,runRetireFeesTransact,runSetupScoresheet,runMsgDispatcher,runUpgradeNames,runRemovePaymentDuplicates,runData }