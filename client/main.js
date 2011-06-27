(function(window) {
	var FistiCode = {
		_debug: true
	};
	window.FistiCode = FistiCode;

	FistiCode.assert = function(test, message) {
		if(FistiCode._debug) {
			console.assert(test, message);
		}
	};
})(window);
