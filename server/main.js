var express = require("express");
var auth = require("connect-auth");
var socket_io = require('socket.io');
var Worker = require('webworker').Worker;
var DigestJ = require('./digestj');
var database = require('./database').database;
var Registration = require('./registration');

var BrawlIO = function() {
};

var getSharedSecretForUserFunction = function(user,  callback) {
        var result;
        if(user == 'foo')
                result= 'bar';
        callback(null, result);
};

(function() {
	//Private memebers
	var server = undefined,
		io = undefined;

	var start_server = function(path) {
		server = express.createServer(
				express.cookieParser()
	//			, connect.session({secret: 'almaden'})
				//, auth(DigestJ({getSharedSecretForUser: getSharedSecretForUserFunction}))
				, express.router(routes)
				, express.static(path)
			);
		io = socket_io.listen(server);

		initialize_sockets(io);

		server.listen(8000);
	};

	var routes = function(server) {
		server.get("/register/:key", function(req, res, next) {
			res.render("client/register");
		});
	};

	var initialize_sockets = function(io) {
		io.sockets.on('connection', function(socket) {
			initialize_socket(socket);
		});
	};

	var initialize_socket = function(socket) {
		socket.on('login', function(user, password) {
			var validation= database.validate_user(user, password);
			if(validation.result) {
				socket.emit("login_success", validation.user);
			}
			else {
				socket.emit("login_failure", validation.explanation);
			}
		});
		socket.on('register', function(user, email) {
			var reg_key = Registration.generate_key();
			Registration.send_reg_email(user, email, reg_key);
			database.create_user(user, email, reg_key);
		});
	};

	//Public members
	this.start = function(path) {
		if(!path) path = __dirname;
		start_server(path);
		console.log("Good times to be had at localhost:8000");
	};

}).call(BrawlIO.prototype);

module.exports = BrawlIO;
