(function(FistiCode) {
	var fc = FistiCode;

	var pt_ratio = fc.constants.PIXEL_TILE_RATIO;

	function draw_map(map, ctx) {
		ctx.save();
		ctx.scale(pt_ratio, pt_ratio);
		ctx.fillStyle = "navy";
		ctx.fillRect(0, 0, map.attributes.width, map.attributes.height);
		ctx.restore();
	};

	fc._draw_map = draw_map;
})(FistiCode);
