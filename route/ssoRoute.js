//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
var express = require('express'),
var bodyParser = require('body-parser');
var session = require('express-session');
var sha256 = require('sha256');
var sha1 = require('sha1');
var md5 = require('md5');
var sms = require('./routes/sms');
var mail = require('./routes/email');
var db = require('./config/database');
var google = require('./config/gsuite2');
var AD = require('ad');
var cors = require('cors');
var app = express();


/* Admin SDK - GSuite */

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors());
app.use("/public",express.static("public"));
app.use(session({
    secret: 'cas', 
    resave: true,
    saveUninitialized: false,
    cookie: { secure: false , maxAge: 30*60*1000 } //7 * 24 * 60 * 60 * 1000
}));

var isallowed = (req, res, next) => {
    if (req.session.token)
        return next();      
    res.redirect('/');
}

var isResetAllowed = (req, res, next) => {
    if (req.session.session_id)
        return next();      
    res.redirect('/reset');
}

var isSecureAllowed = (req, res, next) => {
    if (req.session.user)
        return next();      
    res.redirect('/userlogin');
}

/* ENTRY PAGE */
app.get('/', async(req,res) => {
    //var token = Math.round((Math.random() * 1000)+2000);
    //res.json(token);
    res.render('404');
    //var resp = await google.getUser('hrms@ucc.edu.gh');
    //console.log(resp);
})

/* PASSWORD CHANGE */
app.get('/changePwd', async(req,res) => {
    const email = req.query.email || '';
    req.session.return_url = req.query.return_url;
    req.session.token = new Date();//moment().unix();
    req.session.save();
    res.render('change_email',{msg:null,email})
})

