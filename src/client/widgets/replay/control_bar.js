(function(BrawlIO) {
	var _ = BrawlIO._;
	var enter_leave = function(set, on_enter, on_leave) {
		var count = 0;
		var was_hovering = false;
		var on_mouse_over = function() {
			count++;
			defer_update();
		};
		var on_mouse_out = function() {
			count--;
			if(count<0) { count = 0; } //for situations where the mouse started hovered over the element
			defer_update();
		};
		set.mouseover(on_mouse_over);
		set.mouseout(on_mouse_out);
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
				if(was_hovering) {
					on_leave();
					was_hovering = false;
				}
			} else {
				if(!was_hovering) {
					on_enter();
					was_hovering = true;
				}
			}
		};
		var remove_listeners = function() {
			set.unmouseover(on_mouse_over);
			set.unmouseout(on_mouse_out);
		};

		return remove_listeners;
	};

	var get_play_path = function(width, height) {
		var rv = ["M", 0, 0
				, "L", width, height/2
				, "L", 0, height
				, "Z"
				];
		return rv.join(" ");
	};
	var get_pause_path = function(width, height) {
		var rv = ["M", 0, 0
				, "H", width/3
				, "V", height
				, "H", 0
				, "Z"
				, "M", 2*width/3, 0
				, "H", width
				, "V", height
				, "H", 2*width/3
				, "Z"
				];
		return rv.join(" ");
	};
	var get_rewind_path = function(width, height) {
		var rv = ["M", 0, height/2
				, "L", width/2, 0
				, "V", height
				, "Z"
				, "M", width/2, height/2
				, "L", width, 0
				, "V", height
				, "Z"
				];
		return rv.join(" ");
	};

	var ControlBarButton = function(options) {
		this.paper = options.paper;
		this.width = options.width;
		this.height = options.height;
		this.icon_width = options.icon_width;
		this.icon_height = options.icon_height;

		BrawlIO.make_listenable(this);
		this.initialize();
		this.set_path(options.get_path);
	};
	(function(my) {
		var proto = my.prototype;
		var idle_color = "#777";
		var hover_color = "#CCC";
		proto.initialize = function() {
			this.paper.setStart();
			this.background_rect = this.paper.rect(0, 0, this.width, this.height).attr({
				stroke: "none", fill: "#444"
			});
			this.set = this.paper.setFinish();
		};
		proto.remove_handlers = function() {
			if(this.hasOwnProperty("__remove_hover")) {
				this.__remove_hover();
				delete this.__remove_hover;
			}
			if(this.hasOwnProperty("__remove_mousedown")) {
				this.__remove_mousedown();
				delete this.__remove_mousedown;
			}
		};
		proto.add_handlers = function() {
			var self = this;
			this.__remove_hover = enter_leave(this.set, function() {
				self.set_fill_color(hover_color);
			}, function() {
				self.set_fill_color(idle_color);
			});

			var mousedown_fn = function(event) {
				this.emit({
					type: "click"
					, target: this
				});
				event.preventDefault();
				event.stopPropagation();
			};
			this.set.mousedown(mousedown_fn, this);
			this.__remove_mousedown = function() {
				this.set.unmousedown(mousedown_fn);
			};
		};
		proto.set_path = function(get_path_fn) {
			this.remove_handlers();
			if(this.hasOwnProperty("path")) {
				this.set.exclude(this.path);
				this.path.remove();
			}
			this.path = this.paper.path(get_path_fn(this.icon_width, this.icon_height));
			this.path.attr("transform", this.background_rect.attr("transform"));
			this.path.translate((this.width-this.icon_width)/2, (this.height-this.icon_height)/2);
			this.set.push(this.path);

			this.path.attr({ stroke: "none" , fill: idle_color});
			this.add_handlers();
		};
		proto.set_fill_color = function(color) {
			this.path.animate({fill: color}, 100, "ease-in-out");
		};
		proto.get_set = function() {
			return this.set;
		};
		proto.animate_translate_to = function(x, y, duration, easing) {
			var offset_x = (this.width - this.icon_width)/2;
			var offset_y = (this.height - this.icon_height)/2;
			this.background_rect.animate({
				transform: "t"+(x)+","+(y)
			}, duration, easing);
			this.path.animate({
				transform: "t"+(x+offset_x)+","+(y+offset_y)
			}, duration, easing);
		};
	}(ControlBarButton));
	var create_control_bar_button = function(options) {
		return new ControlBarButton(options);
	};

	var ControlBar = function(options) {
		this.paper = options.paper;
		this.minimized_scrub_height = options.minimized_scrub_height;
		this.maximized_scrub_height = options.maximized_scrub_height;
		this.control_height = options.control_height;
		this.width = options.width;
		this.bottom = options.bottom;
		this.element = options.element;

		this.loaded_percentage = 0.0;
		this.played_percentage = 0.0;
		BrawlIO.make_listenable(this);
		this.initialize();
	};
	(function(my) {
		var proto = my.prototype;
		proto.initialize = function() {
			this.scrubbing = false;
			this.hover_paper = false;
			this.hover_scrub_handle = false;

			this.create_control_bar();
			this.create_text();
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
			this.play_button = create_control_bar_button({
				paper: this.paper
				, left: 0
				, top: this.bottom - this.control_height
				, width: 2*this.control_height
				, height: this.control_height
				, icon_width: 3*this.control_height/5
				, icon_height: 3*this.control_height/5
				, get_path: get_play_path
			});
			this.play_button.get_set().translate(0, this.bottom);

			this.play_button.on("click", function() {
				this.emit({
					type: "play_button_click"
					, target: this
					, original_target: this.play_button
				});
			}, this);
		};
		proto.show_play_button = function() {
			this.play_button.set_path(get_play_path);
		};
		proto.show_pause_button = function() {
			this.play_button.set_path(get_pause_path);
		};
		proto.show_rewind_button = function() {
			this.play_button.set_path(get_rewind_path);
		};
		proto.create_text = function() {
			var attr = {font: "12px Helvetica", opacity: 1.0, "text-anchor": "start"};
			this.paper.setStart();
			this.on_round = this.paper.text(2 * this.control_height + 10, 0, "").attr(attr).attr({"font-weight": "strong", fill: "white"});
			this.round_count = this.paper.text(2 * this.control_height + 10, 0, "").attr(attr).attr({fill: "#888"});
			this.text = this.paper.setFinish();
			this.text.attr("y", this.bottom + this.control_height/2);
		};
		proto.set_round_text = function(text, gap) {
			this.on_round.attr("text", text);
			var bbox = this.on_round.getBBox();
			var width = bbox.width;
			gap = gap || 1;
			this.round_count.attr("x", bbox.x + bbox.width + gap);
		};
		proto.set_max_text = function(text, gap) {
			this.round_count.attr("text", text);
			var bbox = this.on_round.getBBox();
			var width = bbox.width;
			gap = gap || 1;
			this.round_count.attr("x", bbox.x + bbox.width + gap);
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

			this.scrub_handle = this.paper.setFinish();
			var self = this;
			enter_leave(this.scrub_handle, _.bind(this.on_enter_scrub_handle, this), _.bind(this.on_leave_scrub_handle, this));
			this.scrub_handle.hide();
		};
		proto.on_enter_scrub_handle = function() {
			this.hover_scrub_handle = true;
			this.inner_scrub_circle.animate({
				fill: "#F00"
			}, 200, "ease-out");
		};
		proto.on_leave_scrub_handle = function() {
			this.hover_scrub_handle = false;
			if(!this.scrubbing) {
				this.inner_scrub_circle.animate({
					fill: "#777"
				}, 200, "ease-out");
			}
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

				self.set_own_played_percentage(percentage);
			};

			var on_scrub_start = function() {
				self.inner_scrub_circle.attr({fill: "#F00"});
				self.scrubbing = true;
				self.emit({
					type: "scrub_start"
				});
			};
			var on_scrub_end = function() {
				self.scrubbing = false;
				if(!self.hover_paper) {
					self.on_hover_out();
				}
				if(!self.hover_scrub_handle) {
					self.on_leave_scrub_handle();
				}
				self.emit({
					type: "scrub_stop"
				});
			};

			this.scrub_handle.drag(function(dx, dy, x, y, event) {
				var drag_x = drag_start_x + dx;
				scrub_to(drag_x);
			}, function(x, y, event) {
				var offset_x = event.offsetX;
				drag_start_x = offset_x;
				scrub_to(drag_start_x);
				on_scrub_start();
			}, function(event) {
				on_scrub_end();
			});

			this.scrub_rects.drag(function(dx, dy, x, y, event) {
				var drag_x = drag_start_x + dx;
				scrub_to(drag_x);
			}, function(x, y, event) {
				var offset_x = event.offsetX;
				drag_start_x = offset_x;
				scrub_to(drag_start_x);
				on_scrub_start();
			}, function(event) {
				on_scrub_end();
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

			this.scrub_handle.show();
			this.scrub_handle.animate({
				cy: this.bottom - this.control_height - (this.maximized_scrub_height/2)
			}, 100, "ease-in-out");
			this.play_button.animate_translate_to(0, this.bottom-this.control_height, 100, "ease-in-out")

			this.text.animate({
				y: this.bottom - this.control_height/2
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
			this.scrub_handle.hide();
			this.scrub_handle.animate({
				cy: this.bottom - this.minimized_scrub_height/2
			}, 100, "ease-in-out");
			this.control_bar.animate({
				y: this.bottom
			}, 100, "ease-in-out");
			this.play_button.animate_translate_to(0, this.bottom, 100, "ease-in-out")
			this.text.animate({
				y: this.bottom + this.control_height/2
			}, 100, "ease-in-out");
		};
		proto.set_loaded_percentage = function(percentage) {
			this.loaded_rect.animate({
				width: this.width * percentage
			});
			this.loaded_percentage = percentage;
		};
		proto.set_own_played_percentage = function(percentage) {
			this.set_played_percentage(percentage);
			this.emit({
				type: "played_percentage_set"
				, percentage: percentage
			});
		};
		proto.set_played_percentage = function(percentage) {
			var slider_radius = this.slider_radius;
			var width = this.width * percentage;
			this.played_rect.animate({
				width: width
			});

			var slider_position = slider_radius + (this.width - 2*slider_radius) * percentage;
			this.scrub_handle.attr("transform", "t"+slider_position+",0");
			this.played_percentage = percentage;
		};
	}(ControlBar));

	var create_control_bar = function(options) { return new ControlBar(options); };

	BrawlIO.create_replay_control_bar = create_control_bar;
}(BrawlIO));
