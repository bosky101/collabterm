var express = require('express');

var app = express.createServer();

app.get('*', function(req,res){ res.send('hello world');});

app.listen(8000);
