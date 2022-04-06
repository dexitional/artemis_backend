const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/admin.directory.user'];
const TOKEN_PATH = 'token.json';

fs.readFile('./config/credentials.json', (err, content) => {
    if (err) return console.error('Error loading client secret file', err);
    // Authorize a client with the loaded credentials, then call the
    // Directory API.
    this.authorize(JSON.parse(content), this.listUsers);
});
  
module.exports = {
   
    authorize: function authorize(credentials, callback) {
            const {client_secret, client_id, redirect_uris} = credentials.installed;
            const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) return getNewToken(oauth2Client, callback);
                oauth2Client.credentials = JSON.parse(token);
                callback(oauth2Client);
            });
      },

      getNewToken : function getNewToken(oauth2Client, callback) {
            const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            });
            console.log('Authorize this app by visiting this url:', authUrl);
            const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            });
            rl.question('Enter the code from that page here: ', (code) => {
            rl.close();
            oauth2Client.getToken(code, (err, token) => {
                if (err) return console.error('Error retrieving access token', err);
                    oauth2Client.credentials = token;
                    storeToken(token);
                    callback(oauth2Client);
                });
            });
      },

      storeToken: function storeToken(token) {
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.warn(`Token not stored to ${TOKEN_PATH}`, err);
                console.log(`Token stored to ${TOKEN_PATH}`);
            });
      },

      listUsers: function listUsers(auth) {
            const service = google.admin({version: 'directory_v1', auth});
            service.users.list({
                customer: 'my_customer',
                maxResults: 10,
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
      

      
}


