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
		this.scale = options.scale;
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
			options = options || {};
			this.save();
			this.ctx.scale(this.scale, this.scale);

			this.ctx.strokeStyle = options.strokeStyle || "black";
			this.ctx.fillStyle = options.fillStyle || "black";
			this.ctx.lineWidth = options.lineWidth || 1/this.scale;

			if(shape.is("line")) {
				var line = shape;
				if(close_to(line.b, 0)) { //Approximately vertical
					var x = -line.c/line.a;
					this.ctx.beginPath();
					this.ctx.moveTo(x, -1);
					this.ctx.lineTo(x, this.get_height()+1);
				} else {
					var point_at = function(x) {
						var y = (-line.c - line.a*x)/line.b;
						return {x:x, y:y};
					};
					var p1 = point_at(-1);
					var p2 = point_at(this.get_width()+1);

					this.ctx.beginPath();
					this.ctx.moveTo(p1.x, p1.y);
					this.ctx.lineTo(p2.x, p2.y);
				}
				this.ctx.stroke();
			} else if(shape.is("line_segment")) {
				var line_segment = shape;

				this.ctx.beginPath();
				this.ctx.moveTo(line_segment.p0.x, line_segment.p0.y);
				this.ctx.lineTo(line_segment.p1.x, line_segment.p1.y);
				
				this.ctx.stroke();
				this.ctx.beginPath();
				this.circle(line_segment.p0.x, line_segment.p0.y, 2/this.scale);
				this.ctx.stroke();
				this.ctx.beginPath();
				this.circle(line_segment.p1.x, line_segment.p1.y, 2/this.scale);
				this.ctx.stroke();
			} else if(shape.is("ray")) {
				var ray = shape;

				this.ctx.beginPath();
				this.circle(ray.p0.x, ray.p0.y, 2/this.scale);
				this.ctx.stroke();
				var theta = ray.get_theta();
				var p2x = ray.p0.x + (this.get_width() + this.get_height()) * Math.cos(theta);
				var p2y = ray.p0.y + (this.get_width() + this.get_height()) * Math.sin(theta);

				this.ctx.beginPath();
				this.ctx.moveTo(ray.p0.x, ray.p0.y);
				this.ctx.lineTo(p2x, p2y);
				
				this.ctx.stroke();
			} else if(shape.is("vector")) {
				var vector = shape;
				var x0 = options.x || 0;
				var y0 = options.y || 0;
				var x1 = x0 + vector.x;
				var y1 = y0 + vector.y;

				this.ctx.beginPath();
				this.ctx.moveTo(x0, y0);
				this.ctx.lineTo(x1, y1);
				this.ctx.stroke();
				var theta = vector.get_theta();
				var arrow_length = 4;
				var arrow_p1x = x1 + arrow_length * Math.cos(theta + 3*Math.PI/4);
				var arrow_p1y = y1 + arrow_length * Math.sin(theta + 3*Math.PI/4);

				var arrow_p2x = x1 + arrow_length * Math.cos(theta - 3*Math.PI/4);
				var arrow_p2y = y1 + arrow_length * Math.sin(theta - 3*Math.PI/4);
				this.ctx.beginPath();
				this.ctx.moveTo(x1,y1);
				this.ctx.lineTo(arrow_p1x, arrow_p1y);
				this.ctx.lineTo(arrow_p2x, arrow_p2y);
				this.ctx.closePath();
				this.ctx.fill();
			} else if(shape.is("circle")) {
				var circle = shape;

				this.ctx.beginPath();
				this.circle(circle.get_cx(), circle.get_cy(), circle.get_radius());
			}
			this.restore();
		};
	}(BrawlIOTestCanvas));

	window.create_test_canvas = function(options) {
		return new BrawlIOTestCanvas(options);
	};
}());
