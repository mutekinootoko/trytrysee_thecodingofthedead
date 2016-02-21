var express = require('express');
var router = express.Router();
var Sandbox = require('sandbox');
var bodyParser = require('body-parser');
var multer = require('multer');
var cors = require('cors');
var app = express();
var upload = multer();


app.use(cors());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

router.get('/pingme', function(req, res) {
  res.end('64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.058 ms');
});

router.post('/bmsandbox', function(req, res) {
  console.log('bmsandbox call from:' + req.ip + ' with body:' + JSON.stringify(req.body));

  var sb  = new Sandbox();
  sb.run(unescape(req.body.jscode), function(output) {
  //sb.run( "(function(name) { return 'Hi there, ' + name + '!'; })('Fabio')", function(output) {
    console.log('call from ' + req.ip + ' outputs:' + JSON.stringify(output));
    res.json(output);
  });
});

// var server = app.listen(8081, function () {

//   var host = server.address().address
//   var port = server.address().port

//   console.log("Example app listening at http://%s:%s", host, port)

// })

router.get('/', function(req, res, next) {
  res.send('rest test');
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
});

module.exports = router;
