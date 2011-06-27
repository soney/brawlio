(function(FistiCode) {
	var fc = FistiCode;

	var pt_ratio = fc.constants.PIXEL_TILE_RATIO;

	function draw_player(player, ctx) {
		var attributes = player.attributes,
			radius = attributes.radius,
			location = player.get_position(),
			x = location.x,
			y = location.y,
			rotation = player.get_angle();

		ctx.save();
		ctx.scale(pt_ratio, pt_ratio);
		ctx.translate(x,y);
		ctx.rotate(rotation);

		//A circle
		ctx.fillStyle = "yellow";
		ctx.beginPath();
		ctx.arc(0, 0, radius,0,Math.PI*2,true); //Full circle
		ctx.fill();


		//A line to indicate direction
		ctx.strokeStyle = "black";
		ctx.lineWidth = 1.0/pt_ratio;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(radius, 0);
		ctx.stroke();

		ctx.restore();
	};

	fc._draw_player = draw_player;
})(FistiCode);