app.post('/changePwd',isallowed,async(req,res)=> {
    const email = req.body.email;
    const username = email.split('@')[0];
    const domain = email.split('@')[1];
    var conn;
    if(domain == 'ucc.edu.gh'){ 
        conn = new AD({
            url: process.env.AD1_HOST,
            user: process.env.AD1_USER,
            pass: process.env.AD1_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }else if(domain == 'stu.ucc.edu.gh'){ 
        conn = new AD({
            url: process.env.AD2_HOST,
            user: process.env.AD2_USER,
            pass: process.env.AD2_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }else{ 
        conn = new AD({
            url: process.env.AD3_HOST,
            user: process.env.AD3_USER,
            pass: process.env.AD3_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }
    console.log("This is a connection file : ");
    console.log(conn);
    if(email && email != ''){   
      try{  const user = await conn.user(username).get();
            if(Object.keys(user).length){
               req.session.user = user;
               req.session.save();
               res.render('change_form',{user});
            }else{
               res.render('change_email',{msg:"USER DOES NOT EXIST",email:''});
            }
      } catch(e){ res.render('change_email',{msg:"USER DOES NOT EXIST",email:''}); }
    }else{ res.redirect('/changePwd') }
})

app.post('/saveFrm',isallowed,async(req,res)=> {
    const old_ = req.body.old;
    const new_ = req.body.new;
    const repeat_ = req.body.repeat;
    const email = req.body.username;
    const username = email.split('@')[0];
    const domain = email.split('@')[1];
    var conn;
    if(domain == 'ucc.edu.gh'){ 
        conn = new AD({
            url: process.env.AD1_HOST,
            user: process.env.AD1_USER,
            pass: process.env.AD1_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }else if(domain == 'stu.ucc.edu.gh'){ 
        conn = new AD({
            url: process.env.AD2_HOST,
            user: process.env.AD2_USER,
            pass: process.env.AD2_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }else{ 
        conn = new AD({
            url: process.env.AD3_HOST,
            user: process.env.AD3_USER,
            pass: process.env.AD3_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }
    const access = await conn.user(username).authenticate(old_);
    if(access){
        var hashpwd =  sha1(new_);
        var chgad = await conn.user(username).password(new_); // Change Password AD
        var chggs = await google.changePwd(hashpwd,email);// Change Password GSUITE
        console.log('AD:');
        console.log(chgad);
        console.log('GSUITE:');
        console.log(chggs);
        if(chgad.success || chggs.status == 200){
           var msg;
           // Update Password History
              var dt = {mail:email,token:hashpwd,created_at:new Date()}
              await db.query("insert into pwd_history set ?",dt);
           // Output Message
           if(chgad.success && chggs.status == 200){
              msg = "PASSWORD CHANGED SUCCESSFULLY"
           }else if(chgad.success && chggs.status != 200){
              msg = "PASSWORD CHANGED FOR ALL EXCEPT GMAIL"
           }else if(!chgad.success && chggs.status == 200){
              msg = "PASSWORD CHANGED FOR GMAIL ONLY"
           }
           // Redirect to Success Page
           req.session.msg = msg;
           req.session.save();
           res.redirect('/changeOk');
        }else{
           // Password Change failed - Contact Admin
           res.redirect('/changeFail');
        }
    }else{
        // Wrong Credentials
        res.send("<br><br><br><center><h2>Wrong Crendentials</h2></center><script type='text/javascript'>setTimeout(function(){location.href='/changePwd'},3000)</script>");
    }
})
app.get('/changeOk',async(req,res)=> {
    req.session.token = null;
    var msg = req.session.msg;
    req.session.msg = null;
    res.render('change_success',{user:req.session.user,return_url:req.session.return_url,msg})
})

app.get('/changeFail',async(req,res) => {
    req.session.token = null;
    res.render('change_fail',{user:req.session.user})
})

app.post('/checkpwd',isallowed,async(req,res)=> {
    var pwd = sha1(req.body.pwd.trim());
    var mail = req.body.mail;
    var sl = await db.query("select * from pwd_history where mail = '"+mail+"' and token = '"+pwd+"'");
    res.json({pass: sl.length > 0 ? false : true});
})



/* PASSWORD RESET */
app.get('/reset',async(req,res) => {
    req.session.return_url = req.query.return_url || '/resetLogout';
    req.session.save();
    res.render('change_reset_s1',{msg:null,return_url:req.session.return_url})
})

app.post('/reset',async(req,res)=> {
    const email = req.body.email;
    const username = email.split('@')[0];
    const domain = email.split('@')[1];
    var conn;
    if(domain == 'ucc.edu.gh'){ 
        conn = new AD({
            url: process.env.AD1_HOST,
            user: process.env.AD1_USER,
            pass: process.env.AD1_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }else if(domain == 'stu.ucc.edu.gh'){ 
        conn = new AD({
            url: process.env.AD2_HOST,
            user: process.env.AD2_USER,
            pass: process.env.AD2_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }else if(domain == 'mis.dev'){ 
        conn = new AD({
            url: process.env.AD3_HOST,
            user: process.env.AD3_USER,
            pass: process.env.AD3_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }else{
        res.render('change_reset_s1',{ msg:"WRONG USER DOMAIN [ "+domain.toUpperCase()+" ]", email:'',return_url:req.session.return_url});
        return;
    }
    if(email && email != ''){   
      try{  //await ad.user().get({fields: 'sAMAccountName'});
            const user = await conn.user(username).get();
            if(Object.keys(user).length){
               var token = Math.round((Math.random() * 1000)+2000);
               req.session.user = user;
               req.session.token = token;
               req.session.session_id = sha1(new Date());
               req.session.save();
               // Construct SMS token
               var msg = "Greetings, This is your SSO-PIN: "+token+" for verification. It expires in 5 minutes.";
               var mode;
               console.log(token);
               var st = await db.query("select * from hr.staff where ucc_mail = '"+email+"'");
               var dt = {pin:token,user:email,created_at:new Date(),session_id:req.session.session_id};
               await db.query("insert into token set ?",dt);
               if(st.length > 0 && (st[0].phone != null || st[0].phone != '')){
                  // Send By SMS
                  var resp = sms(st[0].phone,msg);
                  mode = 'sms';
               }else{
                  // Send By Mail
                  mail(email,'UCC-SSO PIN',msg);
                  mode = 'mail';
               }
               res.render('change_reset_s2',{ msg:null, row:{mode,email},return_url:req.session.return_url})
            }else{
               res.render('change_reset_s1',{ msg:"USER DOES NOT EXIST", email:'',return_url:req.session.return_url});
            }
      } catch(e){ res.render('change_reset_s1',{ msg:"USER DOES NOT EXIST ! ", email:'',return_url:req.session.return_url});console.log(e); }
    }else{ 
        res.render('change_reset_s1',{msg:"EMPTY EMAIL FIELD",email:'',return_url:req.session.return_url});
    }
})

app.get('/sendsmstoken/:user', async(req,res) => {
    // Construct SMS token
    var token = Math.round((Math.random() * 1000)+2000);
    req.session.token = token;
    req.session.save();
    var email = req.params.user;
    var msg = "Greetings, This is your SSO-PIN: "+token+" for verification. It expires in 5 minutes.";
    var st = await db.query("select * from hr.staff where ucc_mail = '"+email+"'");
    var dt = {pin:token};
    await db.query("update token set ? where session_id = '"+req.session.session_id+"'",dt);
    if(st.length > 0 && (st[0].phone != null || st[0].phone != '')){
       var resp = sms(st[0].phone,msg);
       res.json({success:true,msg:resp});
    }else{
       res.json({success:false,msg:'WRONG PHONE NUMBER'});
    }
});


app.get('/sendmailtoken', async (req,res) => {
    // Construct Mail token
    var token = Math.round((Math.random() * 1000)+2000);
    req.session.token = token;
    req.session.save();
    var email = req.params.user;
    var msg = "Greetings, This is your SSO-PIN: "+token+" for verification. It expires in 5 minutes.";
    var st = await db.query("select * from secure where user = '"+email+"'");
    var dt = {pin:token};
    await db.query("update token set ? where session_id = '"+req.session.session_id+"'",dt);
    if(st.length > 0 && (st[0].alt_email != null || st[0].alt_email != '')){
       mail(st[0].alt_email,'UCC-SSO PIN',msg);
       res.json({success:true,msg:'UCC-SSO PIN MAILED'});
    }else{
       res.json({success:false,msg:'ALTERNATIVE MAIL NOT SET!'});
    }
});


app.get('/resetview', async(req,res) => {
    req.session.return_url = req.query.return_url;
    req.session.token = new Date();//moment().unix();
    req.session.save();
    res.render('secure_dash',{user:{...req.session.user,userPrincipalName:''},msg:null,row:{email:''}})
})

app.post('/resetview',async(req,res)=> {
    const email = req.body.mail;
    const pin = req.body.pin;
    const username = email.split('@')[0];
    const domain = email.split('@')[1];
    var ck = await db.query("select * from token where session_id = '"+req.session.session_id+"' and user = '"+email+"' and pin = "+pin);
    if(ck.length > 0){
        if(ck[0].expired == 1){
            res.json({
                success: false,
                data:'expired',
                msg: 'SSO-PIN EXPIRED ! '
            })
        }else if(ck[0].used == 1){
            res.json({
                success: false,
                data:'used',
                msg: 'SSO-PIN USED ! '
            })
        }else{
            res.json({
                success: true,
            })
        }
    }else{
        res.json({
            success: false,
            data:'error',
            msg: 'SSO-PIN INVALID ! '
        })
    }
})


app.get('/resetform',isResetAllowed,async(req,res) => {
    var pin = req.query.pin;
    var user = req.session.user;
    console.log(user);
    var sw = await db.query("select * from token where session_id = '"+req.session.session_id+"' and user = '"+user.userPrincipalName+"' and pin = "+pin);
    if(sw.length > 0){
      res.render('change_form_reset',{user,return_url:req.session.return_url});
    }else{
      res.render('change_reset_s1',{ msg:"SSO-PIN VERIFICATION FAILED !", email:'',return_url:req.session.return_url});
    }
})


app.post('/resetpwdsave',isResetAllowed,async(req,res) => {
    const new_ = req.body.new;
    const email = req.body.username;
    const username = email.split('@')[0];
    const domain = email.split('@')[1];
    var conn;
    if(domain == 'ucc.edu.gh'){     
        conn = new AD({
            url: process.env.AD1_HOST,
            user: process.env.AD1_USER,
            pass: process.env.AD1_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }else if(domain == 'stu.ucc.edu.gh'){ 
        conn = new AD({
            url: process.env.AD2_HOST,
            user: process.env.AD2_USER,
            pass: process.env.AD2_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }else{ 
        conn = new AD({
            url: process.env.AD3_HOST,
            user: process.env.AD3_USER,
            pass: process.env.AD3_PASS,
            tlsOptions: {
              rejectUnauthorized: false
            }
        });
    }
    const access = await conn.user(username).get();
    if(Object.keys(access).length){
        var hashpwd =  sha1(new_);
        var chgad = await conn.user(username).password(new_); // Change Password AD
        var chggs = await google.changePwd(hashpwd,email);// Change Password GSUITE
        console.log('AD:');
        console.log(chgad);
        console.log('GSUITE:');
        console.log(chggs);
        if(chgad.success || chggs.status == 200){
           var msg,sdata;
           // Update Password History
              var dt = {mail:email,token:hashpwd,created_at:new Date()}
              await db.query("insert into pwd_history set ?",dt);
           // Output Message
           if(chgad.success && chggs.status == 200){
              msg = "PASSWORD CHANGED SUCCESSFULLY";
              sdata = {user:email, last_pwdchange:new Date(),ad_exist:1,gs_exist:1}
              
           }else if(chgad.success && chggs.status != 200){
              msg = "PASSWORD CHANGED FOR ALL EXCEPT GMAIL";
              sdata = {user:email, last_pwdchange:new Date(),ad_exist:1,gs_exist:0}

           }else if(!chgad.success && chggs.status == 200){
              msg = "PASSWORD CHANGED FOR GMAIL ONLY";
              sdata = {user:email, last_pwdchange:new Date(),ad_exist:0,gs_exist:1}
           }

           // Security Data
           var sc = await db.query("select * from secure where user = '"+email+"'");
           if(sc.length > 0){
              sdata.count_pwdchange = sc[0].count_pwdchange+1;
              await db.query("update secure set ? where id ="+sc[0].id,sdata);
           }else{
              sdata.created_at = new Date();
              sdata.count_pwdchange = 1;
              await db.query("insert into secure set ?",sdata);
           }

           // Insert SSO Log
           var logs = {user:email, created_at:new Date(),message:msg,meta: `AD: ${JSON.stringify(chgad)} | GSUITE: ${JSON.stringify(chggs)}`}
           await db.query("insert into sso_log set ?",logs);

           // Redirect to Success Page
           req.session.msg = msg;
           req.session.save();
           res.redirect('/changeOk');
        }else{
           // Password Change failed - Contact Admin
           res.redirect('/changeFail');
        }
    }else{
        // Wrong Credentials
        res.send("<br><br>404 - Invalid User<script type='text/javascript'>setTimeout(function(){window.location.href='/reset'},3000)</script>");
    }
})

app.get('/resetLogout', async(req,res)=> {
    req.session.token = null;
    req.session.user = null;
    req.session.session_id = null;
    res.redirect('/reset');
 })



/* USER LOGIN */
app.get('/userLogin', async(req,res)=> {
   res.render('user_login',{msg:null})
})

app.get('/userDash',isSecureAllowed,async(req,res)=> {
    var st = await db.query("select s.*,q1.question as secure_q1,q2.question as secure_q2,q3.question as secure_q3 from secure s left join secure_questions q1 on s.secure_q1 = q1.id left join secure_questions q2 on s.secure_q2 = q2.id left join secure_questions q3 on s.secure_q3 = q3.id where s.user = '"+req.session.user.userPrincipalName+"'");
    var user = req.session.user;
    if(st.length > 0){
       user = {...user,...st[0]};
    } 
   res.render('user_dash',{user})
})

app.get('/secure',isSecureAllowed, async(req,res) => {
    var qs = await db.query("select * from secure_questions where active = 1");
    var st = await db.query("select * from secure where user = '"+req.session.user.userPrincipalName+"'");
    var user = req.session.user;
    if(st.length > 0){
       user = {...user,...st[0]};
    }  res.render('secure_dash',{user,questions:qs})
})

app.post('/secure', async(req,res)=> {
    var ins = await db.query("update secure set ? where id = "+req.body.id,req.body);
    res.redirect('/userDash');
 })
 

app.get('/userLogout', async(req,res)=> {
   req.session.user = null;
   res.redirect('/userLogin');
})

app.post('/userLogin', async(req,res)=> {
    const pass = req.body.password;
    const email = req.body.email;
    if(email != '' && pass != ''){
        const username = email.split('@')[0];
        const domain = email.split('@')[1];
        var conn;
        if(domain != 'ucc.edu.gh' && domain == 'stu.ucc.edu.gh' && domain == 'mis.dev'){ 
            res.render('user_login',{ msg:'INVALID DOMAIN' });
        }else{
            if(domain == 'ucc.edu.gh'){ 
                conn = new AD({
                    url: process.env.AD1_HOST,
                    user: process.env.AD1_USER,
                    pass: process.env.AD1_PASS,
                    tlsOptions: {
                      rejectUnauthorized: false
                    }
                });
            }else if(domain == 'stu.ucc.edu.gh'){ 
                conn = new AD({
                    url: process.env.AD2_HOST,
                    user: process.env.AD2_USER,
                    pass: process.env.AD2_PASS,
                    tlsOptions: {
                    rejectUnauthorized: false
                    }
                });
            }else if(domain == 'mis.dev'){ 
                conn = new AD({
                    url: process.env.AD3_HOST,
                    user: process.env.AD3_USER,
                    pass: process.env.AD3_PASS,
                    tlsOptions: {
                    rejectUnauthorized: false
                    }
                });
            }
            try{
                const access = await conn.user(username).authenticate(pass);
                if(access){
                    var user = await conn.user(username).get();
                    req.session.user = user;
                    req.session.save();
                    var st = await db.query("select s.*,q1.question as secure_q1,q2.question as secure_q2,q3.question as secure_q3 from secure s left join secure_questions q1 on s.secure_q1 = q1.id left join secure_questions q2 on s.secure_q2 = q2.id left join secure_questions q3 on s.secure_q3 = q3.id where s.user = '"+req.session.user.userPrincipalName+"'");
                    if(st.length > 0){
                      user = {...user,...st[0]};
                    }
                    res.render('user_dash',{user});
                }else{
                    res.render('user_login',{ msg:'USER ACCESS FAILED, CHECK CREDENTIALS' });
                }
            } catch(e){
                res.render('user_login',{ msg:'AUTHENTICATION FAILED' });
            }
        }
    }else{                                      
        res.render('user_login',{ msg:'AUTHENTICATION FAILED!' });
    }
})


/* USER API AUTHENTICATION */
app.post('/api/v1/login', async(req,res)=> {
    const pass = req.body.password;
    const email = req.body.email;
    if(email != '' && pass != ''){
        const username = email.split('@')[0];
        const domain = email.split('@')[1];
        var conn,st;
        if(domain != 'ucc.edu.gh' && domain == 'stu.ucc.edu.gh' && domain == 'mis.dev'){ 
            res.render('user_login',{ msg:'INVALID DOMAIN' });
        }else{
            if(domain == 'ucc.edu.gh'){ 
                conn = new AD({
                    url: process.env.AD1_HOST,
                    user: process.env.AD1_USER,
                    pass: process.env.AD1_PASS,
                    tlsOptions: {
                      rejectUnauthorized: false
                    }
                });
                st = await db.query("select * from hr.staff where ucc_mail = '"+email+"'");

            }else if(domain == 'stu.ucc.edu.gh'){ 
                conn = new AD({
                    url: process.env.AD2_HOST,
                    user: process.env.AD2_USER,
                    pass: process.env.AD2_PASS,
                    tlsOptions: {
                    rejectUnauthorized: false
                    }
                });
                st = await db.query("select t3.regno,t1.studid,concat(t1.fname,' ',ifnull(concat(t1.mname,' '),''),t1.lname) as name,t1.cellphone,t1.progid,t1.email from osisextra.`useraccount` t3 left join osis.students_db t1 on t1.regno = t3.regno where t1.email = '"+email+"'");
                
            }else if(domain == 'mis.dev'){ 
                conn = new AD({
                    url: process.env.AD3_HOST,
                    user: process.env.AD3_USER,
                    pass: process.env.AD3_PASS,
                    tlsOptions: {
                    rejectUnauthorized: false
                    }
                });
            }
            try{
                const access = await conn.user(username).authenticate(pass);
                if(access){
                    const user = await conn.user(username).get();
                    req.session.user = user;
                    req.session.save();
                    var response = {
                        success: true,
                        type: domain == 'ucc.edu.gh' ? 'STAFF' : domain == 'mis.dev' ? 'DEV' : 'STUDENT',
                        data: domain == 'ucc.edu.gh' ? { staff_no: (st.length > 0 ? st[0].staff_no:user.employeeID),staff_group:(st.length > 0 ? st[0].staff_group:''),status:(st.length > 0 ? st[0].staff_status:''),email,phone:(st.length > 0 ? st[0].phone:''),fname:(st.length > 0 ? st[0].fname:''),mname:(st.length > 0 ? st[0].mname:''),lname:(st.length > 0 ? st[0].lname:''),designation:user.description,department:user.department } : {regno:(st.length > 0 ? st[0].regno:user.employeeID),studid:(st.length > 0 ? st[0].studid:user.employeeID)}
                    };  res.json(response);
                }else{  
                    res.json({
                        success:false,
                        msg: 'Invalid credentials'
                    });
                }
            } catch(e){ 
                console.error(e);
                res.json({
                    success:false,
                    msg: 'Authentication error'
                });
            }
        
        }
    }else{                                      
        res.json({
            success:false,
            msg: 'Invalid credentials'
        });
    }
})


/* GOOGLE API TEST */
app.get('/testgsuite', async(req,res)=> {
   res.render('user_login',{msg:null})
})




/* NUSA API - Third party */

// Student Authentication
app.post('/api/v1/nusa/auth',async(req,res)=> {
    const username = req.body.username.trim();
    const password = md5(req.body.password.trim());
    const sql = "select t3.regno,concat(t1.fname,' ',ifnull(concat(t1.mname,' '),''),' ',t1.lname) as name,t2.long_name as program from osisextra.`useraccount` t3 left join osis.students_db t1 on t1.regno = t3.regno left join osis.prog_db t2 on t1.progid = t2.progid where t2.prefix like 'sn/%' and t2.runtype = '01' and t2.progtype = '01' and (t1.doa like '%2016' or t1.doa like '%2017' or t1.doa like '%2018'  or t1.doa like '%2019') and t3.password = '"+password+"' and t3.regno = '"+username+"'"
    var sl = await db.query(sql);
    if(sl.length > 0){
        res.json({
            success : true,
            data : sl[0]
        });
    }else{
        res.json({
            success : false,
            msg : 'user not found'
        });
    }
})

// Students Count
app.get('/api/v1/nusa/count',async(req,res)=> {
    const sql = "select count(t1.regno) as total from osis.students_db t1 left join osis.prog_db t2 on t1.progid = t2.progid where t2.prefix like 'sn/%' and t2.runtype = '01' and t2.progtype = '01' and (t1.doa like '%2016' or t1.doa like '%2017' or t1.doa like '%2018'  or t1.doa like '%2019')";
    var sl = await db.query(sql);
    if(sl.length > 0){
        res.json({
            success : true,
            data : sl[0].total
        });
    }else{
        res.json({
            success : false,
            msg : 'record not found'
        });
    }
})


/* UCCABS API - Third party */

// Student Authentication
app.post('/api/v1/uccabs/auth',async(req,res)=> {
    const username = req.body.username.trim();
    const password = md5(req.body.password.trim());
    const sql = "select t3.regno,t1.studid,concat(t1.fname,' ',ifnull(concat(t1.mname,' '),''),' ',t1.lname) as name,t2.long_name as program from osisextra.`useraccount` t3 left join osis.students_db t1 on t1.regno = t3.regno left join osis.prog_db t2 on t1.progid = t2.progid where t2.prefix like 'sb/%' and t2.runtype = '01' and t2.progtype = '01' and (t1.doa like '%2016' or t1.doa like '%2017' or t1.doa like '%2018'  or t1.doa like '%2019') and t3.password = '"+password+"' and t3.regno = '"+username+"'"
    var sl = await db.query(sql);
    if(sl.length > 0){
        res.json({
            success : true,
            data : sl[0]
        });
    }else{
        res.json({
            success : false,
            msg : 'user not found'
        });
    }
})

app.post('/api/v1/uccabs/auth_raw',async(req,res)=> {
    const username = req.body.username.trim();
    const password = req.body.password.trim();
    const sql = "select t3.regno,t1.studid,concat(t1.fname,' ',ifnull(concat(t1.mname,' '),''),' ',t1.lname) as name,t2.long_name as program from osisextra.`useraccount` t3 left join osis.students_db t1 on t1.regno = t3.regno left join osis.prog_db t2 on t1.progid = t2.progid where t2.prefix like 'sb/%' and t2.runtype = '01' and t2.progtype = '01' and (t1.doa like '%2016' or t1.doa like '%2017' or t1.doa like '%2018'  or t1.doa like '%2019') and t3.password = '"+password+"' and t3.regno = '"+username+"'"
    var sl = await db.query(sql);
    if(sl.length > 0){
        res.json({
            success : true,
            data : sl[0]
        });
    }else{
        res.json({
            success : false,
            msg : 'user not found'
        });
    }
})

// Students Count
app.get('/api/v1/uccabs/count',async(req,res)=> {
    const sql = "select count(t1.regno) as total from osis.students_db t1 left join osis.prog_db t2 on t1.progid = t2.progid where t2.prefix like 'sb/%' and t2.runtype = '01' and t2.progtype = '01' and (t1.doa like '%2016' or t1.doa like '%2017' or t1.doa like '%2018'  or t1.doa like '%2019')";
    var sl = await db.query(sql);
    if(sl.length > 0){
        res.json({
            success : true,
            data : sl[0].total
        });
    }else{
        res.json({
            success : false,
            msg : 'record not found'
        });
    }
})


//# STEP 3








/*
app.get('/principal', async(req,res)=> {
    var users = await ad.user().get({fields:'userPrincipalName'});
    res.json(users);
})

app.get('/add', async(req,res)=> {
    await ad.user().add({
        userName: 'kofi',
        commonName: 'Kofi Yesu',
        password: 'J@vascr!pt1'
    });
})

app.get('/change', async(req,res)=> {
    try{
        var te = await ad.user('ebenezer.ackah').password('p@ssw0rd1234');
        res.json(te);
    }catch (e){
        res.json(e)
    }
})

app.get('/test', async(req,res)=> {
     var test = await ad.user('jsmith').authenticate('p@ssw0rd__121AA02BBSS');
     res.json(test);
})
app.get('/user', async(req,res)=> {
    var test = await ad.user('jsmith').get();
    res.json(test);
})

app.get('/enable', async(req,res)=> {
    var test = await ad.user('jsmith').enable();
    res.json(test);
})

//await ad.user('jsmith').authenticate('J@vascript1#!');
*/
const port = process.env.PORT || 5006
app.listen(port,()=>{
    console.log(`Server started st port : ${port}`);
})


/*  ## Discoveries && Cron Jobs

  1. Script to insert or update `Biodata tbl` from osis DB to finance DB -- Sequential (updated_at, created_at flags) -- Run script every day in 30 mins ( compare created_at and updated_at)
     -- First fetch all created records in that day and send to `biodata tbl` if not exist in biodata
     -- Second fetch all updated records in that day and send to `biodata tbl` if `updated_at` timestamp is less

  

*/