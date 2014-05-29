var static = require('node-static'),
    http   = require('http'),
    config = require('./config/config'),
    util   = require('util'),
    vlc    = require('vlc-api')(),
    _      = require('lodash'),
    cookie = require('cookie');

//Environment configs
conf = new config();
vlc._base = conf.vlcBase;

//Start server and socket
var fileServer = new static.Server('./public');
var server = http.createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(1337);
var io = require('socket.io').listen(server, { log: conf.log });

//Class Jukebox
function Jukebox () {
  this.playlist = [];
  this.currentSong = {};
  this.playlistKey = 0;
}

// Jukebox methods
Jukebox.prototype.send = function() {
  io.sockets.emit('playlist', this.playlist);
  io.sockets.emit('currentSong', this.currentSong);
};

Jukebox.prototype.add = function(sound, cookies) {
  this.playlistKey++;
  this.playlist.push({
    key: this.playlistKey,
    sound: sound,
    like: 0,
    liker:[]
  });
  this.toggleLikeSong(this.playlistKey, cookies);
  console.log('Add new Song');
};

Jukebox.prototype.sort = function() {
  this.playlist = _.sortBy(this.playlist, function(sound){ return -sound.like; });
  io.sockets.emit('playlist', this.playlist);
};

Jukebox.prototype.toggleLikeSong = function(key, cookies) {
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
    if (_.isUndefined(song.liker[cookies.id]) || !song.liker[cookies.id]) {
      song.liker[cookies.id] = true;
      song.like++;
    } else {
      song.liker[cookies.id] = false;
      song.like--;
    }
    //sort playlist by like
    this.sort();
  }
};


var j = new Jukebox();

io.sockets.on('connection', function(socket) {

  //get cookies or send it
  var cookies = {};
  if (!_.isUndefined(socket.handshake.headers.cookie))
    cookies = cookie.parse(socket.handshake.headers.cookie);
  if (_.isUndefined(cookies.id)){
    io.sockets.socket(socket.id).emit("clientId", socket.id);
    //unauthenticated client
    cookies.id = socket.id;
  }

  //add a song
  socket.on('playStream', function(sound){
    j.add(sound, cookies);
    playNextSong();
  });

  //send playlist
  socket.on('getPlaylist', function(sound){
    j.send();
  });

  //like a song
  socket.on('toggleLikeSong', function(req){
    j.toggleLikeSong(req.key, cookies);
  });

});


//Play next song when Vlc is stopped
function playNextSong () {
  var info = j.playlist[0];
  if (!_.isUndefined(info)) {
    vlc.request('status',function(err, data) {

      if (err)
        console.log('Please Start Vlc - '+err);
      else if (typeof data.state === 'undefined')
        console.log('Stop service on port 8080 and restart Vlc');
      else {
        var sound = info.sound;
        var track = '';
        if(sound.type == 'youtube'){
          track = encodeURI('http://www.youtube.com/watch?v=' + sound.stream.id.$t.substring(42));
        }

        if (!data.position && data.state === 'stopped' && track !=='') {
          console.log('start new Song');
          vlc.status.play(track,function(){
            j.currentSong = info;
            j.playlist.shift();
            j.send();
          });
        }
      }

    });
  }
}

//get Vlc Status every 5sec
setInterval(function main () {
  playNextSong();
}, 5000);
