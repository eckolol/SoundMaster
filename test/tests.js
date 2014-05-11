var should = require('should'),
    nock   = require('nock'),
    config = require('../config/config'),
    io     = require('socket.io-client');

conf = new config();

var base = conf.vlcBase;
var socketURL = 'http://localhost:1337';
var options ={
  transports: ['websocket'],
  'force new connection': true
};
var sound = {
  'type':'youtube',
  'stream':'CSvFpBOe8eY',
};

var app = require('../app');

describe("Music Server",function(){
  it('Should play a youtube song', function(done){

    nock(base)
      .get('/requests/status.json?command=in_play&input=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DCSvFpBOe8eY')
      .reply(200);

    var client1 = io.connect(socketURL, options);
    client1.on('connect', function(data){
      client1.emit('playStream', sound);
    });

    client1.on('played', function(){
      done();
    });

  });
});
