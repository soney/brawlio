(function() {
	var vendor_path = "/vendor";
	var client_path = "/client";
	var game_path = "/game";

	require({
		priority: ['vendor/jquery'], //Load jquery before any other library by default
		paths: {
			"client": client_path
			, "vendor/handlebars": vendor_path + "/handlebars/dist/handlebars"
			, "vendor/jquery": vendor_path + "/jquery-1.6.2.min"
			, "vendor/jquery-ui": vendor_path + "/jquery-ui-1.8.14.custom/js/jquery-ui-1.8.14.custom.min"
			, "vendor/socket.io": "/socket.io/socket.io"
			, "text": vendor_path+"/text"
			, "game": game_path
		}
	});

})();
