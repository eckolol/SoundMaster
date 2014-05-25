var should = require('should'),
    nock   = require('nock'),
    config = require('../config/config'),
    assert = require("assert"),
    io     = require('socket.io-client');

conf = new config();

var base = conf.vlcBase;
var socketURL = 'http://localhost:1337';
var options ={
  transports: ['websocket'],
  'force new connection': true
};
var sound = {
  type:'youtube',
  stream:{id:{$t:'CSvFpBOe8eY'}},
};

var app = require('../app');

describe("Music Server",function(){
  it('Should add a youtube song', function(done){

    nock(base)
      .get('/requests/status.json')
      .reply(200, {
          state: 'play'
         });

    var client1 = io.connect(socketURL, options);
    client1.on('connect', function(data){
      client1.emit('playStream', sound);
    });

    client1.on('playlist', function(data){
      assert.equal('CSvFpBOe8eY', data[0].sound.stream.id.$t);
      done();
    });


  });
});
