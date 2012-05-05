var crypto = require('crypto'), fs = require('fs'), _ = require('underscore'), faye = require('faye');

var apiSecret = "fb8e20fc2e4c3f248c60c39bd652f3c1347298bb977b8b4d5903b85055620603";

var ownhash = module.exports.ownhash = function(elems,_options){
    var str=JSON.stringify(elems);
    var options = (_options)? _options : {};
    var salt = (options.salt) ? options.salt : 't@pb00kw3b';
    var algorithm = (options.algorithm ) ? options.algorithm : 'md5';
    var ret = crypto.createHash(algorithm).update(salt+str).digest('hex');
    return ret;
}; 

var ClientAuth = module.exports.ClientAuth = function(apiKey) { 
    this.apiKey = apiKey; 
};
 
ClientAuth.prototype = {
    outgoing: function(message, callback){
	if (message.channel !== '/meta/subscribe'){ 
	    return callback(message)
	};
	
	// Add ext field if it's not present
	if (!message.ext) message.ext = {};
		
	var self = this;
	//set token
	message.ext.authToken = trim()(message);
	message.ext.apiKey = self.apiKey;
	message.ext.apiToken = self.sha(self.apiKey)
	callback(message);	
    },
    sha: function(_key){
	return sha256(_key,apiSecret);
    }
};
var trim = module.exports.trim = function(){
    return function(_message){
	var trimmed = _.clone(_message);delete trimmed.ext;
	var authToken = ownhash(trimmed);
	return authToken;
    };
};
var ServerAuth = module.exports.ServerAuth = function(server) { 
    this._server = server; 
};
 
ServerAuth.prototype = {
    incoming: function(message, callback){
	if (message.channel !== '/meta/subscribe'){
	    return callback(message);
	}

	var _subscription,msgToken;
	// Get subscribed channel and auth token
	var _subscription = message.subscription;
	
        var canAuth=true;
	if(!message.ext){
	    console.log('cant authenticate ',message,' since no ext');
	    canAuth=false;
	}else{
	    if(message.ext.apiKey || !message.ext.apiToken){
		canAuth=false;
	    }
	}
	if(!canAuth){
	    message.error = 'unauthenticated';
	    console.log('unauthenticated, ignoring ',message);
	    return callback(message);
	}/*else{
	   console.log('can authenticate ');
	}*/
	
	if(!this.verify()(message.ext.apiKey,message.ext.apiToken)){
	    message.error = 'unauthorized';
	    console.log('unauthorized, ignoring ',message);
	}/*else{
	    console.log('validated! from ', message.sender);
	}*/
	callback(message);
    },
    verify: function(){
	return function(apiKey,apiToken){
	    var constructedApiToken = sha256(apiKey,apiSecret,'server:');
	    return (apiToken == constructedApiToken);
	}
    }
};

var sha256 = module.exports.sha256 = function(key,salt,msg) {
    var x = crypto.createHash('sha256').update(new Buffer(key + salt),'utf8').digest('hex');
    return x;
};
