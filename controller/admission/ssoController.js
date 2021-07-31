var bcrypt = require('bcrypt');
var moment = require('moment');
var jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { customAlphabet } = require('nanoid')
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwzyx', 8)

const { SSO } = require('../../model/mysql/ssoModel');

module.exports = {
 
  authenticateUser : async (req,res) => {
      const { username,password } = req.body;
      try{
            var user = await SSO.verifyUser({username,password});
            if(user && user.length > 0){
                var roles = await SSO.fetchRoles(user[0].uid); // Roles
                var photo = await SSO.fetchPhoto(user[0].uid,); // Photo
                var userdata = await SSO.fetchUser(user[0].uid,user[0].group_id); // UserData
                var data = { roles, photo:`${req.protocol}://${req.get('host')}/api/photos/?tag=${photo[0].tag}`, user:userdata[0] };
                // Generate Session Token 
                const token = jwt.sign({ data:user }, 'secret', { expiresIn: 60 * 60 });
                data.token = token;
                res.status(200).json({success:true, data});

            }else{
                res.status(200).json({success:false, data: null, msg:"Invalid username or password!"});
            }
      }catch(e){
          console.log(e)
          res.status(200).json({success:false, data: null, msg: "System error detected."});
      }
  },

  
  fetchPhoto : async (req,res) => {
      const uid = req.query.tag;
      var pic = await SSO.fetchPhoto(uid); // Photo
      if(pic.length > 0){
          var filepath = path.join(__dirname,'/../../', pic[0].path);
          try{
            var stats = fs.statSync(filepath);
            console.log(stats);
            if(stats){
              res.status(200).sendFile(path.join(__dirname,'/../../', pic[0].path));
            }else{
              res.status(200).sendFile(path.join(__dirname, '/../../public/cdn/photo', 'none.png'));
            } 
          }catch(e){
             console.log(e);
             res.status(200).sendFile(path.join(__dirname, '/../../public/cdn/photo', 'none.png'));
          }
      }else{
          res.status(200).sendFile(path.join(__dirname, '/../../public/cdn/photo', 'none.png'));
      }
  },

  // APPLICATION MODULES

  /* AMS Module Logics */

  
  // SESSION CONTROLS

  fetchSessions : async (req,res) => {
    try{
        var sessions = await SSO.fetchSessions();
        if(sessions && sessions.length > 0){
            res.status(200).json({success:true, data:sessions});
        }else{
            res.status(200).json({success:false, data: null, msg:"No records!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong error !"});
    }
  },


  postSession : async (req,res) => {
    console.log(req.body);
      try{
        const { session_id } = req.body;
        var resp
        if(session_id > 0){ // Updates
          resp = await SSO.updateSession(session_id,req.body);
        }else{ // Insert
          resp = await SSO.insertSession(req.body);
        }

        if(resp){
          res.status(200).json({success:true, data:resp});
        }else{
          res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
      }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong happened!"});
      }
  },

  deleteSession : async (req,res) => {
    try{
        const { id } = req.params;
        var resp = await SSO.deleteSession(id);
        if(resp){
            res.status(200).json({success:true, data:resp});
        }else{
            res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong !"});
    }
  },

  setDefaultSession : async (req,res) => {
     try{
        const { id } = req.params;
        var resp = await SSO.setDefaultSession(id);
        if(resp){
            res.status(200).json({success:true, data:resp});
        }else{
            res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
     }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong !"});
     }
  },



  // VENDOR CONTROLS

  fetchVendors : async (req,res) => {
    try{
        var vendors = await SSO.fetchVendors();
        if(vendors && vendors.length > 0){
            res.status(200).json({success:true, data:vendors});
        }else{
            res.status(200).json({success:false, data: null, msg:"No records!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong !"});
    }
  },


  postVendor : async (req,res) => {
    console.log(req.body);
      try{
        const { vendor_id } = req.body;
        var resp
        if(vendor_id > 0){ // Updates
          resp = await SSO.updateVendor(vendor_id,req.body);
        }else{ // Insert
          resp = await SSO.insertVendor(req.body);
        }

        if(resp){
          res.status(200).json({success:true, data:resp});
        }else{
          res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
      }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong happened!"});
      }
  },

  deleteVendor : async (req,res) => {
    try{
        const { id } = req.params;
        var resp = await SSO.deleteVendor(id);
        if(resp){
            res.status(200).json({success:true, data:resp});
        }else{
            res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong !"});
    }
  },


  // VOUCHER CONTROLS

  fetchVouchers : async (req,res) => {
    try{
        const id = req.params.id;
        const sell_type = req.query.sell_type;
        if(sell_type){
          var vouchers = await SSO.fetchVouchersByType(id,sell_type);
        }else{
          var vouchers = await SSO.fetchVouchers(id);
        }
       
        if(vouchers && vouchers.length > 0){
            res.status(200).json({success:true, data:vouchers});
        }else{
            res.status(200).json({success:false, data: null, msg:"No records!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something went wrong !"});
    }
  },


  postVoucher : async (req,res) => {
      try{
        const { session_id,quantity,group_id,sell_type,vendor_id,created_by } = req.body;
        var resp
        if(session_id && session_id > 0){ 
          var lastIndex = await SSO.getLastVoucherIndex(session_id)
          if(quantity > 0){
            for(var i = 1; i <= quantity; i++){
              let dt = { serial: lastIndex+i, pin: nanoid(),session_id,group_id,sell_type,vendor_id,created_by}
              resp = await SSO.insertVoucher(dt);
            }
          }
        }

        if(resp){
          res.status(200).json({success:true, data:resp});
        }else{
          res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
      }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong happened!"});
      }
  },

  deleteVoucher : async (req,res) => {
    try{
        const { id } = req.params;
        var resp = await SSO.deleteVoucher(id);
        if(resp){
            res.status(200).json({success:true, data:resp});
        }else{
            res.status(200).json({success:false, data: null, msg:"Action failed!"});
        }
    }catch(e){
        console.log(e)
        res.status(200).json({success:false, data: null, msg: "Something wrong !"});
    }
  },

  


   

}

