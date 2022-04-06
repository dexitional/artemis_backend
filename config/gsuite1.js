const fs = require('fs');
const path = require('path');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/admin.directory.user'];
const TOKEN_PATH = 'token.json';
const keyFile = './config/credentials.json';


    const useDirectory = async keyFile => {
            const auth = new google.auth.GoogleAuth({
            keyFile,
            scopes: [
                'https://www.googleapis.com/auth/admin.directory.user',
                'https://www.googleapis.com/auth/admin.directory.group',
                'https://www.googleapis.com/auth/admin.directory.group.member'
            ]
            });
  
            return google.admin({
            version: "directory_v1",
            auth: await auth.getClient()
            });
    };
  
    const token = path.resolve(keyFile);
    if (!fs.existsSync(token)) {
        throw new Error("Could not find token.json for authentication.");
    }
  
    var directory = useDirectory(token);
    console.log(directory);
    //var users =   directory.groups.list({ domain: "ucc.edu.gh" }).catch(console.error);



