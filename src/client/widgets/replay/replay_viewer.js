(function(BrawlIO) {
	var _ = BrawlIO._;
	var enter_leave = function(set, on_enter, on_leave) {
		var count = 0;
		set.mouseover(function() {
			count++;
			defer_update();
		});
		set.mouseout(function() {
			count--;
			defer_update();
		});
		var deferring_update = false;
		var defer_update = function() {
			if(deferring_update === false) {
				deferring_update = true;
				_.defer(function() {
					update();
					deferring_update = false;
				});
			}
		};
		var update = function() {
			if(count%2 === 0) {
				on_leave();
			} else {
				on_enter();
			}
		};
	};
	var ControlBar = function(options) {
		this.paper = options.paper;
		this.minimized_scrub_height = options.minimized_scrub_height;
		this.maximized_scrub_height = options.maximized_scrub_height;
		this.control_height = options.control_height;
		this.width = options.width;
		this.bottom = options.bottom;
		this.element = options.element;

		this.loaded_percentage = 1.0;
		this.played_percentage = 0.0;
		this.initialize();
	};
	(function(my) {
		var proto = my.prototype;
		proto.initialize = function() {
			this.scrubbing = false;
			this.hover_paper = false;

			this.create_control_bar();
			this.create_scrub_rects();
			this.create_scrub_handle();
			this.make_draggable();
			this.set_loaded_percentage(this.loaded_percentage);
			this.set_played_percentage(this.played_percentage);
		};
		proto.create_control_bar = function() {
			//Will be hidden by virtue of setting the top property to bottom
			this.control_bar = this.paper.rect(0, this.bottom, this.width, this.control_height).attr({
				fill: "#333" , stroke: "none"
			});
		};
		proto.create_scrub_rects = function() {
			this.paper.setStart();
			this.background_rect = this.paper.rect(0, this.bottom  - this.minimized_scrub_height, this.width, this.minimized_scrub_height).attr({
										fill: "#444" , stroke: "none"
									});
			this.loaded_rect = this.paper.rect(0, this.bottom  - this.minimized_scrub_height, 0, this.minimized_scrub_height).attr({
										fill: "#777" , stroke: "none"
									});
			this.played_rect = this.paper.rect(0, this.bottom  - this.minimized_scrub_height, 0, this.minimized_scrub_height).attr({
										fill: "#F00" , stroke: "none"
									});
			this.scrub_rects = this.paper.setFinish();
			this.element.hover(_.bind(this.on_hover_in, this), _.bind(this.on_hover_out, this));
		};
		proto.create_scrub_handle = function() {
			this.paper.setStart();
			this.slider_radius = this.maximized_scrub_height / 2 + 3;
			this.outer_scrub_radius = this.slider_radius;
			this.outer_scrub_circle = this.paper.circle(0, this.bottom - this.control_height - (this.maximized_scrub_height/2), this.outer_scrub_radius).attr({
				fill: "#AAA"
				, stroke: "none"
			});

			this.inner_scrub_radius = this.outer_scrub_radius / 2.5;
			this.inner_scrub_circle = this.paper.circle(0, this.bottom - this.control_height - (this.maximized_scrub_height/2), this.inner_scrub_radius).attr({
				fill: "#777"
				, stroke: "none"
			});

			this.scrub_slider = this.paper.setFinish();
			this.scrub_slider.hide();
		};
		proto.make_draggable = function() {
			var drag_start_x;
			var self = this;

			var scrub_to = function(x) {
				var handle_radius = self.outer_scrub_radius;
				var percentage = (x - handle_radius) / (self.width - 2*handle_radius);

				if(percentage < 0) { percentage = 0; }
				else if(percentage > self.loaded_percentage) { percentage = self.loaded_percentage; }
				else if(percentage > 1.0) { percentage = 1.0; }

				self.set_played_percentage(percentage);
			};

			this.scrub_slider.drag(function(dx, dy, x, y, event) {
				var drag_x = drag_start_x + dx;
				scrub_to(drag_x);
			}, function(x, y, event) {
				console.log(x);
				drag_start_x = x;
				self.scrubbing = true;
				scrub_to(drag_start_x);
			}, function(event) {
				self.scrubbing = false;
				if(!self.hover_paper) {
					self.on_hover_out();
				}
			});

			this.scrub_rects.drag(function(dx, dy, x, y, event) {
				var drag_x = drag_start_x + dx;
				console.log(drag_x);
				scrub_to(drag_x);
			}, function(x, y, event) {
				var offset_x = event.offsetX;
				drag_start_x = offset_x;
				self.scrubbing = true;
				scrub_to(drag_start_x);
			}, function(event) {
				self.scrubbing = false;
				if(!self.hover_paper) {
					self.on_hover_out();
				}
			});

		};
		proto.on_hover_in = function() {
			this.hover_paper = true;
			if(this.scrubbing) {
				return;
			}
			var anim = Raphael.animation({
				y: this.bottom - this.maximized_scrub_height - this.control_height
				, height: this.maximized_scrub_height
			}, 100, "ease-in-out");
			this.scrub_rects.animate(anim);
			this.control_bar.animate({
				y: this.bottom - this.control_height
			}, 100, "ease-in-out");

			this.scrub_slider.show();
			this.scrub_slider.attr({
				cy: this.bottom - this.minimized_scrub_height/2
			}).animate({
				cy: this.bottom - this.control_height - (this.maximized_scrub_height/2)
			}, 100, "ease-in-out");
		};
		proto.on_hover_out = function() {
			this.hover_paper = false;
			if(this.scrubbing) {
				return;
			}
			var anim = Raphael.animation({
				y: this.bottom - this.minimized_scrub_height
				, height: this.minimized_scrub_height
			}, 100, "ease-in-out");
			this.scrub_rects.animate(anim);
			this.scrub_slider.hide();
			this.control_bar.animate({
				y: this.bottom
			}, 100, "ease-in-out");
		};
		proto.set_loaded_percentage = function(percentage) {
			this.loaded_rect.animate({
				width: this.width * percentage
			});
			this.loaded_percentage = percentage;
		};
		proto.set_played_percentage = function(percentage) {
			var slider_radius = this.slider_radius;
			var width = this.width * percentage;
			this.played_rect.animate({
				width: width
			});

			var slider_position = slider_radius + (this.width - 2*slider_radius) * percentage;
			this.scrub_slider.attr("transform", "t"+slider_position+",0");
			this.played_percentage = percentage;
		};
	}(ControlBar));

	var create_control_bar = function(options) { return new ControlBar(options); };

	var ReplayViewer = {
		options: {
			replay: undefined
			, pixels_per_tile: 4 
			, minimized_scrub_height: 4
			, maximized_scrub_height: 10
			, control_height: 20
		}

		, _create: function() {
			var element = this.element;

			this.paper = Raphael(element[0], 1, 1);

			this.initialize();
		}

		, destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments);
			this.paper.clear();
		}

		, initialize: function() {
			var replay = this.option("replay")
				, pixels_per_tile = this.option("pixels_per_tile")
				, minimized_scrub_height = this.option("minimized_scrub_height")
				, control_height = this.option("control_height");
			var map = replay.get_map()
				, map_width = map.get_width()
				, map_height = map.get_height();
			this.paper.setSize(map_width * pixels_per_tile, map_height * pixels_per_tile + minimized_scrub_height);

			this.paper.rect(0, 0, map_width * pixels_per_tile, map_height * pixels_per_tile, 0).attr({
				fill: "#337"
				, stroke: "none"
			});
			this.progress_bar = create_control_bar({
				paper: this.paper
				, minimized_scrub_height: this.option("minimized_scrub_height")
				, maximized_scrub_height: this.option("maximized_scrub_height")
				, control_height: this.option("control_height")
				, width: map_width * pixels_per_tile
				, bottom: map_height * pixels_per_tile + minimized_scrub_height
				, element: this.element
			});
		}
	};

	$.widget("brawlio.replay_viewer", ReplayViewer);
}(BrawlIO));
