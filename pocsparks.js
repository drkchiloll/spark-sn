var express = require('express'),
    bodyParser = require('body-parser');

var sparkAdminToken = require('./config').token;

// DI
var sparkServFactory = require('./lib/sparkService'),
    sparkService = sparkServFactory(sparkAdminToken),
    sparkCntrlFactory = require('./lib/sparkController'),
    sparkController = sparkCntrlFactory(sparkService);

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

app.post('/sn-test', sparkController.pocStarter);
app.put('/sn-test/:id', sparkController.pocUpdate);

app.listen(5000, function() {
  console.log('Server Listening on Port 5000');
});
