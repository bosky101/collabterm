var express = require('express'), colors = require('colors'), faye = require('faye'), argv = require('optimist').argv, _ = require('underscore');
var util = require('util'), exec = require('child_process').exec;
var inspect = require('inspect');
var cli = require('readline').createInterface(process.stdin, process.stdout, null);
DEBUG=1;

var _log = function(){
    if(DEBUG){
	console.log.apply(console.log,arguments);
    }
};

var CollabTerm = function(){
    var self = this;
};

CollabTerm.networkReady = function(_scope){
    return function(error, stdout, stderr) { 
	var _this = _scope;
	_this.port = (argv.port) ? argv.port : "8765";
	_this.host = (argv.host) ? argv.host : stdout.replace('\n','');
	_log('network ready with ',_this.host.length+":"+_this.port);
	_this.setupFaye();
    };
};
CollabTerm.prototype.p = function(str){
    if(!str){
	process.stdout.write('> '.green);
    }else{
	process.stdout.write(str);
    }
};

var client;

CollabTerm.prototype.setupFaye = function(){
    var _this = this;

    global.app = express.createServer();
    _log('listen on '+_this.host+':'+_this.port);
    app.listen(_this.port,_this.host);

    var bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 5});
    var auth = require('./faye-exts/auth.js');
    bayeux.attach(app);
  
    _log('Faye Listening on ', _this.host + ':'+_this.port+'/faye');

    var stdin = process.openStdin(); 
    require('tty').setRawMode(true);    
    
    var room = '/'+ ( (argv.room)? argv.room : 'global');
    var user = (argv.user) ? argv.user : 'Guest';
    cli.on('line', function(chunk){	
	var _published = bayeux.getClient().publish(room, {typed:chunk,user:user});
	console.log('send '+chunk.red);
    });

    var _joined = bayeux.getClient().subscribe(room,function(message){
	//process.stdout.write(message.typed.red);
	if(message.typed){
	    exec(message.typed, function( _er1,_stdout1,_stderr1 ){
		_this.p(message.typed + ' typed gave...\n' + _stdout1);
		if(message.user == user){
		    return;
		}
		bayeux.getClient().publish(room,{output:_stdout1,user:message.user});
	    });
	}
    });

    bayeux.getClient().subscribe('/discovery/*', function(message){
	var reply_to = message.channel+'/reply';
	console.log('/discovery/* got from '+message.channel,' reply to '+reply_to);
	bayeux.getClient().publish(reply_to, {channel:message.channel,host:_this.host,port:_this.port,status:200});
    });

    _this.p();

    if(DEBUG){
	bayeux.bind('handshake', function(clientId) {
	    console.log('[  HANDSHAKE ] ' + clientId);
	});
	
	bayeux.bind('subscribe', function(clientId, channel) {
	    console.log('[  SUBSCRIBE] ' + clientId + ' -> ' + channel);    
	});
	
	bayeux.bind('publish', function(clientId, channel, data){
	    console.log('[ PUBLISH] to ' + channel, 'with data ',data);
	});
	
	bayeux.bind('unsubscribe', function(clientId, channel) {
	    console.log('[ UNSUBSCRIBE] ' + clientId + ' -> ' + channel);
	});
    }

};

var CT  = new CollabTerm();
exec("(/usr/sbin/arp $(hostname) | awk -F'[()]' '{print $2}')", CollabTerm.networkReady(CT));