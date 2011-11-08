define(['game/models/obstacles/polygon_obstacle', 'game/util/object_oriented'], function(PolygonObstacle, oo_utils) {
	var MapBoundaryObstacle = function(options) {
		var width = options.width || 50;
		var height = options.height || 50;

		MapBoundaryObstacle.superclass.call(this, {
			points: [
				{x: 0, y: 0}
				, {x: width, y: 0}
				, {x: width, y: height}
				, {x: 0, y: height}
			]
			, inverted: true
		});
	};
	oo_utils.extend(MapBoundaryObstacle, PolygonObstacle);

	return MapBoundaryObstacle;
});
