/*!
 * Copyright(c) 2010 Ciaran Jessup <ciaranj@gmail.com>
 * MIT Licensed
 */
var  Base= require("connect-auth/lib/auth.strategies/http/base")
    ,crypto= require('crypto')
    ,authutils= require('connect-auth/lib/auth.strategies/_authutils');

var md5= function(str) {
  return crypto.createHash('md5').update(str).digest('hex');
};

Digest= module.exports= function (options) {
  options= options || {};
  var that= Base(options);
  var my= {};
  my._realm= options.realm || "secure";
  my._getSharedSecretForUser= options.getSharedSecretForUser;

  that.name = options.name || "digestj";
  
  that.authenticate = function(req, res, callback) {
	  console.log(req.params);
  }; 
  
  that.getAuthenticateResponseHeader= function( executionScope ) {
    return "DigestJ realm=\"" + my._realm.replace("\"","\\\"") + "\", nonce=\""+ authutils.getNonce(32)+"\"";
  };
  
  return that;
};
