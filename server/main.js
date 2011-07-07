var express = require('express');
var socket_io = require('socket.io');
var Worker = require('webworker').Worker;

var BrawlIO = function() {
};

(function() {
	//Private memebers
	var app = undefined,
		io = undefined;

	var start_server = function(path) {
		app = express.createServer();
		io = socket_io.listen(app);

		app.configure(function() {
			app.use(express.static(path));
		});

		app.get('/', function(req, res, next) {
			res.render('index');
		});

		initialize_sockets(io);

		app.listen(8000);
	};

	var initialize_sockets = function(io) {
		io.sockets.on('connection', function(socket) {
			initialize_socket(socket);
		});
	};

	var initialize_socket = function(socket) {
	};

	//Public members
	this.start = function(path) {
		if(!path) path = __dirname;
		start_server(path);
		console.log("Good times to be had at localhost:8000");
	};

}).call(BrawlIO.prototype);

module.exports = BrawlIO;

/*
var app = express.createServer(),
	io = require('socket.io').listen(app);
var Worker = require('webworker').Worker;

app.configure(function() {
	app.use(express.static(__dirname));
});

app.get('/', function(req, res, next) {
	res.render('index');
});


io.sockets.on('connection', function (socket) {
	socket.on('fight', function(p1_text, p2_text) {
		var p1_worker = new Worker(__dirname+'/server/brawlio_worker.js', p1_text);
		var p2_worker = new Worker(__dirname+'/server/brawlio_worker.js', p2_text);


		p1_worker.onmessage = function(e) {
			console.log("Received message: " + e);
			p1_worker.terminate();
		};

		p1_worker.postMessage({ foo : 'bar' });
		p1_worker.postMessage({'set_text'});
	});
});

app.listen(8000);
console.log("Listening on port 8000");
*/
