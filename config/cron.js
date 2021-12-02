const exec = require("child_process").exec;
//const zipFolder = require("zip-folder");
//const rimraf = require("rimraf");
const { runBills, runRetireAccount, runVoucherSender, retireFeesTransact, runRetireStudentAccount, runRetireFeesTransact } = require('../middleware/util')
var cron = require('node-cron'); 


/* CRON SCHEDULES   */

// Schedule @ EVERY MINUTE - MINOR & QUICK CHECKS
cron.schedule('*/1 * * * *', () => {
    const cmd = "ls -la"; // Command Bash terminal
    exec(cmd, function(error, stdout, stderr) {
        if(error){ console.log(error) }
        else {

        }
    });
});


// Schedule @ EVERY 30 MINUTES
cron.schedule('*/30 * * * *', async function() {
    const cmd = "ls -la"; // Command Bash terminal
    exec(cmd, function(error, stdout, stderr) {
      if(error){ console.log(error) }
      else {
        /* FMS CRON JOBS  */

          // RUN BILLS CHARGED
          runBills()
          // RUN ACADEMIC FEES INTO STUDENT ACCOUNT
          setTimeout(()=> runRetireFeesTransact(), 200)
          // RUN RETIREMENT ON STUDENT ACCOUNTS 
          setTimeout(()=> runRetireStudentAccount(), 200)
          // RUN VOUCHER SENDER
          setTimeout(()=> runVoucherSender(), 200)
          // RUN RESIT CHECKER
          // RUN 


        /* AIS CRON JOBS  */

      }
    });
});


// Schedule @ 11:45 PM b4 Midnight / Daily 
cron.schedule('45 23 * * *', async function() {
    const cmd = "ls -la"; // Command Bash terminal
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