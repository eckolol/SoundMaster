var express = require('express'),
    config    = require('./config/config'),
    util    = require('util'),
    vlc     = require('vlc-api')(),
    _       = require('underscore'),
    app     = express();

app.use(express.static(process.cwd() + '/public'));

conf = new config();

vlc._base = conf.vlcBase;

var server = app.listen(1337);

var io = require('socket.io').listen(server);

var playlist = [];
var currentSong = [];
var playlistKey = 0;

io.sockets.on('connection', function(socket) {
  socket.on('playStream', function(sound){
    playlistKey++;
    playlist.push({key:playlistKey, sound: sound, like: 1});
    console.log('Add new Song');
    io.sockets.emit('playlist',playlist);
    playNextSong();

  });
  socket.on('getPlaylist', function(sound){
    io.sockets.emit('playlist',playlist);
    io.sockets.emit('currentSong',currentSong);
  });

  socket.on('toggleLikeSong', function(key){
    var arrayKey = -1;
    _.find(playlist, function(v, k) {
      if (v.key === key.key) {
        arrayKey = k;
        return true;
      } else {
        return false;
      }
    });
    playlist[arrayKey].like++;
    playlist = _.sortBy(playlist, function(sound){ return -sound.like; });
    io.sockets.emit('playlist',playlist);
  });

});



function playNextSong () {
  var info = playlist[0];
  if (typeof info !=='undefined') {
    var sound = info.sound;
    vlc.request('status',function(err, data) {

      if (err) throw new Error('Please Start Vlc');

      var track = '';
      if(sound.type == 'youtube'){
        track = encodeURI('http://www.youtube.com/watch?v=' + sound.stream.id.$t.substring(42));
      }

      if (!data.position && data.state === 'stopped' && track !=='') {
        console.log('start new Song');
        vlc.status.play(track,function(){
          currentSong = info;
          playlist.shift();
          io.sockets.emit('playlist',playlist);
          io.sockets.emit('currentSong',currentSong);
        });
      }

    });
  }
}


setInterval(function main () {
  playNextSong();
}, 5000);
