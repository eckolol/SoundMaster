process.env.NODE_ENV = 'test';

var should = require('should'),
    nock   = require('nock'),
    config = require('../config/config'),
    assert = require('chai').assert,
    io     = require('socket.io-client');

conf = new config();
var base = conf.vlcBase;
var socketURL = 'http://localhost:1337';
var sound = {
  type:'youtube',
  stream:{id:{$t:'CSvFpBOe8eY'}},
};


process.env.NODE_ENV = 'test';

var app = require('../app');




describe("Music Server",function(){

  var socket;

  beforeEach(function(done) {
      // Setup
      client1 = io.connect(socketURL, {
          'reconnection delay' : 0,
          'reopen delay' : 0,
          'force new connection' : true
      });
      client1.on('connect', function() {
          done();
      });
      client1.on('disconnect', function() {
      });
  });

  afterEach(function(done) {
      // Cleanup
      if(client1.socket.connected) {
          client1.disconnect();
      } else {
          console.log('no connection to break...');
      }
      done();
  });

  it('Should play a youtube song', function(done){
    nock(base)
      .get('/requests/status.json')
      .reply(200, {
          state: 'stopped'
         });
    client1.emit('playStream', sound);
    client1.on('currentSong', function(data){
      assert.equal('CSvFpBOe8eY', data.sound.stream.id.$t);
      done();
    });
  });

  it('Should send the playlist', function(done){
    client1.emit('getPlaylist');
    client1.on('playlist', function(data){
      assert.isArray(data, 'what kind of music do we want?');
      done();
    });
  });

  it('Should add a youtube song', function(done){
    nock(base)
      .get('/requests/status.json')
      .reply(200, {
          state: 'play'
         });
    client1.emit('playStream', sound);
    client1.on('playlist', function(data){
      assert.equal('CSvFpBOe8eY', data[0].sound.stream.id.$t);
      done();
    });
  });

  it('Should like the first song', function(done){
    var keySong = 2;
    nock(base)
      .get('/requests/status.json')
      .reply(200, {
          state: 'play'
         });
    client1.emit('playStream', sound);
    client1.emit('toggleLikeSong', {key:keySong});
    client1.on('playlist', function(data){
      if(data[0].key==keySong && data[0].like==2)
        done();
    });
  });

  it('Should unlike the second song', function(done){
    var keySong = 3;
    var liked = false;
    nock(base)
      .get('/requests/status.json')
      .reply(200, {
          state: 'play'
         });
    client1.emit('playStream', sound);
    client1.emit('toggleLikeSong', {key:keySong});
    client1.on('playlist', function(data){
      if(data[1].key===keySong && data[1].like===2 && !liked){
        liked=true;
        client1.emit('toggleLikeSong', {key:keySong});
      }
      if(data[1].key===keySong && data[1].like===1 && liked){
        done();
      }
    });
  });

});

