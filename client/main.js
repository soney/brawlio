define(function() {
	var BrawlIO = {
	};

	BrawlIO.assert = function(test, message) {
		if(FistiCode._debug) {
			console.assert(test, message);
		}
	};

	return BrawlIO;
});
