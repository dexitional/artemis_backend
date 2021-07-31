// SMS 
var request = require('request');
module.exports = function(phone,msg) {
    const data = {
        key : 'pgC2DPZTwdbe68qPkuo4G36bV',//pgC2DPZTwdbe68qPkuo4G36bV //d413ba965ae771f637de
        from : 'UCC-SSO',
        to : phone,
        content : msg,
    }
    const url = `http://clientlogin.bulksmsgh.com/smsapi?key=${data.key}&to=${data.to}&msg=${data.content}&sender_id=${data.from}`
    const options = {
        method: 'get',
        json: true,
        url: url
    }
    request(options, function (err, res, body) {
        console.log(body);
        return body;
    })
};