// SMS 
var axios = require('axios');

module.exports = async function(phone,msg) {
    const data = {
        //key : 'pgC2DPZTwdbe68qPkuo4G36bV', // Bulksmsgh
        key : 'TFkrdSQimG3aMBcBmCqaiwhsH', //'B8pRALyxDgt4l5nRLOYVPoIm1', // Mnotify
        from : 'AUCC',
        to : phone,
        content : msg,
    }
    //const url = `http://clientlogin.bulksmsgh.com/smsapi?key=${data.key}&to=${escape(data.to)}&msg=${data.content}&sender_id=${data.from}`
    const url = `https://apps.mnotify.net/smsapi?key=${data.key}&to=${data.to}&msg=${data.content}&sender_id=${data.from}`
    const options = {
       method: 'get',
       url: encodeURI(url),
       responseType: 'json',
    }
    
    const res = await axios(options)
    const resp = await res.data
    //console.log(resp);
    return resp // mnotify
    //return {code:resp} // bulksmgh
};