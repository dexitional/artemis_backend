const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/admin.directory.user'];
const TOKEN_PATH = 'token.json';
var connect,admin;
// Load client secrets from a local file.
fs.readFile('./config/credentials.json', (err, content) => {
  if (err) return console.error('Error loading client secret file', err);
  //authorize(JSON.parse(content), listUsers);
    authorize(JSON.parse(content), (auth) => {
        connect = auth;
        admin = google.admin({version: 'directory_v1', auth});
    })
});                                                          

function authorize(credentials, callback) {
   const {client_secret, client_id, redirect_uris} = credentials.installed;
   const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
   fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oauth2Client, callback);
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
   });
}

function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  oauth2Client.getToken('4/4QGTOQnzareUpYnmBU-rBJhSrHVvVem9k1kYe3SpyUQ0hESDpOIc0c4', (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oauth2Client.credentials = token;
      console.log(token);
      storeToken(token);
      callback(oauth2Client);
  });
}

function storeToken(token) {
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) return console.warn(`Token not stored to ${TOKEN_PATH}`, err);
    console.log(`Token stored to ${TOKEN_PATH}`);
  });
}

// List Users
/*
function listUsers(auth) {
  const service = google.admin({version: 'directory_v1', auth});
  service.users.list({
    customer: 'my_customer',
    maxResults: 100,
    orderBy: 'email',               
  }, (err, res) => {
    if (err) return console.error('The API returned an error:', err.message);

    const users = res.data.users;
    if (users.length) {
      console.log('Users:');
      users.forEach((user) => {
        console.log(`${user.primaryEmail} (${user.name.fullName})`);
      });
    } else {
      console.log('No users found.');
    }
  });
}
*/

// ADD NEW USER
async function insertUser(data) {
    const response = await admin.users.insert({"requestBody":data});
    return response;
}

// UPDATE USER
async function updateUser(data,userKey) {
    const response = await admin.users.update({
        "userKey": userKey,
        "requestBody":data
    });
    return response;
}

// CHANGE PASSWORD
async function changePwd(data,userKey) {
    const response = await admin.users.update({
        "userKey": userKey,
        "requestBody":{
            "password": data,
            "hashFunction": "SHA-1"
        }
    });
    return response;
}

// FIND USER
async function getUser(userKey) {
    const response = await admin.users.get({"userKey":userKey});
    return response;
}


module.exports = {
  SCOPES,
  //listUsers,
  insertUser,
  updateUser,
  getUser,
  changePwd,
};