(function() {
	var vendor_path = "/vendor";
	var client_path = "/client";

	require({
		priority: ['vendor/jquery'], //Load jquery before any other library by default
		paths: {
			"client": client_path,
			"vendor/handlebars": vendor_path + "/handlebars/dist/handlebars",
			"vendor/jquery": vendor_path + "/jquery-1.6.2.min",
			"vendor/socket.io": "/socket.io/socket.io"
		}
	});

})();

require(["client/main", "vendor/jquery"], function(BrawlIO) {
	$(function() {
		console.log(BrawlIO);
	});
});
