const sms = require("../config/sms");
const SSO = require("../model/mysql/ssoModel");
const { getSemestersByCode } = require("../middleware/util")

// CRON BOTS

const runBills = async () => {
    console.log("RUNNING BILLS POSTING ....")
    var bl = await SSO.fetchCurrentBills();
    //const sess = await SSO.getActiveSessionByMode(1)
    var resp = {};
    if(bl && bl.length > 0){
      for(var b of bl){
        const sem = getSemestersByCode(b.group_code || '0000')
        const dsem = getSemestersByCode(b.discount_code || '0000')
        var data;
        if(b.post_status == 1){
          if(b.post_type == 'GH'){
            data = await SSO.sendStudentBillGh(b.bid,b.narrative,b.amount,b.prog_id,sem,b.session_id,b.discount,dsem,b.currency)
            const {count,dcount} = data;
            if(data.count > 0) resp[`${b.bid}`] = !resp[`${b.bid}`] ? { ...resp[`${b.bid}`],count } : { ...resp[`${b.bid}`], count:resp[`${b.bid}`]['count']+count } 
            if(data.dcount > 0) resp[`${b.bid}`] = !resp[`${b.bid}`] ? { ...resp[`${b.bid}`],dcount } : { ...resp[`${b.bid}`], count:resp[`${b.bid}`]['dcount']+dcount } 
            
          }else if(b.post_type == 'INT'){
            data = await SSO.sendStudentBillInt(b.bid,b.narrative,b.amount,b.prog_id,sem,b.session_id,b.discount,dsem,b.currency)
            const {count,dcount} = data;
            if(data.count > 0) resp[`${b.bid}`] = !resp[`${b.bid}`] ? { ...resp[`${b.bid}`],count } : { ...resp[`${b.bid}`], count:resp[`${b.bid}`]['count']+count } 
            if(data.dcount > 0) resp[`${b.bid}`] = !resp[`${b.bid}`] ? { ...resp[`${b.bid}`],dcount } : { ...resp[`${b.bid}`], count:resp[`${b.bid}`]['dcount']+dcount } 
          } 
        }
      }
    }
    return resp;
}


const cleanBills = async () => {
  console.log("RUNNING CLEAN BILLS ....")
  var count = 0;
  var bills = await SSO.fetchUnpublisedBills();
  if(bills && bills.length > 0){
    for(var b of bills){
      const del = await SSO.revokeBill(b.bid,null)
      if(del) count += 1;
    }
  } return count;
}


const runRetireStudentAccount = async () => {
  console.log("RUNNING STUDENT BALANCE RETIREMENT ....")
  var resp = await SSO.retireStudentAccount();
  return resp;
}

const runRetireAccountTransact = async () => {
  console.log("RUNNING ACCOUNTS RETIREMENT ....")
  var resp = await SSO.retireAccountTransact();
  return resp;
}

const retireResitTransact = async () => {
  console.log("RUNNING RESIT RETIREMENT ....")
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
  console.log("RUNNING SCORESHEET SETUP ....")
  var resp = await SSO.setupSchoresheet();
  return resp;
}


const runMsgDispatcher = async () => {
  console.log("RUNNING MESSAGE DISPATCHER ....")
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
  console.log("RUNNING TRANSACTION DUPLICATES REMOVAL ....")
  var resp = await SSO.runRemovePaymentDuplicates();
  return resp;
}

const runData = async () => {
  var resp = await SSO.runData();
  return resp;
}

const populate = async () => {
  var resp = await SSO.populate();
  return resp;
}



module.exports = { runBills,runRetireStudentAccount,runVoucherSender,runRetireAccountTransact,runSetupScoresheet,runMsgDispatcher,runUpgradeNames,runRemovePaymentDuplicates,runData,populate,cleanBills }