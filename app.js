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

var playlist = [];

io.sockets.on('connection', function(socket) {
  socket.on('playStream', function(sound){
    var track = '';
    if(sound.type == 'youtube'){
      track = encodeURI('http://www.youtube.com/watch?v=' + sound.stream);
    }

    playlist.push(track);
    console.log('Add new Song');
    playNextSong();
    io.sockets.emit('done');

  });
});

function playNextSong () {
  var track = playlist[0];
  vlc.request('status',function(err, data) {

    if (err) throw new Error('Please Start Vlc');

    if (!data.position && data.state === 'stopped' && typeof track !=='undefined') {
      console.log('start new Song');
      console.log(track);
      vlc.status.play(track,function(){
        playlist.shift();
      });
    }

  });
}


setInterval(function main () {
  playNextSong();
}, 5000);
