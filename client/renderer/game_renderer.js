(function(FistiCode) {
	var fc = FistiCode;

	var pt_ratio = fc.constants.PIXEL_TILE_RATIO;

	function draw_game(game, ctx) {
		var attributes = game.attributes,
			map = game.attributes.map,
			teams = game.attributes.teams;

		game.update();
		fc._draw_map(game.attributes.map, ctx);
		_.forEach(game.state.live_players, function(player) {
			fc._draw_player(player, ctx);
		});

		game.projectiles.forEach(function(projectile) {
			var radius = projectile.get_radius(),
				position = projectile.get_position(),
				x = position.x,
				y = position.y;

			//console.log(position.id + ": ", position.x, position.y);

			ctx.save();
			ctx.scale(pt_ratio, pt_ratio);
			ctx.translate(x,y);

			//A circle
			ctx.fillStyle = "red";
			ctx.beginPath();
			ctx.arc(0, 0, radius,0,Math.PI*2,true); //Full circle
			ctx.fill();

			ctx.restore();
		});
	};

	fc._draw_game = draw_game;
})(FistiCode);
