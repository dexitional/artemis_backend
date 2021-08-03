// Nodemailler
var nodemailer = require('nodemailer');
var mail = nodemailer.createTransport({
service: 'gmail',
auth: {
      user: 'hrms@ucc.edu.gh', // bot@aucc.edu.gh
      pass: 'gloria007'
    }
});

module.exports = function(email,title,msg) {

var resp;
var html = `
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" >
<title>Mailto</title>
<link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700" rel="stylesheet">
<style type="text/css">
html { -webkit-text-size-adjust: none; -ms-text-size-adjust: none;}

	@media only screen and (min-device-width: 750px) {
		.table750 {width: 750px !important;}
	}
	@media only screen and (max-device-width: 750px), only screen and (max-width: 750px){
      table[class="table750"] {width: 100% !important;}
      .mob_b {width: 93% !important; max-width: 93% !important; min-width: 93% !important;}
      .mob_b1 {width: 100% !important; max-width: 100% !important; min-width: 100% !important;}
      .mob_left {text-align: left !important;}
      .mob_soc {width: 50% !important; max-width: 50% !important; min-width: 50% !important;}
      .mob_menu {width: 50% !important; max-width: 50% !important; min-width: 50% !important; box-shadow: inset -1px -1px 0 0 rgba(255, 255, 255, 0.2); }
      .mob_center {text-align: center !important;}
      .top_pad {height: 15px !important; max-height: 15px !important; min-height: 15px !important;}
      .mob_pad {width: 15px !important; max-width: 15px !important; min-width: 15px !important;}
      .mob_div {display: block !important;}
 	}
   @media only screen and (max-device-width: 550px), only screen and (max-width: 550px){
      .mod_div {display: block !important;}
   }
	.table750 {width: 750px;}
</style>
</head>
<body style="margin: 0; padding: 0;">

<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f3f3f3; min-width: 350px; font-size: 1px; line-height: normal;">
 	<tr>
   	<td align="center" valign="top">   			
   		<!--[if (gte mso 9)|(IE)]>
         <table border="0" cellspacing="0" cellpadding="0">
         <tr><td align="center" valign="top" width="750"><![endif]-->
   		<table cellpadding="0" cellspacing="0" border="0" width="750" class="table750" style="width: 100%; max-width: 750px; min-width: 350px; background: #f3f3f3;">
   			<tr>
               <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
   				<td align="center" valign="top" style="background: #ffffff;">

                  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100% !important; min-width: 100%; max-width: 100%; background: #f3f3f3;">
                     <tr>
                        <td align="right" valign="top">
                           <div class="top_pad" style="height: 25px; line-height: 25px; font-size: 23px;">&nbsp;</div>
                        </td>
                     </tr>
                  </table>

                  <table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%;margin-bottom:20px;">
                     <tr>
                        <td align="left" valign="top">
                           <div style="height: 50px; line-height: 50px; font-size: 50px;">&nbsp;</div>
                           <!--<a href="#" target="_blank" style="display: block; max-width: 128px;">
                              <img src="https://hrms.ucc.edu.gh/public/images/hrms.png" alt="img" width="75" border="0" style="display: block; width: 75px;" />
                           </a>-->
                           <div style="height:25px;line-height:25pxpx;font-size:24px;font-weight:bolder;color:#f58635;text-transform:uppercase;text-decoration:underline;text-align:center;">${title}</div>
                           <div style="height: 12px; line-height: 12px; font-size: 18px;">&nbsp;</div>
                       </td>
                     </tr>
                  </table>

                  <table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%;">
                     <tr>
                        <td align="left" valign="top">
                           <font face="'Source Sans Pro', sans-serif" color="#1a1a1a" style="font-size: 22px; line-height: 22px; font-weight: 300; letter-spacing: -1.5px;">
                              <span style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #1a1a1a; font-size: 22px; line-height: 22px; font-weight: 300; letter-spacing: -1.5px;">Greetings !</span>
                           </font>
                           <div style="height: 20px; line-height: 20px; font-size: 18px;">&nbsp;</div>
                           <font face="'Source Sans Pro', sans-serif" color="#585858" style="font-size: 18px; line-height: 20px;">
                              <span style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #585858; font-size: 18px; line-height: 20px;">${msg}</span>
                           </font>
                           <div style="height: 20px; line-height: 20px; font-size: 18px;">&nbsp;</div>
                          <table class="mob_btn" cellpadding="0" cellspacing="0" border="0" style="background: #b76118; border-radius: 4px;">
                              <tr>
                                 <td align="center" valign="top"> 
                                    <a href="https://aucc.edu.gh" target="_blank" style="display: block; border: 1px solid #f58635; border-radius: 4px; padding: 12px 23px; font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 20px; line-height: 30px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                       <font face="'Source Sans Pro', sans-serif" color="#ffffff" style="font-size: 20px; line-height: 30px; text-decoration: none; white-space: nowrap; font-weight: 600;">
                                          <span style="font-family: 'Source Sans Pro', Arial, Verdana, Tahoma, Geneva, sans-serif; color: #ffffff; font-size: 20px; line-height: 30px; text-decoration: none; white-space: nowrap; font-weight: 600;">GoTo&nbsp;EduHub</span>
                                       </font>
                                    </a>
                                 </td>
                              </tr>
                           </table>
                           <div style="height: 75px; line-height: 75px; font-size: 73px;">&nbsp;</div>
                        </td>
                     </tr>
                  </table>

                  <table cellpadding="0" cellspacing="0" border="0" width="90%" style="width: 90% !important; min-width: 90%; max-width: 90%; border-width: 1px; border-style: solid; border-color: #e8e8e8; border-bottom: none; border-left: none; border-right: none;">
                     <tr>
                        <td align="left" valign="top">
                           <div style="height: 15px; line-height: 15px; font-size: 13px;">&nbsp;</div>
                        </td>
                     </tr>
                  </table>

                  <table cellpadding="0" cellspacing="0" border="0" width="88%" style="width: 88% !important; min-width: 88%; max-width: 88%;">
                     <tr>
                        <td align="center" valign="top">
                           <!--[if (gte mso 9)|(IE)]>
                           <table border="0" cellspacing="0" cellpadding="0">
                           <tr><td align="center" valign="top" width="50"><![endif]-->
                           <div style="display: inline-block; vertical-align: top; width: 50px;">
                              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100% !important; min-width: 100%; max-width: 100%;">
                                 <tr>
                                    <td align="center" valign="top">
                                       <div style="height: 13px; line-height: 13px; font-size: 11px;">&nbsp;</div>
                                       <div style="display: none; max-width: 50px;">
                                          <img src="https://hrms.ucc.edu.gh/public/images/logo-170x172_.png" alt="img" width="50" border="0" style="display: block; width: 50px;" />
                                       </div>
                                    </td>
                                 </tr>
                              </table>
                           </div><!--[if (gte mso 9)|(IE)]></td><td align="left" valign="top" width="390"><![endif]--><div class="mob_div" style="display: inline-block; vertical-align: top; width: 62%; min-width: 260px;">
                              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100% !important; min-width: 100%; max-width: 100%;">
                                 <tr>
                                    <td width="18" style="width: 18px; max-width: 18px; min-width: 18px;">&nbsp;</td>
                                    <td class="mob_center" align="left" valign="top">
                                       <div style="height: 13px; line-height: 13px; font-size: 11px;">&nbsp;</div>
                                       <font face="'Source Sans Pro', sans-serif" color="#7f7f7f" style="font-size: 18px; line-height: 15px;">
                                          <span style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #b76118; font-size: 17px; line-height: 15px;">AFRICAN UNIVERSITY</span>
                                       </font>
                                       <div style="height: 1px; line-height: 1px; font-size: 1px;">&nbsp;</div>
                                       <font face="'Source Sans Pro', sans-serif" color="#000000" style="font-size: 11px; line-height: 13px; font-weight: 400;">
                                          <span style="font-family: 'Source Sans Pro', Arial, Tahoma, Geneva, sans-serif; color: #000000; font-size: 11px; line-height: 13px; font-weight: 600;">COLLEGE OF COMMUNICATIONS</span>
                                       </font>
                                    </td>
                                    <td width="18" style="width: 18px; max-width: 18px; min-width: 18px;">&nbsp;</td>
                                 </tr>
                              </table>
                           </div><!--[if (gte mso 9)|(IE)]></td><td align="left" valign="top" width="177"><![endif]--><div style="display: inline-block; vertical-align: top; width: 177px;">
                              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="width: 100% !important; min-width: 100%; max-width: 100%;">
                                 <tr>
                                    <td align="center" valign="top">
                                       <div style="height: 13px; line-height: 13px; font-size: 11px;">&nbsp;</div>
                                       <div style="display: block; max-width: 177px;">
                                          <img src="img/txt.png" alt="img" width="177" border="0" style="display: none; width: 177px; max-width: 100%;" />
                                       </div>
                                    </td>
                                 </tr>
                              </table>
                           </div>
                           <!--[if (gte mso 9)|(IE)]>
                           </td></tr>
                           </table><![endif]-->
                           <div style="height: 30px; line-height: 30px; font-size: 28px;">&nbsp;</div>
                        </td>
                     </tr>
                  </table>

               </td>
               <td class="mob_pad" width="25" style="width: 25px; max-width: 25px; min-width: 25px;">&nbsp;</td>
            </tr>
         </table>
         <!--[if (gte mso 9)|(IE)]>
         </td></tr>
         </table><![endif]-->
      </td>
   </tr>
</table>
</body>
</html>`
    
    let data = {
       sender: 'hrms@ucc.edu.gh',
       to: (email != null ? email : 'hrms@ucc.edu.gh'),
       subject: title,
       text: msg,
       html: html
    };
    mail.sendMail(data,(err,info)=>{
      if(err){
         //console.log(err);
         return false;
      }
      //console.log(info)
      return info;
      
    });
};