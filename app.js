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
    playlist.push(sound);
    console.log('Add new Song');
    io.sockets.emit('playlist',playlist);
    playNextSong();
    io.sockets.emit('done');

  });
  socket.on('getPlaylist', function(sound){
    io.sockets.emit('playlist',playlist);
  });
});

function playNextSong () {
  var sound = playlist[0];
  if (typeof sound !=='undefined') {
    vlc.request('status',function(err, data) {

      if (err) throw new Error('Please Start Vlc');

      var track = '';
      if(sound.type == 'youtube'){
        track = encodeURI('http://www.youtube.com/watch?v=' + sound.stream.id.$t.substring(42));
      }

      if (!data.position && data.state === 'stopped' && track !=='') {
        console.log('start new Song');
        vlc.status.play(track,function(){
          playlist.shift();
        });
      }

    });
  }
}


setInterval(function main () {
  playNextSong();
}, 5000);
