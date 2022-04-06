const exec = require("child_process").exec;
const zipFolder = require("zip-folder");
const rimraf = require("rimraf");
const config = require('config.json');

function takeMongoBackup() {
  //remove directory
  rimraf.sync(config.DB_OPTIONS.database);

  //backup mongo
  const cmd =
    "mongodump --host " +
      config.DB_OPTIONS.host +
    " --db " +
      config.DB_OPTIONS.database +
    " --out " +
    __dirname; // Command for mongodb dump process

  console.log("DB backup started ... ");
  console.log(cmd);
  exec(cmd, function(error, stdout, stderr) {
    if (empty(error)) {
      console.log("DB backup generated ... ");

      //zip backup
      zipFolder(
          __dirname + "/" + config.DB_OPTIONS.database,
          __dirname + "/" + config.DB_OPTIONS.database + ".zip",
        function(err) {
          if (err) {
            console.log("Zip error ... ");
            console.log("oh no!", err);
          } else {
            console.log("Backup zipped successful");

            //upload on drive
            uploadFileToDrive(()=>{
                //remove directory
                rimraf.sync(config.DB_OPTIONS.database);
                rimraf.sync(config.DB_OPTIONS.database + ".zip");
            })
          }
        }
      );
    }
  });
}


function uploadFileToDrive(cb) {
    const fs = require('fs');
    const readline = require('readline');
    const { google } = require('googleapis');
    const key = require('service.json')

    authorize(null, uploadFile);

    function authorize(credentials, callback) {
        const scopes = 'https://www.googleapis.com/auth/drive'
        const jwt = new google.auth.JWT(key.client_email, null, key.private_key, scopes)

        jwt.authorize((err, response) => {
            if (err) console.log(err)
            if (response) callback(jwt);
        })
    }

    function uploadFile(auth) {
        const fileName = config.DB_OPTIONS.database + ".zip";
        const drive = google.drive({ version: 'v3', auth });
        var fileMetadata = {
            'name': fileName,
            parents: [config.FOLDER_ID]
        };
        var media = {
          mimeType: "application/zip",
          body: fs.createReadStream(fileName)
        };
        drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        }, function (err, file) {
            if (err) {
                // Handle error
                console.error(err);
                console.log('Make sure you shared your drive folder with service email/user.')
            } else {
                console.log('File Id: ', file.id);
                if (cb) cb(file.id)
            }
        });
    }
}

/* return if variable is empty or not. */
const empty = function (mixedVar) {
    var undef, key, i, len;
    var emptyValues = [undef, null, false, 0, '', '0'];
    for (i = 0, len = emptyValues.length; i < len; i++) { 
        if (mixedVar === emptyValues[i]) { return true; } 
    } 
    if (typeof mixedVar === 'object') {
         for (key in mixedVar) { 
           return false; 
         } return true; 
    } return false; 
}; 

var cron = require('node-cron'); 
cron.schedule(config.SCHEDULE_TIME, () => {
    console.log("running a task every minute");
    takeMongoBackup();
});

//takeMongoBackup(); //IF YOU WANT TO RUN BACKUP UPON RUN