/*
  Proxy URL for this WebServer:
  https://sparkint.proxy.wwtatc.com
*/
var express = require('express'),
    bodyParser = require('body-parser');

var sparkAdminToken = require('./config').token;

// DI
<<<<<<< HEAD
var sparkServFactory = require('./lib/sparkService'),
    sparkService = sparkServFactory(sparkAdminToken),
    sparkCntrlFactory = require('./lib/sparkController'),
    sparkController = sparkCntrlFactory(sparkService);
=======
var sparkServDev = require('./lib/sparkServiceDev'),
    sparkServiceDev = sparkServDev(sparkAdminToken),
    sparkServProd = require('./lib/sparkServiceProd'),
    sparkServiceProd = sparkServProd(sparkAdminToken),
    sparkCntrlDev = require('./lib/sparkControllerDev'),
    sparkControllerDev = sparkCntrlDev(sparkServiceDev),
    sparkCntrlProd = require('./lib/sparkControllerProd'),
    sparkControllerProd = sparkCntrlProd(sparkServiceProd);
>>>>>>> c714fbec91e6e56af63f51991b841b00ee69f943

var app = express();

app
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended : false}))
  .use(express.static('./public'));

<<<<<<< HEAD
app.post('/sn-test', sparkController.pocStarter);
app.put('/sn-test/:id', sparkController.pocUpdate);
app.get('/sn-test/:atc', sparkController.queryPoc);
app.delete('/sn-test/:atc', sparkController.popMember);
app.delete('/rmrecord/:atc', sparkController.removeRecord);
=======
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
>>>>>>> c714fbec91e6e56af63f51991b841b00ee69f943

app.get('/fileupload/:filename', function(req, res) {
  var fileName = req.params.filename;
  res.sendFile(__dirname+'/public/files/' + fileName);
});

<<<<<<< HEAD
app.post('/pochooks', sparkController.handleHooks);
=======
app.post('/pochooksProd', sparkControllerProd.handleHooks);
app.post('/pochooksDev', sparkControllerDev.handleHooks);
>>>>>>> c714fbec91e6e56af63f51991b841b00ee69f943

app.listen(5000, function() {
  console.log('Server Listening on Port 5000');
});
