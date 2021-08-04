var express = require('express');
var Router = express.Router();

/* Apps Landing Page */
Router.get('/', (req,res) => {
  res.render('site/index')
});

Router.get('/page/:pageid', (req,res) => {
  const pageid = req.params.pageid;
  res.render('site/page')
});


module.exports = Router;
