/*
  Proxy URL for this WebServer:
  https://sparkint.proxy.wwtatc.com
*/
var express = require('express'),
    bodyParser = require('body-parser');

var sparkAdminToken = require('./config').token;

// DI
var sparkServDev = require('./lib/sparkServiceDev'),
    sparkServiceDev = sparkServDev(sparkAdminToken),
    sparkServProd = require('./lib/sparkServiceProd'),
    sparkServiceProd = sparkServProd(sparkAdminToken),
    sparkCntrlDev = require('./lib/sparkControllerDev'),
    sparkControllerDev = sparkCntrlDev(sparkServiceDev),
    sparkCntrlProd = require('./lib/sparkControllerProd'),
    sparkControllerProd = sparkCntrlProd(sparkServiceProd);

var app = express();

app
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended : false}))
  .use(express.static('./public'));

app.post('/snspark', sparkControllerProd.pocStart);
app.put('/snspark', sparkControllerProd.pocUpdate);

app.get('/snspark/:atc', sparkControllerProd.queryPoc);
app.delete('/snspark/:atc', sparkControllerProd.popMember);
app.delete('/rmrecordProd/:atc', sparkControllerProd.removeRecord);


app.post('/sn-test', sparkControllerDev.pocStarter);
app.put('/sn-test/:id', sparkControllerDev.pocUpdate);

app.get('/sn-test/:atc', sparkControllerDev.queryPoc);
app.delete('/sn-test/:atc', sparkControllerDev.popMember);
app.delete('/rmrecordDev/:atc', sparkControllerDev.removeRecord);

app.get('/fileupload/:filename', function(req, res) {
  var fileName = req.params.filename;
  res.sendFile(__dirname+'/public/files/' + fileName);
});

app.post('/pochooksProd', sparkControllerProd.handleHooks);
app.post('/pochooksDev', sparkControllerDev.handleHooks);

app.listen(5000, function() {
  console.log('Server Listening on Port 5000');
});
