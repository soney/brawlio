define(function(require) {
	var create_circle = require("game/geometry/shapes/circle");
	var create_polygon = require("game/geometry/shapes/polygon");
	return function(type, options) {
		if(type === "circle") {
			return create_circle(options);
		} else if(type === "polygon") {
			return create_polygon(options);
		}
	};
});
