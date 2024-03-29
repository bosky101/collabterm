var express = require('express'), colors = require('colors'), faye = require('faye'), argv = require('optimist').argv, _ = require('underscore');
var util = require('util');
var inspect = require('inspect');
var cli = require('readline').createInterface(process.stdin, process.stdout, null);

DEBUG=0;
var clients = [];
var port = 8765;
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
	_this.port = (argv.port) ? argv.port : port;
	_this.host = (argv.host) ? argv.host : stdout.replace('\n','');
	_log('network ready with ',_this.host+":"+_this.port);
	
	_this.setupFaye();
	_this.connectToPeers();
    };
};

CollabTerm.prototype.connectToPeers = function(str){
    var peers = [];
    for(var host=0;host<255;host++){
	var _this = this;
	var _host = '192.168.10.'+ host;
	if(_host == _this.host) {
	    continue;
	}
	var location =  'http://'+_host+':'+port;
	var presence = '/discovery/'+host;
	//_log('connect to faye at ',location,' publish to '+presence);
	var client = new faye.Client(location+'/faye');
	var _ok = client.publish(presence,{channel:presence});
	client.subscribe(presence,function(message){
	    _log('\t OK ',message);
	    //clients.push(client);
	});
	var room = '/'+ ( (argv.room)? argv.room : 'global');
		
	client.subscribe(room, function(message){
	    //console.log(room+ ' got  ', message);
	    
	    process.stdout.write('['+message.user+'] > '+ message.typed.blue);
	if(message.typed){
	    /*if(message.user == user){
		return;
	    }*/
	    /*console.log('publish to '+ room , message);
	    var _sent = bayeux.getClient().publish(room,{output:_stdout1,user:message.user});
	    console.log('_sent is ', _sent);
	    return;
	    console.log('going to exec :',message.typed+'['+message.typed.length+']');
	    */
	    return;
	    var exec = require('child_process').exec;
	    exec("ls", function( de_1, de_2, de_3 ){
		/*console.log(de_2);return;
		if(_er1 || _stderr1){
		    console.log('syntax error: ',arguments);
		    return;
		}
		_this.p(message.typed + ' typed gave...\n' + _stdout1);
		if(message.user == user){
		    return;
		}
		bayeux.getClient().publish(room,{output:_stdout1,user:message.user});
		*/
	    });
	}

	});

    }
};

CollabTerm.prototype.p = function(str){
    if(!str){
	process.stdout.write('> '.green);
    }else{
	process.stdout.write(str);
    }
};

CollabTerm.prototype.setupFaye = function(){
    var _this = this;

    global.app = express.createServer();
    _log('listen on '+_this.host+':'+_this.port);
    app.listen(_this.port,_this.host);

    var bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});
    var auth = require('./faye-exts/auth.js');
    bayeux.attach(app);

    var room = '/'+ ( (argv.room)? argv.room : 'global');

    _log('Faye Listening on ', _this.host + ':'+_this.port+'/faye with room: ',room);
    
    
    cli.on('line', function(chunk){	
	var _published = bayeux.getClient().publish(room, {typed:chunk,user:user});
	//var _test = bayeux.getClient().publish('/discovery/112', {typed:chunk,user:user});
	//console.log('getClient is ', bayeux.getClient());
	//console.log('send '+chunk.red +' to '+ room);
    });
     
    /*bayeux.getClient().subscribe('/discovery/*', function(message){
	if(message.channel == _this.host){return;}
	var reply_to = message.channel+'/reply';
	console.log('/discovery/* got from '+message.channel,' reply to '+reply_to);
	bayeux.getClient().publish(message.channel, {channel:message.channel,host:_this.host,port:_this.port,status:200});
    });*/

    _this.p();

    if(DEBUG){
	bayeux.bind('handshake', function(clientId) {
	    console.log('[  HANDSHAKE ] ' + clientId);
	});
	
	bayeux.bind('subscribe', function(clientId, channel) {
	    console.log('[  SUBSCRIBE] ' + clientId + ' -> ' + channel+' clients=',clients.length);    
	});
	
	bayeux.bind('publish', function(clientId, channel, data){
	    console.log('[ PUBLISH] to ' + channel, 'with data ',data);
	});
	
	bayeux.bind('unsubscribe', function(clientId, channel) {
	    console.log('[ UNSUBSCRIBE] ' + clientId + ' -> ' + channel+' clients=',clients.length);
	});
    }

};

var CT  = new CollabTerm();
var os = "default";
	
userip1 = "(/usr/sbin/arp $(hostname) | awk -F'[()]' '{print $2}')";
userip2 = "ifconfig|grep broadcast| cut -f2 -d' '"; 
    
var do_exec = function(str,cb){
    var exec = require('child_process').exec;
    return exec(str,cb);
};

if(argv.os){
    if(argv.os == 'ubuntu'){
	userip2 = "ifconfig|grep Bcast|cut -f2 -d':'|cut -f1 -d' '";
    }
}

cli.question("Please enter a name > ", function(answer){
    user = answer;

    /* close */
    cli.close();

    do_exec(userip2, CollabTerm.networkReady(CT));
});
