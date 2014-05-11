var express = require('express'),
    config    = require('./config/config'),
    util    = require('util'),
    vlc     = require('vlc-api')(),
    app     = express();

app.use(express.static(process.cwd() + '/public'));

conf = new config();

vlc._base = conf.vlcBase;

var server = app.listen(1337);

var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
  socket.on('playStream', function (sound){

    if(sound.type == 'youtube'){
      track = encodeURI('http://www.youtube.com/watch?v=' + sound.stream);
    }

    vlc.status.play(track,function () {
      io.sockets.emit('played');
    });

  });
});
