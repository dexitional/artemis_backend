var jwt = require('jsonwebtoken');

export const verifyToken = (req,res,next) => {
  const bearerHeader = req.headers['authorization'];
  if(typeof bearerHeader !== 'undefined'){
    const bearer =  bearerHeader.split(' ');
    req.token = bearer[1];
    jwt.verify(bearer[1], 'secret',(err,authData) =>{
      if(err) res.status(200).json({success:false, data: null, msg: 'Unauthorized access'})
      next();
    })
  }else{
    res.status(200).json({success:false, data: null, msg: 'Unauthorized access'})
  }
}