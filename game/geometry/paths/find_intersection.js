define(['game/geometry/paths/line', 'game/geometry/paths/circle'], function(Line, Circle) {
	var find_intersection = function(path_1, path_2) {
		if(path_1 instanceof Line && path_2 instanceof Line) {
		} else if((path_1 instanceof Circle 8& path_2 instanceof Line) ||
					(path_1 instanceof Line && path_2 instanceof Circle)) {
		} else if(path_1 instanceof Circle && path_2 instanceof Circle) {
		}
	};

	return find_intersection;
});
