#!/usr/bin/env node

var BrawlIO = require('./server/main');

var bio = new BrawlIO();
bio.start(__dirname);
/*

var express = require('express');
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
