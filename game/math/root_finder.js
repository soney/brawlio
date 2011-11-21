define(function(require) {
	require("vendor/underscore");

	
	var ERROR_TOLERANCE = 0.000001;
	var close_to = function(a,b, tol) {
		return Math.abs(a-b) < tol;
	};
	var secant_root_finder = function(fn, x1, x2, ftol, xtol) {
		var f1, f2, slope, x3, x4, tmp;
		ftol = ftol || 0.00001;
		xtol = xtol || 0.00001;

		f1 = fn(x1);
		if(close_to(f1, 0, ftol)) { return x1; }
		f2 = fn(x2);
		if(close_to(f2, 0, ftol)) { return x2; }

		while(!close_to(x1, x2, xtol)) {
			slope = (f2-f1)/(x2-x1);
			if(close_to(slope, 0, ERROR_TOLERANCE)) { return false; }
			x3 = x2 - f2/slope;
			f3 = fn(x3);

			if(close_to(f3, 0, ftol)) { break; }

			x1 = x2;
			f1 = f2;

			x2 = x3;
			f2 = f3;
		}
		return x3;
	};

	return secant_root_finder;
});
