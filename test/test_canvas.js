(function() {
	var FPS = 30;
	var error_tolerance = 0.00001;
	var close_to = function(a,b) {
		return Math.abs(a-b)<error_tolerance;
	};
	var BrawlIOTestCanvas = function(options) {
		this.canvas = document.createElement('canvas');
		this.width = options.width;
		this.height = options.height;
		this.canvas.setAttribute("width", this.get_width());
		this.canvas.setAttribute("height", this.get_height());
		this.ctx = this.canvas.getContext("2d");
	};
	(function(my) {
		var proto = my.prototype;
		proto.get_element = function() { return this.canvas; };
		proto.save = function() { this.ctx.save(); };
		proto.restore = function() { this.ctx.restore(); };
		proto.get_width = function() { return this.width; };
		proto.get_height = function() { return this.height; };
		proto.clear = function() {
			this.ctx.clearRect(0, 0, this.get_width(), this.get_height());
		};
		proto.circle = function(cx, cy, r) {
			this.ctx.arc(cx, cy, r, 0, Math.PI*2, true);
		};
		proto.draw = function(shape, options) {
			this.save();
			if(shape.is("line")) {
				var line = shape;
				if(close_to(line.b, 0)) { //Approximately vertical
					var x = -line.c/line.a;
				} else {
					var point_at = function(x) {
						var y = (-line.c - line.a*x)/line.b;
						return {x:x, y:y};
					};
					var p1 = point_at(-1);
					var p2 = point_at(this.get_width()+1);
					console.log(p1, p2);
				}
			}
			this.restore();
		};
	}(BrawlIOTestCanvas));

	window.create_test_canvas = function(options) {
		return new BrawlIOTestCanvas(options);
	};
}());
