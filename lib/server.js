var express = require('express'),
    vlc     = require('vlc-api')(),
    app     = express();

app.use(express.static(process.cwd() + '/public'));

var server = app.listen(1337);