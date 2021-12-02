var bcrypt = require('bcrypt');
var moment = require('moment');


module.exports = {

    // Fetch vouchers 
    fetchVouchers : async (req,res) => {
        try{
            var vouch = await Voucher.find().lean();
            if(vouch){
               res.status(200).json({success:true, data: vouch});
            }else{
                res.status(202).json({success:false, data: null, msg:"Something wrong happend!"});
            }
        }catch(e){
            res.status(403).json({success:false, data: null, msg: e});
        }
    },

    // Generate voucher
    genVouchers : async (req,res) => {
        try{
            const quantity = req.query.quantity || 5;
            const session = req.query.session || null;
            const group = req.query.group || 'UG';
            const pin = moment().unix()+Math.ceil(Math.random()*10);
            const serial = moment().unix() * Math.ceil(Math.random()*10);
            var data = [];
            for(var i = 0; i < quantity; i++){
                const pinx = (pin+i).toString().substring(2);
                const serialx = group+((serial+i)).toString().substring(4);
                data.push({session,serial:serialx,pin:pinx,status:1})
            }
            console.log(data);
            var vouch = await Voucher.create(data);
            if(vouch){
               console.log(vouch);
                res.status(200).json({success:true, data: vouch});
            }else{
                res.status(202).json({success:false, data: null, msg:"No voucher generated!"});
            }
        }catch(e){
            console.log(e);
            res.status(403).json({success:false, data: null, msg: e});
        }
    },
    
    // Fetch a voucher by phone or email
    findVoucher : async (req,res) => {
        var search = req.params.search;
        try{
            var vouch = await Voucher
            .find({
                $or:[{phone: search}, {serial: search}, {pin: search}, {email: search}, {vendor: search}] 
            }).populate('vendor').lean();
            if(vouch){
               res.status(200).json({success:true, data: vouch});
            }else{
                res.status(202).json({success:false, data: null, msg:"No voucher found!"});
            }
        }catch(e){
            res.status(403).json({success:false, data: null, msg: e});
        }
    },


    // Verify a voucher
    verifyVoucher : async (req,res) => {
        const { serial,pin } = req.body;
        try{
            var vouch = await Voucher.findOne({serial}).lean();
            const match = bcrypt.compareSync(pin, vouch.pin);
            if(password && match){
                vouch.created_at = moment(user.created_at).format('LLL');
                const token = jwt.sign({data:vouch}, 'secret', { expiresIn: 60 * 60 });
                vouch.token = token;
                res.status(200).json({success:true, data: vouch});
            }else{
                res.status(202).json({success:false, data: null, msg:"Wrong serial or pin!"});
            }
        }catch(e){
          console.log(e)
            res.status(403).json({success:false, data: null, msg: e});
        }
    },


    








}