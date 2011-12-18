var cp = concat_prefix = function(prefix, strs) {
	var do_it = function(str) {
		if(prefix == "") {
			return str;
		} else {
			return prefix+"/"+str;
		}
	};

	if(typeof strs === "string") {
		return do_it(strs);
	} else {
		return strs.map(do_it);
	}
};
var c = concat = function() {
	var rv = [];
	return rv.concat.apply(rv, arguments);
};

var path = "";
var src_path = cp(path, "src");
var vendor_path = cp(path, "vendor");
var build_path = cp(path, "build");
var game_path = cp(src_path, "game");
var client_path = cp(src_path, "client");

exports.game_src = c(
	cp(src_path, ["core.js"])
	, cp(vendor_path, ["underscore.js"])
	, cp(game_path, [ "util/object_oriented.js"
					, "util/listenable.js"

					, "math/root_finder.js"

					, "geometry/paths/path.js"
					, "geometry/paths/vector.js"
					, "geometry/paths/line.js"
					, "geometry/paths/line_segment.js"
					, "geometry/paths/ray.js"
					, "geometry/paths/circle.js"

					, "geometry/shapes/shape.js"
					, "geometry/shapes/circle.js"
					, "geometry/shapes/polygon.js"

					, "geometry/movement_paths/movement_path.js"
					, "geometry/movement_paths/path_map_utils.js"
					, "geometry/movement_paths/path_path_utils.js"

					, "game_events/game_event_factory.js"

					, "models/moving_object/moving_object.js"
					, "models/moving_object/moving_object_state.js"

					, "models/player/player.js"
					, "models/player/player_state.js"

					, "models/projectile/projectile.js"
					, "models/projectile/projectile_state.js"

					, "models/obstacles/obstacle.js"
					, "models/obstacles/polygon_obstacle.js"
					, "models/obstacles/map_boundary_obstacle.js"

					, "models/replay.js"
					, "models/team.js"
					, "models/map.js"
					, "models/game.js"

					, "constants.js"
					, "brawl.js"
					])
	);
exports.game_build = cp(build_path, "game.js");

exports.home_css_src = c(
		cp(client_path, [
			"css/main.css"
			, "css/index.css"
		])
	);
exports.home_css_build = cp(build_path, "home.css");

exports.set_username_css_src = c(
		cp(client_path, [
			"css/main.css"
			, "css/set_username.css"
		])
	);
exports.set_username_css_build = cp(build_path, "set_username.css");

exports.api_css_src = c(
		cp(client_path, [
			"css/main.css"
			, "css/api.css"
		])
	);
exports.api_css_build = cp(build_path, "api.css");

exports.dashboard_css_src = c(
		cp(client_path, [
			"css/main.css"
			, "css/dashboard.css"
		])
	);
exports.dashboard_css_build = cp(build_path, "dashboard.css");

exports.dashboard_src = c(
		exports.game_src
		, cp(vendor_path, [
			"jquery.js"
			, "jquery-ui-1.8.14.custom/development-bundle/ui/jquery-ui-1.8.14.custom.js"
		])
		, cp(client_path, [
			"brawlio/main.js"
			, "brawlio/socket.js"

			, "widgets/replay/control_bar.js"
			, "widgets/replay/replay_viewer.js"

			, "widgets/team/team_editor.js"
			, "widgets/team/team_tester.js"

			, "widgets/dashboard/dashboard.js"
			, "widgets/dashboard/home.js"
		])
	);
exports.dashboard_build = cp(build_path, "dashboard.js");

var ends_with = function(str1, str2) {
	return str1.slice(str1.length-str2.length) == str2;
};
exports.include_templates = function(strs) {
	var do_it = function(str) {
		if(ends_with(str, ".js")) {
			return "<script type = 'text/javascript' src = '"+str+"'></script>";
		} else if(ends_with(str, ".css")) {
			return "<link rel = 'stylesheet' href = '"+str+"' media='screen' />";
		}
	};
	if(typeof strs === "string") {
		return do_it(strs);
	} else {
		return strs.map(do_it).join("");
	}
};
