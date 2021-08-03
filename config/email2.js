// Nodemailler
var nodemailer = require('nodemailer');
var mail = nodemailer.createTransport({
service: 'gmail',
auth: {
        user: 'hrms@ucc.edu.gh',
        pass: 'gloria007'
    }
});

module.exports = function(title,note,sno,name,photo,subj,msg,email) {

    let output = `
    <!DOCTYPE>
    <html lang="en">
    <head>
        <title>STAFF | ${sno}</title>
        <link href="http://www.allfont.de/allfont.css?fonts=arial-narrow" rel="stylesheet" type="text/css" />
        <style type="text/css" >
            body{
                background-color:#eee;              
            }
    
            .cover{
                width: 70%;             
                margin: 10px auto;  
                box-shadow:2px 2px 4px #999;
                padding:10px 17px; 
                background:#fff;
                border:2px solid brown;
                border-radius:10px;           
            }
    
            .title{
                text-align: center;
                font-size:32px;
                color: rgb(8, 8, 148); 
            }
    
            .subtitle{
                font-family: 'Franklin Gothic Medium', 'Arial Narrow', Arial, sans-serif;
                font-weight:bolder;
                text-align: center;
                font-size:25px;
                word-spacing:0.5em;
                color: red;
                font-style:italic;
                margin-top:-20px;
            }
    
            .subnote{
                display: flex;
                width:100%;
                justify-content:space-between;
                align-items: center;
                height:80px; 
                clear:both;            
            }
    
            .cover_adds{
                display:block;
                font-size:12px;
                color:rgb(8, 8, 148); 
                line-height:18px;           
            }
    
            .ucc_title{
                display:block;
                text-align:right; 
                font-size:18px;
                line-height:25px;
                word-spacing:0.35em;
                font-weight:bold;                         
            }
            .ucc_logo{
                display:block;
                height: 80px;  
                width: 90px;                 
            }
    
            content{
            padding-top: 50px;
            }
    
            address{
                font-style:normal;
            }
    
            .signatory{
                width:200px;
                height:130px;
                background-image:url(cid:ucclogo);
                background-repeat: no-repeat;             
                background-position: 0% 0%;
                background-size: 200px 65px;
                position: relative;
            }
    
            .signer{
                position:absolute;
                left:0;
                bottom:0;
            }
    
            .salute{
                margin-top:20px;
            }
    
            .ref{
                margin-bottom:20px;
            }
    
            .end{
                position:relative;              
            }
    
            .copies{
                position: absolute;
                right:25%;
                top: 0;
            }
    
            footer{
                margin:80px 0 10px;
                font-size:10px;
                font-family:cursive;
                font-style:italic;
            }
    
            .heading{
                text-align:center;
                background:#b80924;
                color:#fff;
                padding:10px 5px 10px 60px;
                text-indent: 80px;
            }
    
            .table{
                border-collapse: collapse;
                width: 100%;
                border:2px solid #ccc;
                padding: 20px;
                vertical-align:middle;
                text-algn:center;
                background:#f1f2f3;
            }
    
            .table tr{
                border-bottom: thin solid #000;             
            }
    
            .table td{
                border-right: thin solid #000;
                padding: 10px;            
            }
    
            .certv{
                text-align:center;
            }
    
            .vbtn{
                padding:5px;
                margin-top:-20px;
                text-decoration:none;
                font-size:10px;
                background-color:green;
                color:#fff;
                position:relative;
                top:-10px;
                border-radius:10px;
            }
    
            .sbody{
                font-weight:600;
                font-size:15px;
                display:inline-block;
            }
    
            .file_photo{
                display:block;
                height:120px;
                right:0;
                float:right;
                margin:-25px 15px 10px 0;
                padding:2px;
                border:3px solid #b80924;
                border-radius:10px;
                background-color:#f1f2f3;
            }
    
            .marital{
                padding:5px;
                margin-top:-20px;             
                font-size:15px;
                font-weight:bolder;
                background-color:#b80924;
                text-decoration:none;
                color:#fff;
                position:relative;
                top:1px;              
            }
    
            .staff_no{
                padding:5px 10px;
                margin:5px 10px;
                font-size:23px;
                font-weight:bolder;
                background-color:#0d2d62;
                text-decoration:none;
                color:#fff;      
            }
    
    
            @media print {
                body{
                    background:none;
                }
    
                .cover{
                    padding:0;
                    background:none;
                    box-shadow:none;
                }
    
                .vbtn{
                    display:none;
                }
            }
    
        </style>
    </head>
    <body>
        <div >
        
            <table class="cover">
                <tr>
                <td colspan="5" align="center">
                    <h1 class="title">UNIVERSITY OF CAPE COAST</h1>
                    <h2 class="subtitle">DIRECTORATE OF HUMAN RESOURCE</h2>
                </td>
                </tr>
                <tr class="subnote">
                        <td colspan="2" align="left">
                                <div class="cover_adds">
                                    <dl class="note">
                                        <dt>Cellphone:  <div style="display:inline-block;vertical-align:top;font-weight:bold;">+233-3321-32480/3 Exts.: 223/225/205<br>233-3321-32484/5</div></dt>
                                        <dt>E-mail:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<div style="display:inline-block;vertical-align:top;font-weight:bold;">dhr.enquiries@ucc.edu.gh</div></dt>
                                        <dt>Website:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<div style="display:inline-block;vertical-align:top;font-weight:bold;">www.ucc.edu.gh</div></dt>                   
                                    </dl>                       
                                </div>
                        </td>
                        <td align="center">
                                <div> 
                                <img src="cid:ucclogo" alt="UCC LOGO" class="ucc_logo"/></div>
                                <div> 
                        </td>
                        <td colspan="2" align="right">
                            <address class="ucc_title">
                                    UNIVERSITY POST OFFICE<br/>
                                    CAPE COAST, GHANA
                            </address>
                        </td>
                </tr>
                <tr><td colspan="5"><br><br></td></tr>
                <tr>
                    <td colspan="5">
                        <content>
                            <img src="cid:staffpic" class="file_photo"/>
                            <h2 class="heading"><span class="staff_no"> ${title} </span> ${note}</h2>              
                            <div class="content">
                            <p style="font-size:15px;font-family:tahoma,helvetica,arial;font-weight:normal;"><b>Dear <em>${name}</em>, ${msg}</b><p>
                            </div>
                        </content>
                    </td>
                <tr>
                <tr>
                    <td colspan="5" align="center"><hr>
                    <span>All rights reserved HRMS, &copy; ${new Date().getFullYear()} MIS-DICTS, University of Cape Coast </span>
                    </td>
                </tr>
            </table>
        </div>
    </body>
    </html>
    `;
    
    let data = {
        sender: 'hrms@ucc.edu.gh',
        to: (email != null ? email : 'hrms@ucc.edu.gh'),
        subject: subj,
        text: msg,
        html: output,
        attachments: [{
            filename: 'logo-170x172.png',
            path: './public/images/logo-170x172.png',
            cid: 'ucclogo' //same cid value as in the html img src
        },
        {
            filename: (photo != null ? '.'+sno+'.jpg' : 'none.png'),
            path: (photo != null ? '.'+photo : './public/images/none.png'),
            cid: 'staffpic' //same cid value as in the html img src
        }
    ]
    };
    mail.sendMail(data,(err,info)=>{
        if(err) console.log(err);
        console.log(info);
    });
 
};