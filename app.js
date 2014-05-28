var express = require('express'),
    config    = require('./config/config'),
    util    = require('util'),
    vlc     = require('vlc-api')(),
    _       = require('underscore'),
    cookie  = require('cookie'),
    app     = express();

app.use(express.static(process.cwd() + '/public'));

//Environment configs
conf = new config();
vlc._base = conf.vlcBase;

//Start application and Socket
var server = app.listen(1337);
var io = require('socket.io').listen(server, { log: conf.log });

//Class Playlist
function Playlist () {
  this.playlist = [];
  this.currentSong = {};
  this.playlistKey = 0;
}

// Playlist methods
Playlist.prototype.send = function() {
  io.sockets.emit('playlist', this.playlist);
  io.sockets.emit('currentSong', this.currentSong);
};

Playlist.prototype.add = function(sound, cookie) {
  this.playlistKey++;
  this.playlist.push({
    key: this.playlistKey,
    sound: sound,
    like: 0,
    liker:[]
  });
  this.toggleLikeSong(this.playlistKey, cookie);
  console.log('Add new Song');
};

Playlist.prototype.sort = function() {
  this.playlist = _.sortBy(this.playlist, function(sound){ return -sound.like; });
  io.sockets.emit('playlist', this.playlist);
};

Playlist.prototype.toggleLikeSong = function(key, cookie) {
  //find song
  var arrayKey = -1;
  _.find(this.playlist, function(v, k) {
    if (v.key === key) {
      arrayKey = k;
      return true;
    } else {
      return false;
    }
  });
  //no Song
  if (arrayKey !== -1){
    //like or unlike Song
    var song = this.playlist[arrayKey];
    if (typeof song.liker[cookie.id] === 'undefined' || song.liker[cookie.id] === false) {
      song.liker[cookie.id] = true;
      song.like++;
    } else {
      song.liker[cookie.id] = false;
      song.like--;
    }
    //sort playlist by like
    this.sort();
  }
};


var p = new Playlist();

io.sockets.on('connection', function(socket) {

  //get cookie or send it
  var cookie = {};
  if (typeof socket.handshake.headers.cookie !=='undefined')
    cookie = cookie.parse(socket.handshake.headers.cookie);
  if (typeof cookie.id ==='undefined'){
    io.sockets.socket(socket.id).emit("clientId", socket.id);
    //unauthenticated client
    cookie.id = socket.id;
  }

  //add a song
  socket.on('playStream', function(sound){
    p.add(sound, cookie);
    playNextSong();
  });

  //send playlist
  socket.on('getPlaylist', function(sound){
    p.send();
  });

  //like a song
  socket.on('toggleLikeSong', function(req){
    p.toggleLikeSong(req.key, cookie);
  });

});


//Play next song when Vlc is stopped
function playNextSong () {
  var info = p.playlist[0];
  if (typeof info !=='undefined') {
    vlc.request('status',function(err, data) {

      if (err)
        throw new Error('Please Start Vlc: '+err);
      if (typeof data.state === 'undefined')
        throw new Error('Stop service on port 8080 and restart Vlc');

      var sound = info.sound;
      var track = '';
      if(sound.type == 'youtube'){
        track = encodeURI('http://www.youtube.com/watch?v=' + sound.stream.id.$t.substring(42));
      }

      if (!data.position && data.state === 'stopped' && track !=='') {
        console.log('start new Song');
        vlc.status.play(track,function(){
          p.currentSong = info;
          p.playlist.shift();
          p.send();
        });
      }

    });
  }
}

//get Vlc Status every 5sec
setInterval(function main () {
  playNextSong();
}, 5000);
