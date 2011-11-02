define(['game/models/player'], function(Player) {
	var Replay = function(options) {
		this.map = options.map;
		this.complete = options.complete || false;
		this.objects = [];
		this.events = [];
	};

	(function() {
		this.get_map = function() { return this.map; };
		this.add_moving_object = function(object, appears_at, disappears_at) {
			var meta_obj = {
				object: object,
				appears_at: appears_at,
				disappears_at: disappears_at
			};
			this.objects.push(meta_obj);
		};
		this.add_player = function(player) {
			this.add_moving_object(player, 0, undefined);
		};
		this.is_complete = function() {return this.complete;};
		this.get_snapshot_at = function(round) {
			var players = [];
			for(var i = 0, len = this.objects.length; i<len; i++) {
				var meta_object = this.objects[i];
				var appears_at = meta_object.appears_at
					, disappears_at = meta_object.disappears_at
					, object = meta_object.object;

				if((appears_at === undefined || round >= appears_at) &&
					(disappears_at === undefined || round < disappears_at)) {
					if(object instanceof Player) {
						var player = object;
						var position = player.get_position(round);

						var info = $.extend({}, position, {
							player: player
							, number: player.get_number()
							, team_id: player.get_team().id
						});
						players.push(info);
					}
				}
			}

			return {
				round: round
				, players: players
				, projectiles: []
				, map: {
					width: this.map.attributes.width
					, height: this.map.attributes.height
				}
			};
		};
	}).call(Replay.prototype);

	return Replay;
});
