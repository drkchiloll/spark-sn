/*
  Proxy URL for this WebServer:
  https://sparkint.proxy.wwtatc.com
*/
var express = require('express'),
    bodyParser = require('body-parser');

var sparkAdminToken = require('./config').token;

// DI
var sparkServFactory = require('./lib/sparkService'),
    sparkService = sparkServFactory(sparkAdminToken),
    sparkCntrlFactory = require('./lib/sparkController'),
    sparkController = sparkCntrlFactory(sparkService);

var app = express();

app
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended : false}))
  .use(express.static('./public'));

app.post('/sn-test', sparkController.pocStarter);
app.put('/sn-test/:id', sparkController.pocUpdate);
app.get('/sn-test/:atc', sparkController.queryPoc);
app.delete('/sn-test/:atc', sparkController.popMember);
app.delete('/rmrecord/:atc', sparkController.removeRecord);

app.get('/fileupload/:filename', function(req, res) {
  var fileName = req.params.filename;
  res.sendFile(__dirname+'/public/files/' + fileName);
});

app.post('/pochooks', sparkController.handleHooks);

app.listen(5000, function() {
  console.log('Server Listening on Port 5000');
});
