(function(BrawlIO) {
	var PolygonObstacle = BrawlIO.get_type("PolygonObstacle");
	var MapBoundaryObstacle = function(options) {
		var width = options.width || 50;
		var height = options.height || 50;

		this.super_constructor.call(this, {
			points: [
				{x: 0, y: 0}
				, {x: width, y: 0}
				, {x: width, y: height}
				, {x: 0, y: height}
			]
			, inverted: true
		});
	};
	BrawlIO.oo_extend(MapBoundaryObstacle, PolygonObstacle);

	BrawlIO.define_factory("map_boundary_obstacle", function(options) {
		return new MapBoundaryObstacle(options);
	});
}(BrawlIO));
