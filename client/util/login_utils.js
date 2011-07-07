define(["vendor/socket.io", "vendor/jquery"], function() {
	$.do_login = function(options) {
		var user = options.user;
		var password = options.password;
		
		var socket = BrawlIO._socket;
		socket.emit("login", user, password);
	};
});
