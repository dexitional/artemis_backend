var bcrypt = require("bcrypt");
var moment = require("moment");
var jwt = require("jsonwebtoken");
const fs = require("fs");
const sha1 = require("sha1");
const path = require("path");
const { customAlphabet } = require("nanoid");
const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwzyx", 8);
const digit = customAlphabet("1234567890", 4);
const mailer = require("../../config/email");
const sms = require("../../config/sms");
const db = require("../../config/mysql");

const SSO = require("../../model/mysql/ssoModel");
const Admission = require("../../model/mysql/admissionModel");
const Student = require("../../model/mysql/studentModel");
const {
  getSemestersByCode,
  getUsername,
  decodeBase64Image,
} = require("../../middleware/util");

module.exports = {
  authenticateUser: async (req, res) => {
    const { username, password } = req.body;
    try {
      var user = await SSO.verifyUser({ username, password });
      if (user && user.length > 0) {
        var roles = await SSO.fetchRoles(user[0].uid); // Roles
        var photo = await SSO.fetchPhoto(user[0].uid); // Photo
        var evsRoles = await SSO.fetchEvsRoles(user[0].tag); // EVS Roles
        var userdata = await SSO.fetchUser(user[0].uid, user[0].group_id); // UserData

        userdata[0] = userdata
          ? {
              ...userdata[0],
              user_group: user[0].group_id,
              mail: user[0].username,
            }
          : null;

        var data = {
          roles: [...roles, ...evsRoles],
          photo:
            (photo && photo.length) > 0
              ? `${req.protocol}://${req.get("host")}/api/photos/?tag=${
                  photo && photo[0].tag
                }`
              : `${req.protocol}://${req.get("host")}/api/photos/?tag=00000000`,
          user: userdata && userdata[0],
        };
        // Generate Session Token
        const token = jwt.sign({ data: user }, "secret", {
          expiresIn: 60 * 60,
        });
        data.token = token;

        const lgs = await SSO.logger(user[0].uid, "LOGIN_SUCCESS", {
          username,
        }); // Log Activity
        res.status(200).json({ success: true, data });
      } else {
        const lgs = await SSO.logger(0, "LOGIN_FAILED", { username }); // Log Activity
        res.status(200).json({
          success: false,
          data: null,
          msg: "Invalid username or password!",
        });
      }
    } catch (e) {
      console.log(e);
      const lgs = await SSO.logger(0, "LOGIN_ERROR", { username, error: e }); // Log Activity
      res
        .status(200)
        .json({ success: false, data: null, msg: "System error detected." });
    }
  },

  authenticateGoogle: async (req, res) => {
    const { email } = req.body;
    const pwd = nanoid();
    try {
      var user = await SSO.fetchUserByVerb(email);
      if (user) {
        const isUser = await SSO.fetchSSOUser(user.tag);
        if (isUser && isUser.length > 0) {
          // SSO USER EXISTS
          const uid = isUser[0].uid;
          var roles = await SSO.fetchRoles(uid); // Roles
          const photo = `${req.protocol}://${req.get(
            "host"
          )}/api/photos/?tag=${encodeURIComponent(
            user.tag.toString().toLowerCase()
          )}`;
          var evsRoles = await SSO.fetchEvsRoles(user.tag); // EVS Roles
          var userdata = await SSO.fetchUser(uid, user.gid); // UserData
          userdata[0] = userdata
            ? { ...userdata[0], user_group: user.gid, mail: email }
            : null;
          var data = {
            roles: [...roles, ...evsRoles],
            photo,
            user: userdata && userdata[0],
          };
          // Generate Session Token
          const token = jwt.sign({ data: user }, "secret", {
            expiresIn: 60 * 60,
          });
          data.token = token;
          // Log Activity
          const lgs = await SSO.logger(uid, "LOGIN_SUCCESS", { email }); // Log Activity
          res.status(200).json({ success: true, data });
        } else {
          // SSO USER NOT STAGED
          const ups = await SSO.insertSSOUser({
            username: email,
            password: sha1(pwd),
            group_id: user.gid,
            tag: user.tag,
          });
          if (ups) {
            const uid = ups.insertId;
            //const msg = `Hi, your username: ${email} password: ${pwd} .Goto https://ehub.ucc.edu.gh to access Other UCC Portal Services!`
            //const sm = sms(user.phone,msg)
            var evsRoles = await SSO.fetchEvsRoles(user.tag); // EVS Roles
            var userdata = await SSO.fetchUser(uid, user.gid); // UserData
            userdata[0] = userdata
              ? { ...userdata[0], user_group: user.gid, mail: email }
              : null;
            var data = {
              roles: [...evsRoles],
              photo: `${req.protocol}://${req.get(
                "host"
              )}/api/photos/?tag=${user.tag.toString().toLowerCase()}`,
              user: userdata && userdata[0],
            };
            // Generate Session Token
            const token = jwt.sign({ data: user }, "secret", {
              expiresIn: 60 * 60,
            });
            data.token = token;
            // Log Activity
            const lgs = await SSO.logger(uid, "LOGIN_SUCCESS", { email }); // Log Activity
            return res.status(200).json({ success: true, data });
          } else {
            res.status(200).json({
              success: false,
              data: null,
              msg: "Couldnt stage SSO Account!",
            });
          }
        }
      } else {
        const lgs = await SSO.logger(0, "LOGIN_FAILED", { email }); // Log Activity
        res.status(200).json({
          success: false,
          data: null,
          msg: "Invalid username or password!",
        });
      }
    } catch (e) {
      console.log(e);
      const lgs = await await SSO.logger(0, "LOGIN_ERROR", { email, error: e }); // Log Activity
      res
        .status(200)
        .json({ success: false, data: null, msg: "System error detected." });
    }
  },

  sendOtp: async (req, res) => {
    var { email } = req.body;
    try {
      var user = !email.includes("@")
        ? await SSO.fetchUserByPhone(email)
        : await SSO.verifyUserByEmail({ email });
      if (user && user.length > 0) {
        const otp = digit(); // Generate OTP
        const dt = {
          access_token: otp,
          access_expire: moment()
            .add(5, "minutes")
            .format("YYYY-MM-DD HH:mm:ss"),
        };
        const ups = await SSO.updateUserByEmail(user[0].username, dt);
        var sendcode;
        if (ups) {
          const person = await SSO.fetchUser(user[0].uid, user[0].group_id);
          // Send OTP-SMS
          const msg = `Hi ${person[0].fname}, Reset OTP code is ${otp}`;
          const sm = await sms(person && person[0].phone, msg);
          sendcode = sm.code;
          //if(sm && sm.code == '1000') sendcode = '1000'
        }
        if (sendcode == 1000) {
          res
            .status(200)
            .json({ success: true, data: { otp, email: user[0].username } });
        } else if (sendcode == 1003) {
          res
            .status(200)
            .json({ success: false, data: null, msg: "OTP credit exhausted!" });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "OTP was not sent!" });
        }
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "User does not exist!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Please try again later." });
    }
  },

  verifyOtp: async (req, res) => {
    const { email, token } = req.body;
    try {
      var user = await SSO.verifyUserByEmail({ email });
      if (user && user.length > 0 && user[0].access_token == token) {
        res.status(200).json({ success: true, data: token });
      } else {
        res.status(200).json({
          success: false,
          data: null,
          msg: "OTP verification failed!",
        });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Please try again later." });
    }
  },

  sendPwd: async (req, res) => {
    const { email, password } = req.body;
    try {
      const dt = { password: sha1(password.trim()) };
      const ups = await SSO.updateUserByEmail(email, dt);
      if (ups) {
        res.status(200).json({ success: true, data: "password changed!" });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Password change failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Please try again later." });
    }
  },

  stageusers: async (req, res) => {
    try {
      const students = await Student.fetchUsers("01");
      const staff = await Student.fetchUsers("02");
      var count = 0;
      if (students && students.length > 0) {
        for (user of students) {
          const pwd = nanoid();
          if (user.phone && count < 1) {
            const ups = await SSO.updateUserByEmail(user.username, {
              password: sha1(pwd),
            });
            const msg = `Hello ${user.fname.toLowerCase()}, Login info, U: ${
              user.username
            }, P: ${pwd} Goto https://portal.aucc.edu.gh to access portal.`;
            const resp = sms(user.phone, msg);
            //if(resp.code == '1000')
            count = count + 1;
            console.log(count);
            console.log(resp.code);
          }
        }
      }
      if (staff && staff.length > 0) {
        for (user of staff) {
          const pwd = nanoid();
          if (user.phone) {
            const ups = await SSO.updateUserByEmail(user.username, {
              password: sha1(pwd),
            });
            const msg = `Hello ${user.fname.toLowerCase()}, Login info, U: ${
              user.username
            }, P: ${pwd} Goto https://portal.aucc.edu.gh to access portal.`;
            const resp = sms(user.phone, msg);
            //if(resp.code == '1000')
            count += 1;
            console.log(count);
            console.log(resp.code);
          }
        }
      }
      res.status(200).json({ success: true, data: count });
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Please try again later." });
    }
  },

  testsms: async (req, res) => {
    try {
      const pwd = nanoid();
      const msg = `Hello kobby, Login info, U: test\@st.aucc.edu.gh, P: ${pwd} Goto https://portal.aucc.edu.gh to access portal.`;
      const resp = sms("0277675089", msg);
      //if(resp.code == '1000')
      console.log(resp.code);
      res.status(200).json({ success: true, data: resp });
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Please try again later." });
    }
  },

  fetchEvsPhoto: async (req, res) => {
    const tag = req.query.tag.trim().toLowerCase();
    const eid = req.query.eid;
    var pic = await SSO.fetchEvsPhoto(tag, eid); // Photo
    if (pic.length > 0) {
      var filepath = path.join(__dirname, "/../../", pic[0].path);
      try {
        var stats = fs.statSync(filepath);
        if (stats) {
          res
            .status(200)
            .sendFile(path.join(__dirname, "/../../", pic[0].path));
        } else {
          res
            .status(200)
            .sendFile(path.join(__dirname, "/../../public/cdn", "none.png"));
        }
      } catch (e) {
        res
          .status(200)
          .sendFile(path.join(__dirname, "/../../public/cdn", "none.png"));
      }
    } else {
      res
        .status(200)
        .sendFile(path.join(__dirname, "/../../public/cdn", "none.png"));
    }
  },

  fetchPhoto: async (req, res) => {
    const tag = req.query.tag.trim().toLowerCase();
    try {
      const bio = await SSO.fetchUserByVerb(tag); // Biodata
      console.log(tag,bio)
      if (bio) {
        var pic = await SSO.fetchPhoto(tag, bio.gid); // Photo
        if (pic) {
          res.status(200).sendFile(pic);
        } else {
          res
            .status(200)
            .sendFile(path.join(__dirname, "/../../public/cdn", "none.png"));
        }
      } else {
        res
          .status(200)
          .sendFile(path.join(__dirname, "/../../public/cdn", "none.png"));
      }
    } catch (err) {
      res
        .status(200)
        .sendFile(path.join(__dirname, "/../../public/cdn", "none.png"));
    }
  },

  postPhoto: async (req, res) => {
    console.log(req.body)
    const { tag, group_id, lock } = req.body;
    var mpath;
    switch (group_id) {
      case "01":
        mpath = "student";
        break;
      case "02":
        mpath = "staff";
        break;
      case "03":
        mpath = "nss";
        break;
      case "04":
        mpath = "applicant";
        break;
      case "05":
        mpath = "alumni";
        break;
      default:
        mpath = "student";
        break;
    }
    var imageBuffer = decodeBase64Image(req.body.photo);
    const dest = path.join(__dirname,"/../../public/cdn/photo/" + mpath,tag && tag.toString().replaceAll("/", "").trim().toLowerCase() + ".jpg");
    const dbpath = "./public/cdn/photo/" +mpath +"/" +tag.toString().replaceAll("/", "").trim().toLowerCase() +".jpg";
    fs.writeFile(dest, imageBuffer.data, async function (err) {
      if (err) res.status(200).json({ success: false, data: null, msg: "Photo not saved!" });
     
      const stphoto = `${req.protocol}://${req.get(
        "host"
      )}/api/photos/?tag=${tag.toString().toLowerCase()}&cache=${
        Math.random() * 1000
      }`;
      res.status(200).json({ success: true, data: stphoto });  
    });
  },

  sendPhotos: async (req, res) => {
    var { gid } = req.body;
    var spath = path.join(__dirname,"/../../public/cdn/photo/"), mpath;
    if (req.files && req.files.photos.length > 0) {
      for (var file of req.files.photos) {
        switch (parseInt(gid)) {
          case 1:
            mpath = `${spath}/student/`;
            break;
          case 2:
            mpath = `${spath}/staff/`;
            break;
          case 3:
            mpath = `${spath}/nss/`;
            break;
          case 4:
            mpath = `${spath}/applicant/`;
            break;
          case 5:
            mpath = `${spath}/alumni/`;
            break;
          case 6:
            mpath = `${spath}/code/`;
            break;
        }
        let tag = file.name
          .toString()
          .split(".")[0]
          .replaceAll("/", "")
          .trim()
          .toLowerCase();
        tag = `${mpath}${tag}.jpg`;
        file.mv(tag, (err) => {
          if (!err) count = count + 1;
        });
      }
      res.status(200).json({ success: true, data: null });
    }
  },

  rotatePhoto: async (req, res) => {
    var { tag, group_id } = req.body;
    var spath = path.join(__dirname,"/../../public/cdn/photo/");
    switch (parseInt(group_id)) {
      case 1:
        spath = `${spath}/student/`;
        break;
      case 2:
        spath = `${spath}/staff/`;
        break;
      case 3:
        spath = `${spath}/nss/`;
        break;
      case 4:
        spath = `${spath}/applicant/`;
        break;
      case 5:
        spath = `${spath}/alumni/`;
        break;
      case 6:
        spath = `${spath}/code/`;
        break;
    }
    tag = tag.toString().replaceAll("/", "").trim().toLowerCase();
    const file = `${spath}${tag}.jpg`;
    var stats = fs.statSync(file);
    if (stats) {
      await rotateImage(file);
      const stphoto = `${req.protocol}://${req.get(
        "host"
      )}/api/photos/?tag=${tag.toString().toLowerCase()}&cache=${
        Math.random() * 1000
      }`;
      res.status(200).json({ success: true, data: stphoto });
    } else {
      res
        .status(200)
        .json({ success: false, data: null, msg: "Photo Not Found!" });
    }
  },

  removePhoto: async (req, res) => {
    var { tag, group_id } = req.body;
    var spath = path.join(__dirname,"/../../public/cdn/photo/");
    switch (parseInt(group_id)) {
      case 1:
        spath = `${spath}/student/`;
        break;
      case 2:
        spath = `${spath}/staff/`;
        break;
      case 3:
        spath = `${spath}/nss/`;
        break;
      case 4:
        spath = `${spath}/applicant/`;
        break;
      case 5:
        spath = `${spath}/alumni/`;
        break;
      case 6:
        spath = `${spath}/code/`;
        break;
    }
    tag = tag.toString().replaceAll("/", "").trim().toLowerCase();
    const file = `${spath}${tag}.jpg`;
    var stats = fs.statSync(file);
    if (stats) {
      fs.unlinkSync(file);
      const stphoto = `${req.protocol}://${req.get(
        "host"
      )}/api/photos/?tag=${tag.toString().toLowerCase()}&cache=${
        Math.random() * 1000
      }`;
      res.status(200).json({ success: true, data: stphoto });
    } else {
      res
        .status(200)
        .json({ success: false, data: null, msg: "Photo Not Found!" });
    }
  },

  // APPLICATION MODULES

  /* AMS Module Logics */

  // SESSION CONTROLS

  fetchSessions: async (req, res) => {
    try {
      var sessions = await SSO.fetchSessions();
      if (sessions && sessions.length > 0) {
        res.status(200).json({ success: true, data: sessions });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res.status(200).json({
        success: false,
        data: null,
        msg: "Something went wrong error !",
      });
    }
  },

  postSession: async (req, res) => {
    try {
      const { session_id } = req.body;
      if (!req.body.exam_start || req.body.exam_start == "Invalid date")
        delete req.body.exam_start;
      if (!req.body.exam_end || req.body.exam_end == "Invalid date")
        delete req.body.exam_end;
      if (!req.body.admission_date || req.body.admission_date == "Invalid date")
        delete req.body.admission_date;
      if (!req.body.apply_start || req.body.apply_start == "Invalid date")
        delete req.body.apply_start;
      if (!req.body.apply_end || req.body.apply_end == "Invalid date")
        delete req.body.apply_end;
      var resp;
      if (session_id > 0) {
        // Updates
        resp = await SSO.updateSession(session_id, req.body);
      } else {
        // Insert
        resp = await SSO.insertSession(req.body);
      }

      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteSession: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteSession(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  setDefaultSession: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.setDefaultSession(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // VENDOR CONTROLS

  fetchVendors: async (req, res) => {
    try {
      var vendors = await SSO.fetchVendors();
      if (vendors && vendors.length > 0) {
        res.status(200).json({ success: true, data: vendors });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postVendor: async (req, res) => {
    console.log(req.body);
    try {
      const { vendor_id } = req.body;
      var resp;
      if (vendor_id > 0) {
        // Updates
        resp = await SSO.updateVendor(vendor_id, req.body);
      } else {
        // Insert
        resp = await SSO.insertVendor(req.body);
      }

      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteVendor: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteVendor(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // VOUCHER CONTROLS

  fetchVouchers: async (req, res) => {
    try {
      const sell_type = req.query.sell_type;
      const page = req.query.page;
      const keyword = req.query.keyword;
      const helpers = await SSO.fetchAMShelpers();
      const {
        session: { session_id: id },
      } = helpers;
      if (sell_type) {
        var vouchers = await SSO.fetchVouchersByType(id, sell_type);
      } else {
        var vouchers = await SSO.fetchVouchers(id, page, keyword);
      }

      if (vouchers && vouchers.data.length > 0) {
        res.status(200).json({ success: true, data: vouchers });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postVoucher: async (req, res) => {
    try {
      console.log(req.body);
      const {
        session_id,
        quantity,
        group_id,
        sell_type,
        vendor_id,
        created_by,
      } = req.body;
      var resp;
      if (session_id && session_id > 0) {
        var lastIndex = await SSO.getLastVoucherIndex(session_id);
        if (quantity > 0) {
          for (var i = 1; i <= quantity; i++) {
            let dt = {
              serial: lastIndex + i,
              pin: nanoid(),
              session_id,
              group_id,
              sell_type,
              vendor_id,
              created_by,
            };
            console.log(dt);
            resp = await SSO.insertVoucher(dt);
          }
        }
      }

      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteVoucher: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteVoucher(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  recoverVoucher: async (req, res) => {
    try {
      const { serial, email, phone } = req.body;
      console.log(req.body);
      var resp;
      if (serial && email) {
        const sr = await SSO.fetchVoucherBySerial(serial);
        if (sr && sr.length > 0) {
          const ms = {
            title: "AUCC VOUCHER",
            message: `Your recovered voucher details are: [ SERIAL: ${serial}, PIN: ${sr[0].pin} ]`,
          };
          mailer(email.trim(), ms.title, ms.message);
          resp = sr;
        }
      } else if (phone) {
        const sr = await SSO.fetchVoucherByPhone(phone);
        console.log(phone);
        if (sr && sr.length > 0) {
          const message = `Hi! AUCC Voucher for ${sr[0].applicant_name} is : ( SERIAL: ${sr[0].serial} PIN: ${sr[0].pin} )`;
          sms(phone, message);
          resp = sr;
        }
      }

      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res.status(200).json({
          success: false,
          data: null,
          msg: "INVALID VOUCHER INFO PROVIDED !",
        });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  resendVoucher: async (req, res) => {
    try {
      const { serial } = req.body;
      const vs = await SSO.resendVoucherBySms(serial);
      if (vs) {
        const msg = `Hi! AUCC Voucher for ${vs[0].buyer_name} is : ( SERIAL: ${vs[0].serial} PIN: ${vs[0].pin} , Goto https://portal.aucc.edu.gh/applicant )`;
        const send = sms(vs[0].buyer_phone, msg);
        if (send.code == 1000) {
          await SSO.updateVoucherLogBySerial(serial, { sms_log: send.code });
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "VOUCHER NOT SENT!" });
        }
      } else {
        res.status(200).json({
          success: false,
          data: null,
          msg: "VOUCHER NOT REGISTERED IN LOGS!",
        });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  sellVoucher: async (req, res) => {
    try {
      const { serial, name, phone } = req.body;
      var resp;
      if (serial && phone && name) {
        const sr = await SSO.sellVoucherBySerial(serial, name, phone);
        if (sr) {
          const message = `Hello! voucher for ${name} is : ( SERIAL: ${serial} PIN: ${sr.pin} )`;
          sms(phone, message);
          resp = sr;
        }
      }
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "ACTION FAILED !" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  // APPLICANTS CONTROLS

  fetchApplicants: async (req, res) => {
    try {
      const sell_type = req.query.sell_type;
      const page = req.query.page;
      const keyword = req.query.keyword;
      const group = req.query.group;
      console.log(req.query);
      if (sell_type) {
        var applicants = await SSO.fetchApplicantsByType(sell_type);
      } else {
        var applicants = await SSO.fetchApplicants(group, page, keyword);
      }

      if (applicants && applicants.data.length > 0) {
        res.status(200).json({ success: true, data: applicants });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchApplicant: async (req, res) => {
    try {
      const { serial } = req.params;
      var data = {};
      // Get Instance of Applicant
      const instance = await Admission.fetchMeta(serial);
      if (instance && instance.length > 0) {
        data.isNew = false;
        data.user = {
          photo: instance[0].photo,
          serial: instance[0].serial,
          name: instance[0].applicant_name,
          group_name: instance[0].group_name,
        };
        data.flag_submit = instance[0].flag_submit;
        data.stage_id = instance[0].stage_id;
        data.apply_type = instance[0].apply_type;
        // Load Applicant Form Meta
        var meta;
        if (instance[0].meta != null) {
          meta = JSON.parse(instance[0].meta);
        } else {
          let stage = await Admission.fetchStageByGroup(applicant[0].group_id);
          meta = stage && JSON.parse(stage[0].formMeta);
        }
        var newMeta = {};
        for (var mt of meta) {
          if (!["complete", "review"].includes(mt.tag)) {
            const vl = await Admission.fetchTagData(serial, mt.tag);
            if (vl && vl.length > 0)
              newMeta = {
                ...newMeta,
                [mt.tag]: ["profile", "guardian"].includes(mt.tag) ? vl[0] : vl,
              };
          }
          if (mt.tag == "result") {
            const grades = await Admission.fetchResultGrades(serial);
            if (grades && grades.length > 0)
              newMeta = { ...newMeta, grade: grades };
          }
        }
        data.data = newMeta;
        data.meta = meta;
        data.count = meta.length;
        console.log(data.user);
        res.json({ success: true, data });
      } else {
        res.json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res.json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  fetchDocuments: async (req, res) => {
    try {
      const { serial } = req.params;
      const docs = await SSO.fetchDocuments(serial);
      if (docs && docs.length > 0) {
        res.json({ success: true, docs });
      } else {
        res.json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res.json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  addToSort: async (req, res) => {
    try {
      const { serial } = req.params;
      var resp = await SSO.addToSort(serial);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // SORTED APPLICANTS CONTROLS
  fetchSortedApplicants: async (req, res) => {
    try {
      const sell_type = req.query.sell_type;
      const page = req.query.page;
      const keyword = req.query.keyword;
      if (sell_type) {
        var applicants = await SSO.fetchApplicantsByType(sell_type);
      } else {
        var applicants = await SSO.fetchSortedApplicants(page, keyword);
      }

      if (applicants && applicants.data.length > 0) {
        res.status(200).json({ success: true, data: applicants });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  // REMOVE SORTED APPLICANT
  removeSortData: async (req, res) => {
    try {
      const { serial } = req.params;
      var resp = await SSO.removeSortData(serial);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  // ADMIT APPLICANT AS STUDENT
  admitApplicant: async (req, res) => {
    try {
      const vs = await SSO.admitApplicant(req.body);
      if (vs) {
        const msg = `Congrats ${vs.fname}! You have been offered admission into the ${vs.program} program, Visit the portal to accept the offer and for more information. Goto https://portal.aucc.edu.gh/applicant )`;
        const send = await sms(vs.phone, msg);
        res.status(200).json({ success: true, data: vs });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "PROCESS FAILED !" });
      }
    } catch (e) {
      console.log(e);
      res.status(200).json({
        success: false,
        data: null,
        msg: "SOMETHING WRONG HAPPENED !",
      });
    }
  },

  switchVoucher: async (req, res) => {
    try {
      const vs = await SSO.switchVoucher(req.body);
      if (vs) {
        res.status(200).json({ success: true, data: vs });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "PROCESS FAILED !" });
      }
    } catch (e) {
      res.status(200).json({
        success: false,
        data: null,
        msg: "SOMETHING WRONG HAPPENED !",
      });
    }
  },

  reAdmitApplicant: async (req, res) => {
    try {
      const vs = await SSO.reAdmitApplicant(req.body);
      if (vs) {
        const msg = `Congrats ${vs.fname}! You have been offered admission into the ${vs.program} program, Visit the portal to accept the offer and for more information. Goto https://portal.aucc.edu.gh/applicant )`;
        const send = await sms(vs.phone, msg);
        res.status(200).json({ success: true, data: vs });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "PROCESS FAILED !" });
      }
    } catch (e) {
      console.warn(e);
      res.status(200).json({
        success: false,
        data: null,
        msg: "SOMETHING WRONG HAPPENED !",
      });
    }
  },

  // MATRICULANTS CONTROLS

  fetchFreshers: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var applicants = await SSO.fetchFreshers(page, keyword);
      console.log(applicants)
      if (applicants && applicants.data.length > 0) {
        res.status(200).json({ success: true, data: applicants });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchFreshersData: async (req, res) => {
    try {
      var freshers = await SSO.fetchFreshersData();
      if (freshers && freshers.length > 0) {
        res.status(200).json({ success: true, data: freshers });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  removeFresherData: async (req, res) => {
    try {
      const { serial } = req.params;
      var freshers = await SSO.removeFresherData(serial);
      if (freshers) {
        res.status(200).json({ success: true, data: freshers });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  // LETTERS CONTROLS

  fetchLetters: async (req, res) => {
    try {
      var letters = await SSO.fetchLetters();
      if (letters && letters.length > 0) {
        res.status(200).json({ success: true, data: letters });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res.status(200).json({
        success: false,
        data: null,
        msg: "Something went wrong error !",
      });
    }
  },

  postLetter: async (req, res) => {
    try {
      const { id } = req.body;
      console.log(req.body);
      var resp;
      if (id > 0) {
        // Updates
        resp = await SSO.updateLetter(id, req.body);
      } else {
        // Insert
        req.body.status = 0;
        resp = await SSO.insertLetter(req.body);
      }

      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteLetter: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteLetter(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  setDefaultLetter: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(req.params)
      var resp = await SSO.setDefaultLetter(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // ADMISSION REPORTS
  postAdmisssionReport: async (req, res) => {
    try {
      const { prog_id, gender } = req.body;
      console.log(req.body);
      var resp = await SSO.AdmissionReport({
        gender,
        prog_id,
      });
      console.log(resp);

      if (resp) {
        res.status(200).json({ success: true, ...resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No Data found!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },


  // SERVICE LETTER

  fetchLetter: async (req, res) => {
    try {
      const { tag } = req.params;
      var resp = await SSO.fetchServiceLetter(tag);
      console.log(resp)
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // DEFERMENT CONTROLS

  fetchDefer: async (req, res) => {
    try {
      var defers = await SSO.fetchDefer();
      if (defers && defers.length > 0) {
        res.status(200).json({ success: true, data: defers });
      } else {
        res.status(200).json({ success: true, data: [], msg: "No records!" });
      }
    } catch (e) {
      console.warn(e);
      res.status(200).json({
        success: false,
        data: null,
        msg: "Something went wrong error !",
      });
    }
  },

  postDefer: async (req, res) => {
    try {
      const { id } = req.body;
      console.log(req.body);
      var resp;
      if (id > 0) {
        // Updates
        resp = await SSO.updateDefer(id, req.body);
      } else {
        // Insert
        resp = await SSO.insertDefer(req.body);
      }

      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteDefer: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteDefer(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  approveDefer: async (req, res) => {
    try {
      const { id, sno } = req.params;
      var resp = await SSO.approveDefer(id, sno);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  resumeDefer: async (req, res) => {
    try {
      const { id, sno } = req.params;
      var resp = await SSO.resumeDefer(id, sno);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // SERVICE LETTERS

  fetchServiceLetters: async (req, res) => {
    try {
      var letters = await SSO.fetchServiceLetters();
      if (letters && letters.length > 0) {
        res.status(200).json({ success: true, data: letters });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res.status(200).json({
        success: false,
        data: null,
        msg: "Something went wrong error !",
      });
    }
  },

  postServiceLetter: async (req, res) => {
    try {
      const { id } = req.body;
      console.log(req.body);
      var resp;
      if (id > 0) {
        // Updates
        resp = await SSO.updateServiceLetter(id, req.body);
      } else {
        // Insert
        req.body.status = 0;
        resp = await SSO.insertServiceLetter(req.body);
      }

      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteServiceLetter: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteServiceLetter(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // ENTRANCE CONTROLS

  fetchEntrance: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;

      var entrance = await SSO.fetchEntrance(page, keyword);
      if (entrance && entrance.data.length > 0) {
        res.status(200).json({ success: true, data: entrance });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res.status(200).json({
        success: false,
        data: null,
        msg: "Something went wrong error !",
      });
    }
  },

  postEntrance: async (req, res) => {
    try {
      const { id } = req.body;
      var resp;
      if (id > 0) {
        // Updates
        resp = await SSO.updateEntrance(id, req.body);
      } else {
        // Insert
        const { session } = await SSO.fetchAMShelpers();
        console.log(session);
        if (session) req.body.session_id = session.session_id;
        resp = await SSO.insertEntrance(req.body);
      }

      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteEntrance: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteEntrance(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  viewEntrance: async (req, res) => {
    try {
      const { serial } = req.params;
      var resp = await SSO.viewEntrance(serial);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // STUDENT CONTROLS

  fetchStudents: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;

      var students = await SSO.fetchStudents(page, keyword);

      if (students && students.data.length > 0) {
        res.status(200).json({ success: true, data: students });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postStudentAIS: async (req, res) => {
    const { id } = req.body;
    //let dt = {narrative:req.body.narrative,tag:req.body.tag,amount: req.body.amount,currency:req.body.currency,post_type:req.body.post_type,group_code:req.body.group_code}
    if (req.body.major_id == "") delete req.body.major_id;
    if (req.body.prog_id == "") delete req.body.prog_id;
    if (req.body.dob == "" || req.body.dob == "Invalid date" || !req.body.dob) {
      delete req.body.dob;
    } else {
      req.body.dob = moment(req.body.dob).format("YYYY-MM-DD");
    }
    if (req.body.doa == "" || req.body.doa == "Invalid date" || !req.body.doa) {
      delete req.body.doa;
    } else {
      req.body.doa = moment(req.body.doa).format("YYYY-MM-DD");
    }
    if (req.body.doc == "" || req.body.doc == "Invalid date" || !req.body.doc) {
      delete req.body.doc;
    } else {
      req.body.doc = moment(req.body.doc).format("YYYY-MM-DD");
    }
    if (req.body.indexno == "") {
      req.body.indexno = null;
      req.body.prog_count = 0;
    }
    delete req.body.uid;
    delete req.body.flag_locked;
    delete req.body.flag_disabled;
    delete req.body.program_name;
    delete req.body.department;
    delete req.body.major_name;
    delete req.body.name;
    delete req.body.doc;
    console.log(req.body);
    try {
      var resp =
        id <= 0
          ? await SSO.insertAISStudent(req.body)
          : await SSO.updateAISStudent(id, req.body);
      console.log(resp);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  postStudentReportAIS: async (req, res) => {
    try {
      var resp = await SSO.fetchAISStudentReport(req.body);
      console.log(resp);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No Data found!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteStudentAIS: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteVoucher(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  resetAccount: async (req, res) => {
    try {
      const { refno } = req.params;
      const pwd = nanoid();
      var resp = await Student.fetchStudentProfile(refno);
      const ups = await SSO.updateUserByEmail(resp[0].institute_email, {
        password: sha1(pwd),
      });
      const msg = `Hi, your username: ${resp[0].institute_email} password: ${pwd} .Goto https://portal.aucc.edu.gh to access AUCC Portal!`;
      const sm = sms(resp[0].phone, msg);
      if (ups) {
        res.status(200).json({ success: true, data: msg });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  stageAccount: async (req, res) => {
    try {
      const { refno } = req.params;
      const pwd = nanoid();
      var resp = await Student.fetchStudentProfile(refno);
      console.log(resp);
      if (resp && resp.length > 0) {
        if (resp[0].institute_email && resp[0].phone) {
          const ups = await SSO.insertSSOUser({
            username: resp[0].institute_email,
            password: sha1(pwd),
            group_id: 1,
            tag: refno,
          });
          if (ups) {
            const pic = await SSO.insertPhoto(
              ups.insertId,
              refno,
              1,
              "./public/cdn/photo/none.png"
            );
            const msg = `Hi, your username: ${resp[0].institute_email} password: ${pwd} .Goto https://portal.aucc.edu.gh to access AUCC Portal!`;
            const sm = sms(resp[0].phone, msg);
            res.status(200).json({ success: true, data: msg });
          } else {
            res
              .status(200)
              .json({ success: false, data: null, msg: "Action failed!" });
          }
        } else {
          res.status(200).json({
            success: false,
            data: null,
            msg: "Please update Phone or Email!",
          });
        }
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  switchAccount: async (req, res) => {
    try {
      const { tag } = req.params;
      var user = await SSO.fetchSSOUser(tag);
      if (user && user.length > 0) {
        var roles = await SSO.fetchRoles(user[0].uid); // Roles
        var photo = await SSO.fetchPhoto(user[0].uid); // Photo
        var userdata = await SSO.fetchUser(user[0].uid, user[0].group_id); // UserData
        console.log(userdata);
        userdata[0] = userdata
          ? {
              ...userdata[0],
              user_group: user[0].group_id,
              mail: user[0].username,
            }
          : null;
        var data = {
          roles,
          photo:
            (photo && photo.length) > 0
              ? `${req.protocol}://${req.get("host")}/api/photos/?tag=${
                  photo && photo[0].tag
                }`
              : `${req.protocol}://${req.get("host")}/api/photos/?tag=00000000`,
          user: userdata && userdata[0],
        };
        // Generate Session Token
        const token = jwt.sign({ data: user }, "secret", {
          expiresIn: 60 * 60,
        });
        data.token = token;

        const lgs = await SSO.logger(user[0].uid, "ACCESS_GRANTED", { tag }); // Log Activity
        res.status(200).json({ success: true, data });
      } else {
        const lgs = await SSO.logger(0, "ACCESS_DENIED", { tag }); // Log Activity
        res
          .status(200)
          .json({ success: false, data: null, msg: "Invalid User ID !" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  generateMail: async (req, res) => {
    try {
      const { refno } = req.params;
      var resp = await Student.fetchStProfile(refno);
      console.log(resp);
      var ups;
      var email;

      if (resp && resp.length > 0) {
        const username = getUsername(resp[0].fname, resp[0].lname);
        email = `${username}@st.aucc.edu.gh`;
        const isExist = await Student.findEmail(email);
        console.log(email);
        console.log(isExist);
        if (isExist && isExist.length > 0) {
          email = `${username}${isExist.length + 1}@st.aucc.edu.gh`;
          ups = await Student.updateStudentProfile(refno, {
            institute_email: email,
          });
        } else {
          ups = await Student.updateStudentProfile(refno, {
            institute_email: email,
          });
        }
      }

      if (ups) {
        res.status(200).json({ success: true, data: email });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  loadFresher: async (req, res) => {
    try {
      const sm = await db.query(
        "insert into ais.student(refno,fname,disability,prog_id,major_id,doa,complete_status,semester) select refno,fname,disability,prog_id,major_id,'2021-09-01' as doa,'0' as complete_status,'1' as semester from ais.student_new"
      );
      const ss = await db.query(
        "select refno,fname,disability,prog_id,major_id,'2021-09-01' as doa from ais.student_new"
      );
      console.log(sm);
      var count = 0;
      if (ss.length > 0 && sm) {
        for (var s of ss) {
          var ups;
          var email;
          var eCount = 2;

          const username = getUsername(s.fname, s.lname);
          email = `${username}@st.aucc.edu.gh`;

          while (true) {
            const isStudExist = await Student.findEmail(email);
            const isUserExist = await Student.findUserEmail(email);
            if (
              (isStudExist && isStudExist.length > 0) ||
              (isUserExist && isUserExist.length > 0)
            ) {
              email = `${username}${eCount}@st.aucc.edu.gh`;
              eCount++;
            } else {
              break;
            }
          }
          console.log(email);
          //email = (isExist && isExist.length > 0) ? `${username}${isExist.length+1}@st.aucc.edu.gh` : email
          const pwd = nanoid();
          const ins = await db.query("insert into identity.user set ?", {
            group_id: 1,
            tag: s.refno,
            username: email,
            password: sha1(pwd),
          });
          if (ins.insertId) {
            ups = await Student.updateStudentProfile(s.refno, {
              institute_email: email,
            });
            count++;
          }
          setTimeout(() => console.log(`delay of 300ms`), 300);
        }
        res.status(200).json({ success: true, data: count });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // REGISTRATIONS
  fetchRegsData: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var streams = (await SSO.fetchStreams()).reduce(
        (acc, val) => (acc == "" ? val.id : acc + "," + val.id),
        ""
      );
      console.log(streams);
      var regs = await SSO.fetchRegsData(streams, page, keyword);
      if (regs && regs.data.length > 0) {
        res.status(200).json({ success: true, data: regs });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchRegsList: async (req, res) => {
    try {
      var session = await SSO.getActiveSessionByMode(1);
      var regs = await SSO.fetchRegsList(session.id, req.query);
      if (regs && regs.length > 0) {
        res
          .status(200)
          .json({ success: true, data: { regdata: regs, session } });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchMountList: async (req, res) => {
    try {
      var session = await SSO.getActiveSessionByMode(1);
      var regs = await SSO.fetchMountList(session.academic_sem);
      if (regs && regs.length > 0) {
        res.status(200).json({ success: true, data: { data: regs, session } });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  processBacklog: async (req, res) => {
    try {
      var regs = await SSO.processBacklog(req.body);
      if (regs) {
        res.status(200).json({ success: true, data: { data: regs } });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  processBacklogCourseAdd: async (req, res) => {
    try {
      var regs = await SSO.processBacklogCourseAdd(req.body);
      if (regs) {
        res.status(200).json({ success: true, data: { data: regs } });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  processBacklogCourseDel: async (req, res) => {
    try {
      var regs = await SSO.processBacklogCourseDel(req.body);
      if (regs) {
        res.status(200).json({ success: true, data: { data: regs } });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  processBackview: async (req, res) => {
    try {
      var regs = await SSO.processBackview(req.body);
      console.log(req.body);
      if (regs) {
        res.status(200).json({ success: true, data: { data: regs } });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  processRegreport: async (req, res) => {
    try {
      var regs = await SSO.processRegreport(req.body);
      console.log(req.body);
      if (regs) {
        res.status(200).json({ success: true, data: regs });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  processSingleBacklog: async (req, res) => {
    try {
      var regs = await SSO.processSingleBacklog(req.body);
      console.log(regs)
      if (regs) {
        res.status(200).json({ success: true, data: { data: regs } });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Student registered against session!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  // SCOREHEETS CONTROL - AIS

  fetchScoresheets: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      const unit_id = req.query.role;
      const stream_main = req.query.stream;

      var stream = new Set();
      var streams = "",
        i = 0;

      var session = await SSO.getActiveSessionByMode(1);
      stream_main && stream_main != "null"
        ? stream.add(stream_main)
        : stream.add(session && session.id);

      /*
      for (var s of await SSO.fetchEntriesSessions()) {
        stream.add(s.id);
      }
      */
      stream.forEach((m) => {
        streams += m + (i == stream.size - 1 ? "" : ",");
        i++;
      });

      var sheets = await SSO.fetchScoresheets(streams, unit_id, page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchMyScoresheets: async (req, res) => {
    try {
      const sno = req.query.sno;
      const page = req.query.page;
      const keyword = req.query.keyword;
      var session = await SSO.getActiveSessionByMode(1);
      var stream = new Set();
      var streams = "",
        i = 0;

      for (var s of await SSO.fetchStreams()) {
        stream.add(s.id);
      }
      for (var s of await SSO.fetchEntriesSessions()) {
        stream.add(s.id);
      }
      stream.forEach((m) => {
        streams += m + (i == stream.size - 1 ? "" : ",");
        i++;
      });
      var sheets = await SSO.fetchMyScoresheets(sno, streams, page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postScoresheets: async (req, res) => {
    const { id } = req.body;
    //let dt = {narrative:req.body.narrative,tag:req.body.tag,amount: req.body.amount,currency:req.body.currency,post_type:req.body.post_type,group_code:req.body.group_code}
    if (req.body.major_id == "") delete req.body.major_id;
    if (req.body.prog_id == "") delete req.body.prog_id;
    if (req.body.dob == "" || req.body.dob == "Invalid date" || !req.body.dob) {
      delete req.body.dob;
    } else {
      req.body.dob = moment(req.body.dob).format("YYYY-MM-DD");
    }
    if (req.body.doa == "" || req.body.doa == "Invalid date" || !req.body.doa) {
      delete req.body.doa;
    } else {
      req.body.doa = moment(req.body.doa).format("YYYY-MM-DD");
    }
    if (req.body.doc == "" || req.body.doc == "Invalid date" || !req.body.doc) {
      delete req.body.doc;
    } else {
      req.body.doc = moment(req.body.doc).format("YYYY-MM-DD");
    }
    delete req.body.uid;
    delete req.body.flag_locked;
    delete req.body.flag_disabled;
    delete req.body.program_name;
    delete req.body.major_name;
    delete req.body.name;
    delete req.body.doc;
    console.log(req.body);
    try {
      var resp =
        id <= 0
          ? await SSO.insertAISStudent(req.body)
          : await SSO.updateAISStudent(id, req.body);
      console.log(resp);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteScoresheet: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteVoucher(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  assignSheet: async (req, res) => {
    try {
      const { id, sno } = req.body;
      var resp = await SSO.assignSheet(id, sno);
      if (resp.count > 0) {
        const msg = `Hi, You have been assigned a new course to assess. Goto https://portal.aucc.edu.gh to access AUCC Portal!`;
        const sm = sms(resp.phone, msg);
        res.status(200).json({ success: true, data: msg });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  unassignSheet: async (req, res) => {
    try {
      const { id, sno } = req.body;
      var resp = await SSO.unassignSheet(id, sno);
      if (resp.count > 0) {
        const msg = `Hi, an assigned course has been removed. Goto https://portal.aucc.edu.gh to access AUCC Portal!`;
        const sm = sms(resp.phone, msg);
        res.status(200).json({ success: true, data: msg });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  loadSheet: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.loadSheet(id);
      if (resp && resp.length > 0) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: " No Data Loaded!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong!" });
    }
  },

  saveSheet: async (req, res) => {
    try {
      var resp = await SSO.saveSheet(req.body);
      if (resp > 0) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: " No Data Loaded!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong!" });
    }
  },

  importSheet: async (req, res) => {
    try {
      var resp = await SSO.saveSheet(req.body);
      if (resp > 0) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: " No Data Loaded!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong!" });
    }
  },

  publishSheet: async (req, res) => {
    try {
      const { id, sno } = req.params;
      var resp = await SSO.publishSheet(id, sno);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Sheet not submitted!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong!" });
    }
  },

  certifySheet: async (req, res) => {
    try {
      const { id, sno } = req.params;
      var resp = await SSO.certifySheet(id, sno);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Sheet not published!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong!" });
    }
  },

  uncertifySheet: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.uncertifySheet(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Sheet not unpublished!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong!" });
    }
  },

  loadCourseList: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.loadCourseList(id);
      if (resp && resp.length > 0) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: " No Data Loaded!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong!" });
    }
  },

  // CURRICULUM CONTROLS - AIS

  fetchStruct: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      const unit_id = req.query.role;
      const stream = req.query.stream;

      var session =
        stream && stream != null
          ? await SSO.getActiveSessionById(stream)
          : await SSO.getActiveSessionByMode(1);
      const sem = session && session.academic_sem;

      var sheets = await SSO.fetchStruct(sem, unit_id, page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postStruct: async (req, res) => {
    const { id } = req.body;
    //let dt = {narrative:req.body.narrative,tag:req.body.tag,amount: req.body.amount,currency:req.body.currency,post_type:req.body.post_type,group_code:req.body.group_code}
    if (req.body.major_id == "") req.body.major_id = null;
    if (req.body.prog_id == "") req.body.prog_id = null;
    if (req.body.course_id == "") req.body.course_id = null;
    if (req.body.unit_id == "") req.body.unit_id = null;

    try {
      var resp =
        id <= 0
          ? await SSO.insertAISMeta(req.body)
          : await SSO.updateAISMeta(id, req.body);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteStruct: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteVoucher(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // CALENDAR CONTROLS - AIS

  fetchCalendar: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var sheets = await SSO.fetchCalendar(page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postCalendar: async (req, res) => {
    const { id } = req.body;
    //let dt = {narrative:req.body.narrative,tag:req.body.tag,amount: req.body.amount,currency:req.body.currency,post_type:req.body.post_type,group_code:req.body.group_code}
    if (
      req.body.cal_register_start == "Invalid date" ||
      req.body.cal_register_start == ""
    )
      req.body.cal_register_start = null;
    if (
      req.body.cal_register_end == "Invalid date" ||
      req.body.cal_register_end == ""
    )
      req.body.cal_register_end = null;
    if (
      req.body.cal_lecture_start == "Invalid date" ||
      req.body.cal_lecture_start == ""
    )
      req.body.cal_lecture_start = null;
    if (
      req.body.cal_lecture_end == "Invalid date" ||
      req.body.cal_lecture_end == ""
    )
      req.body.cal_lecture_end = null;
    if (
      req.body.cal_exam_start == "Invalid date" ||
      req.body.cal_exam_start == ""
    )
      req.body.cal_exam_start = null;
    if (req.body.cal_exam_end == "Invalid date" || req.body.cal_exam_end == "")
      req.body.cal_exam_end = null;
    if (
      req.body.cal_entry_start == "Invalid date" ||
      req.body.cal_entry_start == ""
    )
      req.body.cal_entry_start = null;
    if (
      req.body.cal_entry_end == "Invalid date" ||
      req.body.cal_entry_end == ""
    )
      req.body.cal_entry_end = null;
    req.body.mode_id = 1;

    try {
      console.log(req.body);
      var resp =
        id <= 0
          ? await SSO.insertAISCalendar(req.body)
          : await SSO.updateAISCalendar(id, req.body);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteCalendar: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteAISCalendar(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  activateCalendar: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.activateAISCalendar(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  stageSheet: async (req, res) => {
    try {
      const { session_id } = req.body;
      var resp = await SSO.stageSheet(session_id);
      console.log(resp);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  progressLevel: async (req, res) => {
    try {
      const { session_id } = req.body;
      var resp = await SSO.progressLevel(session_id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // STREAMS CONTROLS - AIS

  fetchStreams: async (req, res) => {
    try {
      var resp = await SSO.fetchStreams();
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  fetchSheetStreams: async (req, res) => {
    try {
      var resp = await SSO.fetchSheetStreams();
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  fetchResitStreams: async (req, res) => {
    try {
      var resp = await SSO.getResitSessions();
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // INFORMER CONTROLS - AIS

  fetchInformer: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var sheets = await SSO.fetchInformer(page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postInformer: async (req, res) => {
    const { id } = req.body;
    try {
      var resp =
        id <= 0
          ? await SSO.insertAISInformer(req.body)
          : await SSO.updateAISInformer(id, req.body);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteInformer: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteAISInformer(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // PROGRAM CHANGE CONTROLS - AIS

  fetchProgchange: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var sheets = await SSO.fetchProgchange(page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postProgchange: async (req, res) => {
    const { id } = req.body;
    try {
      var resp =
        id <= 0
          ? await SSO.insertAISProgchange(req.body)
          : await SSO.updateAISProgchange(id, req.body);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteProgchange: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteAISProgchange(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  approveProgchange: async (req, res) => {
    try {
      const { id, sno } = req.params;
      var resp = await SSO.approveAISProgchange(id, sno);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // RESITS - AIS

  fetchResits: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      const stream_main = req.query.stream;

      var stream = new Set();
      var streams = "",
        i = 0;

      var session = await SSO.getActiveResitSession();
      stream_main && stream_main != "null"
        ? stream.add(stream_main)
        : stream.add(session && session.id);

      stream.forEach((m) => {
        streams += m + (i == stream.size - 1 ? "" : ",");
        i++;
      });

      var resits = await SSO.fetchResits(streams, page, keyword);
      if (resits && resits.data.length > 0) {
        res.status(200).json({ success: true, data: resits });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },


  
  fetchResitInfo: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.fetchResitInfo(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  
  postResitScore: async (req, res) => {
    try {
      const { id } = req.body;
      console.log(req.body);
      var resp;
      if (id > 0) {
        resp = await SSO.updateResitScore(id, req.body);
      } 

      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  
  postResitBacklog: async (req, res) => {
    console.log(req.body)
    try {
      var resp = await SSO.saveResitBacklog(req.body);
      console.log(resp)
      if (resp) {
        if(resp == 'dups') res.status(200).json({ success: true, data: null, msg: `Course has multiple records for index number: ${req.body.indexno}` });
        else res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No Initial Assessment for Course!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened !" });
    }
  },

  registerResit: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(req.body);
      var resp = await SSO.registerResit(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  approveResit: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.approveResit(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
         .status(200)
         .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },
  

  // TRANSCRIPT & RESULTS
  
  postTranscript: async (req, res) => {
    console.log(req.body)
    try {
      const { indexno } = req.body
      var resp = await SSO.fetchTranscript(indexno);
      console.log(resp)
      if (resp) {
        res.status(200).json({ success: true, data: resp.data });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No Initial Assessment for Course!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened !" });
    }
  },


  // PROGRAMS - AIS

  fetchPrograms: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var sheets = await SSO.fetchPrograms(page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchProgram: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.fetchProgram(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  postProgram: async (req, res) => {
    const { id } = req.body;
    try {
      var resp =
        id <= 0
          ? await SSO.insertProgram(req.body)
          : await SSO.updateProgram(id, req.body);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteProgram: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteProgram(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // COURSES - AIS

  fetchCourses: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var sheets = await SSO.fetchCourses(page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchCourse: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.fetchCourse(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  postCourse: async (req, res) => {
    const { id } = req.body;
    try {
      var resp =
        id <= 0
          ? await SSO.insertCourse(req.body)
          : await SSO.updateCourse(id, req.body);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteCourse: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteCourse(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


   // SCHEMES - AIS

   fetchSchemes: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var sheets = await SSO.fetchSchemes(page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchScheme: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.fetchScheme(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  postScheme: async (req, res) => {
    const { id } = req.body;
    try {
      var resp =
        id <= 0
          ? await SSO.insertScheme(req.body)
          : await SSO.updateScheme(id, req.body);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteScheme: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteScheme(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },



   // COUNTRIES - AIS

   fetchCountries: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var sheets = await SSO.fetchCountries(page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchCountry: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.fetchCountry(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  postCountry: async (req, res) => {
    const { id } = req.body;
    try {
      var resp =
        id <= 0
          ? await SSO.insertCountry(req.body)
          : await SSO.updateCountry(id, req.body);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteCountry: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteCountry(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },



  // REGIONS - AIS

  fetchRegions: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var sheets = await SSO.fetchRegions(page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchRegion: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.fetchRegion(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  postRegion: async (req, res) => {
    const { id } = req.body;
    try {
      var resp =
        id <= 0
          ? await SSO.insertRegion(req.body)
          : await SSO.updateRegion(id, req.body);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteRegion: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteRegion(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // RELIGIONS - AIS

  fetchReligions: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var sheets = await SSO.fetchReligions(page, keyword);
      if (sheets && sheets.data.length > 0) {
        res.status(200).json({ success: true, data: sheets });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchReligion: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.fetchReligion(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  postReligion: async (req, res) => {
    const { id } = req.body;
    try {
      var resp =
        id <= 0
          ? await SSO.insertReligion(req.body)
          : await SSO.updateReligion(id, req.body);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteReligion: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteReligion(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },






  // BILLS CONTROLS - FMS

  fetchBills: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var bills = await SSO.fetchBills(page, keyword);
      if (bills && bills.data.length > 0) {
        res.status(200).json({ success: true, data: bills });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchBill: async (req, res) => {
    try {
      const bid = req.params.bid;
      var bill = await SSO.fetchBill(bid);
      var items = await SSO.fetchItemsByBid(bid);

      if (bill && bill.length > 0) {
        res.status(200).json({ success: true, data: { data: bill[0], items } });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchBillReceivers: async (req, res) => {
    try {
      const bid = req.params.bid;
      var receivers = await SSO.fetchBillReceivers(bid);

      if (receivers && receivers.length > 0) {
        res.status(200).json({ success: true, data: receivers });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postBill: async (req, res) => {
    const { bid } = req.body;
    let dt = {
      narrative: req.body.narrative,
      tag: req.body.tag,
      amount: req.body.amount,
      currency: req.body.currency,
      post_type: req.body.post_type,
      group_code: req.body.group_code,
      discount_code: req.body.discount_code,
      post_status: req.body.post_status,
      session_id: req.body.session_id,
      discount: req.body.discount,
      bankacc_id: req.body.bankacc_id,
    };
    if (req.body.prog_id != "") dt.prog_id = req.body.prog_id;
    if (req.body.discount == "" || req.body.discount == 0) delete dt.discount;
    if (req.body.discount_code == "") delete dt.discount_code;
    if (req.body.group_code == "") dt.group_code = '0000';
    console.log(dt);

    try {
      var resp =
        bid <= 0 ? await SSO.insertBill(dt) : await SSO.updateBill(bid, dt);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  revokeBill: async (req, res) => {
    try {
      const { id, refno } = req.body;
      console.log(refno);
      const resp = await SSO.revokeBill(id, refno);
      if (resp) {
        await SSO.updateBill(id, { post_status: 0 });
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Bill not revoked!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  attachBill: async (req, res) => {
    try {
      const { id, refno } = req.body;
      const resp = await SSO.attachBill(id, refno);
      if (resp) {
        await SSO.updateBill(id, { post_status: 0 });
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Bill not revoked!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteBill: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteBill(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  sendBill: async (req, res) => {
    try {
      const { id } = req.body;
      var bl = await SSO.fetchBill(id);
      var b = bl[0];
      const sem = getSemestersByCode(b.group_code);
      const dsem = getSemestersByCode(b.discount_code);
      const sess = await SSO.getActiveSessionByMode(1);
      var count;
      if (b.post_status == 0) {
        if (b.post_type == "GH") {
          count = await SSO.sendStudentBillGh(
            b.bid,
            b.narrative,
            b.amount,
            b.prog_id,
            sem,
            sess?.id,
            b.discount,
            dsem,
            b.currency
          );
        } else if (b.post_type == "INT") {
          count = await SSO.sendStudentBillInt(
            b.bid,
            b.narrative,
            b.amount,
            b.prog_id,
            sem,
            sess?.id,
            b.discount,
            dsem,
            b.currency
          );
        }
      }
      if (count) {
        const su = await SSO.updateBill(b.bid,{post_status:1})
        //console.log(su)
        res.status(200).json({ success: true, data: count });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Bill not posted" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  // BILL ITEMS CONTROLS - FMS

  fetchBillItems: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var bills = await SSO.fetchBillItems(page, keyword);
      if (bills && bills.data.length > 0) {
        res.status(200).json({ success: true, data: bills });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchBillItem: async (req, res) => {
    try {
      const bid = req.params.bid;
      var bill = await SSO.fetchBill(bid);
      var items = await SSO.fetchItemsByBid(bid);

      if (bill && bill.length > 0) {
        res.status(200).json({ success: true, data: { data: bill[0], items } });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postBillItem: async (req, res) => {
    const { id } = req.body;
    let dt = {
      narrative: req.body.narrative,
      tag: req.body.tag,
      amount: req.body.amount,
      currency: req.body.currency,
      status: req.body.status,
      type: req.body.type,
      session_id: req.body.session_id,
    };
    try {
      var resp =
        id <= 0
          ? await SSO.insertBillItem(dt)
          : await SSO.updateBillItem(id, dt);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  addToBill: async (req, res) => {
    try {
      const { id, bid } = req.body;
      const bill = await SSO.fetchBill(bid);
      if (bill) {
        const resp = await SSO.addToBill(id, bid);
        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res.status(200).json({
            success: false,
            data: null,
            msg: "Item attachement failed!",
          });
        }
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Bill does not exist!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteBillItem: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteBill(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  invokeBillItem: async (req, res) => {
    try {
      const { id } = req.body;
      var bl = await SSO.fetchBill(id);
      var b = bl[0];
      const sem = getSemestersByCode(b.group_code);
      const sess = await SSO.getActiveSessionByMode(1);
      var count;
      if (b.post_status == 0) {
        if (b.post_type == "GH") {
          count = await SSO.sendStudentBillGh(
            b.bid,
            b.narrative,
            b.amount,
            b.prog_id,
            sem,
            sess
          );
        } else if (b.post_type == "INT") {
          count = await SSO.sendStudentBillInt(
            b.bid,
            b.narrative,
            b.amount,
            sem,
            sess
          );
        }
      }
      if (count) {
        //const su = await SSO.updateBill(b.bid,{post_status:1})
        //console.log(su)
        res.status(200).json({ success: true, data: count });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Bill not posted" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  // FEE PAYMENTS CONTROLS - FMS

  fetchPayments: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var payments = await SSO.fetchPayments(page, keyword);
      if (payments && payments.data.length > 0) {
        res.status(200).json({ success: true, data: payments });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchOtherPayments: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var payments = await SSO.fetchOtherPayments(page, keyword);
      if (payments && payments.data.length > 0) {
        res.status(200).json({ success: true, data: payments });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchVoucherSales: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var payments = await SSO.fetchVoucherSales(page, keyword);
      if (payments && payments.data.length > 0) {
        res.status(200).json({ success: true, data: payments });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchPayment: async (req, res) => {
    try {
      const id = req.params.id;
      var payment = await SSO.fetchPayment(id);

      if (payment && payment.length > 0) {
        res.status(200).json({ success: true, data: payment });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  movePaymentToFees: async (req, res) => {
    try {
      const id = req.params.id;
      var ps = await SSO.fetchPayment(id);
      var resp;
      if (ps && [4, 3].includes(ps[0].transtype_id)) {
        resp = await SSO.moveToFees(
          id,
          -1 * ps[0].amount,
          ps[0].refno,
          ps[0].transtag
        );
      }
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postPayment: async (req, res) => {
    const { id, refno } = req.body;

    try {
      const verifyRef = await Student.fetchStProfile(refno);

      if (verifyRef && verifyRef.length > 0) {
        var tid, resp;
        let dt = {
          refno: verifyRef[0].refno,
          transdate: req.body.transdate,
          transtag: req.body.transtag ? req.body.transtag : "AUCC_FIN",
          amount: req.body.amount,
          currency: req.body.currency,
          paytype: req.body.paytype,
          feetype: req.body.feetype,
          collector_id: 2,
          transtype_id: 2,
          reference: req.body.reference,
          bankacc_id: req.body.bankacc_id,
        };
        if (id <= 0) {
          resp = await SSO.insertPayment(dt);
          tid = resp && resp.insertId;
        } else {
          resp = await SSO.updatePayment(id, dt);
          tid = id;
        }
        if (resp) {
          // Update or Insert into Student Account
          const qt = await SSO.updateStudFinance(
            tid,
            refno,
            -1 * parseInt(req.body.amount),
            req.body.transtag ? req.body.transtag : "AUCC_FIN"
          );
          // Check for Quota & Generate Indexno
          //const rt = await SSO.verifyFeesQuota(refno)
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "Action Failed" });
        }
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Student Doesn't Exist" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something Wrong Happened" });
    }
  },

  deletePayment: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deletePayment(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  sendPayment: async (req, res) => {
    try {
      const { id } = req.body;
      var bl = await SSO.fetchBill(id);
      var b = bl[0];
      const sem = getSemestersByCode(b.group_code);
      var count;
      if (b.post_status == 0) {
        if (b.post_type == "GH") {
          count = await SSO.sendStudentBillGh(
            b.bid,
            b.narrative,
            b.amount,
            b.prog_id,
            sem
          );
        } else if (b.post_type == "INT") {
          count = await SSO.sendStudentBillInt(
            b.bid,
            b.narrative,
            b.amount,
            sem
          );
        }
      }
      if (count) {
        const su = await SSO.updateBill(b.bid, { post_status: 1 });
        console.log(su);
        res.status(200).json({ success: true, data: count });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Bill not posted" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  generateIndexNo: async (req, res) => {
    try {
      const refno = req.body.refno;
      var resp = await Student.fetchStProfile(refno);
      if (
        resp &&
        resp.length > 0 &&
        (resp[0].indexno == "UNIQUE" || resp[0].indexno == null)
      ) {
        var indexNo = await SSO.generateIndexNo(refno);
        var ups;
        var email;
        if (!resp[0].institute_email) {
          const username = getUsername(resp[0].fname, resp[0].lname);
          email = `${username}@st.aucc.edu.gh`;
          if (resp && resp.length <= 0) {
            const isExist = await Student.findEmail(email);
            if (isExist && isExist.length > 0) {
              email = `${username}${isExist.length + 1}@st.aucc.edu.gh`;
              ups = await Student.updateStudentProfile(refno, {
                institute_email: email,
              });
            } else {
              ups = await Student.updateStudentProfile(refno, {
                institute_email: email,
              });
            }
          }
        } else {
          email = resp[0].institute_email;
        }

        if (indexNo && email) {
          res
            .status(200)
            .json({ success: true, data: { indexno: indexNo, email } });
        } else if (indexNo && !email) {
          res.status(200).json({ success: true, data: { indexno: indexNo } });
        } else if (!indexNo && email) {
          res.status(200).json({
            success: false,
            data: null,
            msg: "Index number generation failed!",
          });
        } else {
          res.status(200).json({
            success: false,
            data: null,
            msg: "No email record and index number generated!",
          });
        }
      } else if (
        resp &&
        resp.length > 0 &&
        resp[0].indexno != null &&
        resp[0].indexno != "UNIQUE"
      ) {
        res.status(200).json({
          success: false,
          data: null,
          msg: "Index number already exists!",
        });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Student does not exist!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },


  // Charges - FMS

  fetchCharges: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var charges = await SSO.fetchCharges(page, keyword);
      if (charges && charges.data.length > 0) {
        res.status(200).json({ success: true, data: charges });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  fetchCharge: async (req, res) => {
    try {
      const id = req.params.id;
      var charge = await SSO.fetchCharge(id);

      if (charge && charge.length > 0) {
        res.status(200).json({ success: true, data: charge });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  postCharge: async (req, res) => {
    const { id, refno } = req.body;

    try {
      const verifyRef = await Student.fetchStProfile(refno);

      if (verifyRef && verifyRef.length > 0) {
        var tid, resp;
        let dt = {
          refno: verifyRef[0].refno,
          amount: req.body.amount,
          type: req.body.type,
          name: req.body.name,
        };
        
        if (id <= 0) {
          dt.created_at = new Date()
          resp = await SSO.insertCharge(dt);
          tid = resp && resp.insertId;
        } else {
          resp = await SSO.updateCharge(id, dt);
          tid = id;
        }

        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "Action Failed" });
        }
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Student Doesn't Exist" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something Wrong Happened" });
    }
  },

  publishCharge: async (req, res) => {
    const { id } = req.params;

    try {
      const cs = await SSO.fetchCharge(id);
      console.log(cs)
      if (cs && cs.length > 0) {
       const dt = cs[0]
        
        if (!dt.post_status) {
          // Update Charges Post Status to Published (1)
          const ct = await SSO.updateCharge(id, { post_status: 1 });
          if(ct){
            // Update or Insert into Student Account
            const qt = await SSO.updateStudCharge(
              dt.id,
              dt.refno,
              parseInt(dt.amount),
              dt.name,
            );
            res.status(200).json({ success: true, data: ct });
          }
          
        } else {
          res
            .status(200)
            .json({ success: true, data: null, msg: "Charge Already published" });
        }
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Charge Not Found!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something Wrong Happened" });
    }
  },

  deleteCharge: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteCharge(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // Service Costs - FMS

  fetchServices: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var charges = await SSO.fetchServices(page, keyword);
      if (charges && charges.data.length > 0) {
        res.status(200).json({ success: true, data: charges });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  fetchService: async (req, res) => {
    try {
      const id = req.params.id;
      var charge = await SSO.fetchService(id);

      if (charge && charge.length > 0) {
        res.status(200).json({ success: true, data: charge });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  postService: async (req, res) => {
    const { id } = req.body;

    try {
        var resp;
        let dt = {
          transtype_id: req.body.transtype_id,
          amount_ghc: req.body.amount_ghc,
          amount_usd: req.body.amount_usd,
        };
        
        if (id <= 0) {
          dt.created_at = new Date()
          resp = await SSO.insertService(dt);
        } else {
          resp = await SSO.updateService(id, dt);
        }

        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "Action Failed" });
        }
     
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something Wrong Happened" });
    }
  },

  deleteService: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteService(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  loadAllServices: async (req, res) => {
    try {
      var charge = await SSO.loadAllServices();

      if (charge && charge.length > 0) {
        res.status(200).json({ success: true, data: charge });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },
  


  // Voucher Costs - FMS

  fetchVcosts: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var charges = await SSO.fetchVcosts(page, keyword);
      if (charges && charges.data.length > 0) {
        res.status(200).json({ success: true, data: charges });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  fetchVcost: async (req, res) => {
    try {
      const id = req.params.id;
      var charge = await SSO.fetchVcost(id);

      if (charge && charge.length > 0) {
        res.status(200).json({ success: true, data: charge });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  postVcost: async (req, res) => {
    const { id } = req.body;

    try {
        var resp;
        let dt = {
          title: req.body.title,
          amount: req.body.amount,
          group_id: req.body.group_id,
          sell_type: req.body.sell_type,
          currency: req.body.currency,
        };
        
        if (id <= 0) {
          dt.created_at = new Date()
          resp = await SSO.insertVcost(dt);
        } else {
          resp = await SSO.updateVcost(id, dt);
        }

        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "Action Failed" });
        }
     
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something Wrong Happened" });
    }
  },

  deleteVcost: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteVcost(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },



  // Debtors - FMS

  fetchDebtors: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;

      var students = await SSO.fetchDebtors(page, keyword);
      if (students && students.data.length > 0) {
        res.status(200).json({ success: true, data: students });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postDebtorsReportFMS: async (req, res) => {
    try {
      var resp = await SSO.fetchFMSDebtorsReport(req.body);
      console.log(resp);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No Data found!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  postFinanceReport: async (req, res) => {
    try {
      const {
        type,
        startdate,
        endate,
        prog_id,
        major_id,
        year_group,
        session,
      } = req.body;
      var resp;
      if (type == "fees") {
        resp = await SSO.finReportFees(startdate, endate);
      } else if (type == "others") {
        resp = await SSO.finReportOthers(startdate, endate);
      } else if (type == "voucher") {
        resp = await SSO.finReportVouchs(startdate, endate);
      } else if (type == "advance") {
        resp = await SSO.finReportAdvance();
      } else if (type == "admitted") {
        resp = await SSO.finReportAdmitted();
      } else if (type == "eligible") {
        resp = await SSO.finReportEligible({
          session,
          prog_id,
          major_id,
          year_group,
        });
      }

      console.log(resp);
      if (resp) {
        res.status(200).json({ success: true, ...resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No Data found!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },


  // Account Reconciliation By Refno - FMS
  retireAccountByRefno: async (req, res) => {
    try {
      const refno = req.params.refno;
      var data = await SSO.retireStudentAccountByRefno(refno);
      console.log("Data",data)
      if (data) {
        res.status(200).json({ success: true, data });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No record!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  // Account Reconciliation - FMS
  retireAccount: async (req, res) => {
    try {
      var data = await SSO.retireStudentAccount();
      console.log("Data",data)
      if (data) {
        res.status(200).json({ success: true, data });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No record!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },
  // HRStaff  - HRS

  fetchHRStaffDataHRS: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;

      var staff = await SSO.fetchHRStaff(page, keyword);

      if (staff && staff.data.length > 0) {
        res.status(200).json({ success: true, data: staff });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchActiveStListHRS: async (req, res) => {
    try {
      var sts = await SSO.fetchActiveStListHRS();
      if (sts && sts.length > 0) {
        res.status(200).json({ success: true, data: sts });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  fetchHRStaffHRS: async (req, res) => {
    try {
      const { sno } = req.params;
      var staff = await SSO.fetchStaffProfile(sno);
      if (staff && staff.length > 0) {
        res.status(200).json({ success: true, data: staff[0] });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  updateHRSUnitHead: async (req, res) => {
    try {
      const { id, sno } = req.params;
      var resp = await SSO.updateHRSUnitHead(id, sno);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postHRStaffDataHRS: async (req, res) => {
    const { id } = req.body;
    //let dt = {narrative:req.body.narrative,tag:req.body.tag,amount: req.body.amount,currency:req.body.currency,post_type:req.body.post_type,group_code:req.body.group_code}
    if (req.body.unit_id == "") delete req.body.unit_id;
    if (req.body.job_id == "") delete req.body.job_id;
    if (req.body.mstatus == "") delete req.body.mstatus;
    if (req.body.region_id == "") delete req.body.region_id;
    if (req.body.email == "") delete req.body.email;
    if (req.body.dob == "") {
      delete req.body.dob;
    } else {
      req.body.dob = moment(req.body.dob).format("YYYY-MM-DD");
    }
    delete req.body.uid;
    delete req.body.flag_locked;
    delete req.body.flag_disabled;
    delete req.body.unit_name;
    delete req.body.designation;
    delete req.body.name;
    delete req.body.first_appoint;
    delete req.body.pnit_id;
    delete req.body.scale_id;
    delete req.body.updated_at;
    delete req.body.created_at;
    console.log(req.body);
    try {
      var resp;
      if (id <= 0) {
        const sno = await SSO.getNewStaffNo();
        req.body.staff_no = sno;
        resp = await SSO.insertHRStaff(req.body);
      } else {
        resp = await SSO.updateHRStaff(id, req.body);
      }
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteHRStaffDataHRS: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteHRStaff(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  resetAccountHRS: async (req, res) => {
    try {
      const { staff_no } = req.params;
      const pwd = nanoid();
      var resp = await SSO.fetchStaffProfile(staff_no);
      const ups = await SSO.updateUserByEmail(resp[0].inst_mail, {
        password: sha1(pwd),
      });
      const msg = `Hi, your username: ${resp[0].inst_mail} password: ${pwd} .Goto https://portal.aucc.edu.gh to access AUCC Portal!`;
      const sm = sms(resp[0].phone, msg);
      if (ups) {
        res.status(200).json({ success: true, data: msg });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  stageAccountHRS: async (req, res) => {
    try {
      const { staff_no } = req.params;
      const pwd = nanoid();
      var resp = await SSO.fetchStaffProfile(staff_no);
      console.log(resp);
      if (resp && resp.length > 0) {
        if (resp[0].inst_mail && resp[0].phone) {
          const ups = await SSO.insertSSOUser({
            username: resp[0].inst_mail,
            password: sha1(pwd),
            group_id: 2,
            tag: staff_no,
          });
          if (ups) {
            const role = await SSO.insertSSORole({
              uid: ups.insertId,
              arole_id: 11,
            }); // Unit Staff Role
            const pic = await SSO.insertPhoto(
              ups.insertId,
              staff_no,
              2,
              "./public/cdn/photo/none.png"
            ); // Initial Photo
            const msg = `Hi, your username: ${resp[0].inst_mail} password: ${pwd} .Goto https://portal.aucc.edu.gh to access AUCC Portal!`;
            const sm = sms(resp[0].phone, msg);
            res.status(200).json({ success: true, data: msg });
          } else {
            res
              .status(200)
              .json({ success: false, data: null, msg: "Action failed!" });
          }
        } else {
          res.status(200).json({
            success: false,
            data: null,
            msg: "Please update Phone or Email!",
          });
        }
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  generateMailHRS: async (req, res) => {
    try {
      const { staff_no } = req.params;
      var resp = await SSO.fetchStaffProfile(staff_no);
      var ups;
      var email;

      if (resp && resp.length > 0) {
        const username = getUsername(resp[0].fname, resp[0].lname);
        email = `${username}@aucc.edu.gh`;
        const isExist = await SSO.findEmail(email);
        if (isExist && isExist.length > 0)
          email = `${username}${isExist.length + 1}@aucc.edu.gh`;
        ups = await SSO.updateStaffProfile(staff_no, { inst_mail: email });
      }

      if (ups) {
        res.status(200).json({ success: true, data: email });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  upgradeRole: async (req, res) => {
    try {
      const { uid, role } = req.params;
      const pwd = nanoid();
      var resp = await SSO.fetchUser(uid, "02");
      if (resp && resp.length > 0) {
        if (resp[0].phone) {
          const roles = await SSO.insertSSORole({ uid, arole_id: role }); // Unit Staff Role
          const msg = `Hi ${resp.lname}! Your privilege on AUCC EduHub has been upgraded. Goto https://portal.aucc.edu.gh to access portal!`;
          if (roles) {
            const send = await sms(resp[0].phone, msg);
            console.log(send);
          }
          res.status(200).json({ success: true, data: roles });
        } else {
          res.status(200).json({
            success: false,
            data: null,
            msg: "Please update contact details!",
          });
        }
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "User not found!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  revokeRole: async (req, res) => {
    try {
      const { uid, role } = req.params;
      const pwd = nanoid();
      console.log(uid, role);
      var resp = await SSO.fetchUser(uid, "02");
      if (resp && resp.length > 0) {
        if (resp[0].phone) {
          const roles = await SSO.deleteSSORole(uid, role);
          const msg = `Hi ${resp.lname}! A privilege on AUCC EduHub has been revoked. Goto https://portal.aucc.edu.gh to access portal!`;
          if (roles) {
            const send = await sms(resp[0].phone, msg);
            console.log(send);
          }
          res.status(200).json({ success: true, data: roles });
        } else {
          res.status(200).json({
            success: false,
            data: null,
            msg: "Please update contact details!",
          });
        }
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "User not found!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // HRStaff  - HRS

  fetchHRUnitDataHRS: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var staff = await SSO.fetchHRUnit(page, keyword);
      if (staff && staff.data.length > 0) {
        res.status(200).json({ success: true, data: staff });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postHRUnitDataHRS: async (req, res) => {
    const { id } = req.body;
    if (req.body.lev1_id == "") req.body.lev1_id = null;
    if (req.body.lev2_id == "") req.body.lev2_id = null;
    if (req.body.lev3_id == "") req.body.lev3_id = null;
    if (req.body.head == "") req.body.head = null;
    delete req.body.head_name;
    delete req.body.head_no;
    delete req.body.parent;
    delete req.body.school;
    delete req.body.subhead;
    console.log(req.body);
    try {
      var resp;
      if (id <= 0) {
        resp = await SSO.insertHRUnit(req.body);
      } else {
        resp = await SSO.updateHRUnit(id, req.body);
      }
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteHRUnitDataHRS: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteHRStaff(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // HRJOB  - HRS
  fetchHRJobData: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var jobs = await SSO.fetchHRJob(page, keyword);
      console.log(jobs);
      if (jobs && jobs.data.length > 0) {
        res.status(200).json({ success: true, data: jobs });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  postHRJobData: async (req, res) => {
    const { id } = req.body;
    //if(req.body.lev1_id == '') req.body.lev1_id = null
    //delete req.body.subhead;
    console.log(req.body);
    try {
      var resp;
      if (id <= 0) {
        resp = await SSO.insertHRJob(req.body);
      } else {
        resp = await SSO.updateHRJob(id, req.body);
      }
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  deleteHRJobData: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteHRJob(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // EVS ROUTES */

  fetchEvsData: async (req, res) => {
    try {
      const { id, tag } = req.params;
      var resp = await SSO.fetchEvsData(id, tag);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  postEvsData: async (req, res) => {
    console.log(req.body);
    try {
      var resp = await SSO.postEvsData(req.body);
      res.status(200).json(resp);
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  fetchEvsMonitor: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.fetchEvsMonitor(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  fetchEvsUpdate: async (req, res) => {
    try {
      const { tag } = req.params;
      var resp = await SSO.fetchEvsRoles(tag); // EVS Roles
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  fetchEvsReceipt: async (req, res) => {
    try {
      const { id, tag } = req.params;
      var resp = await SSO.fetchEvsReceipt(id, tag);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  fetchEvsRegister: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.fetchEvsRegister(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  updateEvsControl: async (req, res) => {
    try {
      const { id, data } = req.body;
      var resp = await SSO.updateEvsControl(id, data);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  removeVoter: async (req, res) => {
    try {
      const { id, tag } = req.params;
      var resp = await SSO.removeVoter(id, tag);
      console.log(resp);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Elector voted already !" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  addVoter: async (req, res) => {
    try {
      const { id, tag } = req.body;
      var resp = await SSO.addVoter(id, tag);
      console.log(resp);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Elector exist already !" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  removePortfolio: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.removePortfolio(id);
      console.log(resp);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed !" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  savePortfolio: async (req, res) => {
    try {
      const { id } = req.body;
      console.log(req.body);
      var resp;
      if (id <= 0) {
        resp = await SSO.insertPortfolio(req.body);
      } else {
        resp = await SSO.updatePortfolio(id, req.body);
      }
      console.log(resp);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // SSO - Identity ROUTES */

  fetchSSOIdentity: async (req, res) => {
    try {
      const { search } = req.query;
      var resp = await SSO.fetchSSOIdentity(req, search);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  postEvsData: async (req, res) => {
    try {
      var resp = await SSO.postEvsData(req.body);
      res.status(200).json(resp);
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  fetchEvsMonitor: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.fetchEvsMonitor(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // SSO 

  // User Groups - SSO

  fetchGroups: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var charges = await SSO.fetchGroups(page, keyword);
      if (charges && charges.data.length > 0) {
        res.status(200).json({ success: true, data: charges });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  fetchGroup: async (req, res) => {
    try {
      const id = req.params.id;
      var charge = await SSO.fetchGroup(id);

      if (charge && charge.length > 0) {
        res.status(200).json({ success: true, data: charge });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  postGroup: async (req, res) => {
    const { group_id:id } = req.body;
    try {
        var resp;
        if (id <= 0) {
          resp = await SSO.insertGroup(req.body);
        } else {
          resp = await SSO.updateGroup(id, req.body);
        }

        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "Action Failed" });
        }
     
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something Wrong Happened" });
    }
  },

  deleteGroup: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteGroup(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // User Roles - SSO

  fetchUserRoles: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var charges = await SSO.fetchUserRoles(page, keyword);
      if (charges && charges.data.length > 0) {
        res.status(200).json({ success: true, data: charges });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  fetchUserRole: async (req, res) => {
    try {
      const id = req.params.id;
      var charge = await SSO.fetchUserRole(id);

      if (charge && charge.length > 0) {
        res.status(200).json({ success: true, data: charge });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  postUserRole: async (req, res) => {
    const { urole_id:id } = req.body;
    try {
        var resp;
        if (id <= 0) {
          resp = await SSO.insertUserRole(req.body);
        } else {
          resp = await SSO.updateUserRole(id, req.body);
        }

        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "Action Failed" });
        }
     
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something Wrong Happened" });
    }
  },

  deleteUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteUserRole(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // Active Apps - SSO

  fetchApps: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var charges = await SSO.fetchApps(page, keyword);
      if (charges && charges.data.length > 0) {
        res.status(200).json({ success: true, data: charges });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  fetchApp: async (req, res) => {
    try {
      const id = req.params.id;
      var charge = await SSO.fetchApp(id);

      if (charge && charge.length > 0) {
        res.status(200).json({ success: true, data: charge });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  postApp: async (req, res) => {
    const { app_id:id } = req.body;
    try {
        var resp;
        if (id <= 0) {
          resp = await SSO.insertApp(req.body);
        } else {
          resp = await SSO.updateApp(id, req.body);
        }

        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "Action Failed" });
        }
     
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something Wrong Happened" });
    }
  },

  deleteApp: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteApp(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // App Roles - SSO

  fetchAppRoles: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var charges = await SSO.fetchAppRoles(page, keyword);
      if (charges && charges.data.length > 0) {
        res.status(200).json({ success: true, data: charges });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  fetchAppRole: async (req, res) => {
    try {
      const id = req.params.id;
      var charge = await SSO.fetchAppRole(id);

      if (charge && charge.length > 0) {
        res.status(200).json({ success: true, data: charge });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  postAppRole: async (req, res) => {
    const { arole_id:id } = req.body;
    try {
        var resp;
        if (id <= 0) {
          resp = await SSO.insertAppRole(req.body);
        } else {
          resp = await SSO.updateAppRole(id, req.body);
        }

        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "Action Failed" });
        }
     
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something Wrong Happened" });
    }
  },

  deleteAppRole: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteAppRole(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },


  // User Accounts - SSO

  fetchUserAccounts: async (req, res) => {
    try {
      const page = req.query.page;
      const keyword = req.query.keyword;
      var charges = await SSO.fetchUserAccounts(page, keyword);
      if (charges && charges.data.length > 0) {
        res.status(200).json({ success: true, data: charges });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  fetchUserAccount: async (req, res) => {
    try {
      const id = req.params.id;
      var charge = await SSO.fetchUserAccount(id);

      if (charge && charge.length > 0) {
        res.status(200).json({ success: true, data: charge });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "No records!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something went wrong !" });
    }
  },

  
  postUserAccount: async (req, res) => {
    const { uid:id } = req.body;
    try {
        var resp;
        if (id <= 0) {
          resp = await SSO.insertUserAccount(req.body);
        } else {
          resp = await SSO.updateUserAccount(id, req.body);
        }

        if (resp) {
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(200)
            .json({ success: false, data: null, msg: "Action Failed" });
        }
     
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something Wrong Happened" });
    }
  },

  deleteUserAccount: async (req, res) => {
    try {
      const { id } = req.params;
      var resp = await SSO.deleteUserAccount(id);
      if (resp) {
        res.status(200).json({ success: true, data: resp });
      } else {
        res
          .status(200)
          .json({ success: false, data: null, msg: "Action failed!" });
      }
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong !" });
    }
  },

  // HELPERS

  fetchFMShelpers: async (req, res) => {
    try {
      const hp = await SSO.fetchFMShelpers();
      res.status(200).json({ success: true, data: hp });
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  fetchAIShelpers: async (req, res) => {
    try {
      const hp = await SSO.fetchAIShelpers();
      res.status(200).json({ success: true, data: hp });
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  fetchHRShelpers: async (req, res) => {
    try {
      const hp = await SSO.fetchHRShelpers();
      res.status(200).json({ success: true, data: hp });
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  fetchAMShelpers: async (req, res) => {
    try {
      const hp = await SSO.fetchAMShelpers();
      res.status(200).json({ success: true, data: hp });
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },

  fetchSSOhelpers: async (req, res) => {
    try {
      const hp = await SSO.fetchSSOhelpers();
      res.status(200).json({ success: true, data: hp });
    } catch (e) {
      console.log(e);
      res
        .status(200)
        .json({ success: false, data: null, msg: "Something wrong happened!" });
    }
  },
};
