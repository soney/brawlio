(function() {
	var vendor_path = "/vendor";
	var client_path = "/client";
	var game_path = "/game";
	var ace_path = vendor_path+"/ace";
	var ace_build_path = ace_path+"/build/src";
	var ace_support_path = ace_path+"/support";

	require({
		priority: ['vendor/jquery'], //Load jquery before any other library by default
		paths: {
			"client": client_path
			, "vendor/handlebars": vendor_path + "/handlebars/dist/handlebars"
			, "vendor/jquery": vendor_path + "/jquery-1.6.2.min"
			, "vendor/jquery-ui": vendor_path + "/jquery-ui-1.8.14.custom/js/jquery-ui-1.8.14.custom.min"
			, "vendor/socket.io": "/socket.io/socket.io"
			, "game": game_path
			, "ace": ace_path+"/lib/ace"
			//, "ace": ace_build_path
			, "cockpit": ace_support_path+"/cockpit/lib/cockpit"
			, "pilot": ace_support_path+"/pilot/lib/pilot"
			, "text": vendor_path+"/text"
		}
	});

})();
