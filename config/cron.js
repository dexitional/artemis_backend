const exec = require("child_process").exec;
//const zipFolder = require("zip-folder");
//const rimraf = require("rimraf");
const { runBills, runVoucherSender, runRetireStudentAccount, runRetireAccountTransact, runSetupScoresheet, runMsgDispatcher, runUpgradeNames, runRemovePaymentDuplicates, runData, populate, cleanBills } = require('../middleware/cronutil')
const cron = require('node-cron'); 
//import PQueue from 'p-queue';
//const queue = new PQueue({concurrency: 1});
const { Queue } = require('async-await-queue');
const queue = new Queue(1, 100);


/* CRON SCHEDULES   */

// Schedule @ EVERY MINUTE - MINOR & QUICK CHECKS
cron.schedule('*/5 * * * *', () => {
    const cmd = "echo cron"; // Command Bash terminal
    exec(cmd, async function(error, stdout, stderr) {
        if(error){ console.log(error) }
        else {
          // INFORMANT MESSAGES - AIS
          queue.run(() => runMsgDispatcher())
          // RUN ACADEMIC FEES INTO STUDENT ACCOUNT
          queue.run(() => runRetireAccountTransact())
          
        }
    });
});


// Schedule @ EVERY 10 MINUTES
cron.schedule('*/10 * * * *', async function() {
    const cmd = "echo cron"; // Command Bash terminal
    exec(cmd, async function(error, stdout, stderr) {
      if(error){ console.log(error) }
      else {
        /* FMS CRON JOBS  */

          // RUN BILLS CHARGED
          queue.run(() => runBills())
          queue.run(() => cleanBills())
          // RUN ACADEMIC FEES INTO STUDENT ACCOUNT
          queue.run(() => runRetireAccountTransact())
          // RUN RETIREMENT ON STUDENT ACCOUNTS 
          queue.run(() => runRetireStudentAccount())
          // RUN VOUCHERS RETIREMENT & RESEND
          queue.run(() => runVoucherSender())
          // CORRECT DUPLICATE PAYMENT ENTRIES
          queue.run(() => runRemovePaymentDuplicates())
          
          // RUN SCORESHEET SETUP FOR NEW CALENDAR
          //setTimeout(async() =>  await runSetupScoresheet(),120000) 
          // CORRECT STUDENT NAMES (FNAME,MNAME,LNAME), 200) 
          //setTimeout(async() => await runUpgradeNames(), 150000) 
          // RUN RESIT CHECKER
      }
    });
});


// Schedule @ 11:45 PM b4 Midnight / Daily 
cron.schedule('45 23 * * *', async function() {
    const cmd = "echo cron"; // Command Bash terminal
    exec(cmd, function(error, stdout, stderr) {
      if(error){ console.log(error) }
      else {
        // RUN SCRIPT
      }
    });
});



// BACKUP SCHEDULE @ 11:59 PM
/*
cron.schedule('59 23 * * *', function() {
  const dt = moment().format('DDMMYYYY');
  let data = {
      sender: 'hrms@ucc.edu.gh',
      to: 'dexitional@mfh.com',
      subject: `kuukua.store (backup_${dt})`,
      text: `kuukua.store (backup_${dt})`,
      attachments: []
  }
  
  //remove directory
  rimraf.sync(config.DB_OPTIONS.database);
  //backup mongo
  const pt = __dirname.replace(/ /g,"\\ ")
  const cmd = "mongodump --host "+config.DB_OPTIONS.host+" --db "+config.DB_OPTIONS.database+" --gzip --out "+pt+"/backup"; // Command for mongodb dump process
  //const cmd = "~/_locals/mongodb/bin/mongodump --host "+config.DB_OPTIONS.host+" --db "+config.DB_OPTIONS.database+" --gzip --out "+pt+"/backup"; // Command for mongodb dump process
  exec(cmd, function(error, stdout, stderr) {
      if(error){ console.log(error) }
      else {
          //zip backup
          zipFolder(__dirname+"/backup/"+config.DB_OPTIONS.database, __dirname+"/backup/"+config.DB_OPTIONS.database+'_'+dt+".zip",function(err) {
              if (err) {
                  console.log("Zip error ... ");
              } else {
                  console.log("Backup zipped successful");
                  // Options
                  data.attachments = [{ filename: config.DB_OPTIONS.database+'_'+dt+".zip",path: __dirname+"/backup/"+config.DB_OPTIONS.database+'_'+dt+".zip", cid: 'backup'}]
                  // Send Backup as attachment
                  mail.sendMail(data,(err,info)=>{
                    if(err) console.log(err);
                    console.log(info);
                    rimraf(__dirname+"/backup/"+config.DB_OPTIONS.database, function () { console.log("done"); });
                  });
              }
          });
      }
  });
});

*/

module.exports = cron