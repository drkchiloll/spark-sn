var express = require('express'),
    bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : false}));

app.post('/sn-test', function(req, res) {
  console.log(req.body);

  res.status(201).send(req.body);
});

app.listen(5000, function() {
  console.log('Server Listening on Port 5000');
});
