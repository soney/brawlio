(function(BrawlIO) {
	var _ = BrawlIO._;
	var BrawlDialog = {
		options: {
			my_code: ""
			, opponent_code: ""
			, bot1_name: "Yellow"
			, bot2_name: "Green"
			, game_log: undefined
			, title: "Brawl"
			, on_game_over: function(event) {}
			, console: false
			, debug: false
		}

		, _create: function() {
			var self = this;
			var game_log = this.option("game_log");

			if(game_log === undefined) {
				var bots = this.option("bots");
				var bot1_name = this.option("bot1_name");
				var bot2_name = this.option("bot2_name");

				var brawl = BrawlIO.create("brawl", {
					teams: [ {
							name: "Me"
							, players: [{
								code: this.option("my_code")
							}]
							, colors: ["yellow"]
							, win_text: bot1_name + " wins"
						} , {
							name: "Opponent"
							, players: [{
								code: this.option("opponent_code")
							}]
							, colors: ["#32CD32"]
							, win_text: bot2_name + " wins"
						}
					]
					, map: {
						width: 50
						, height: 50
					}
					, round_limit: 40
					, debug_mode: this.option("debug")
					, logging: this.option("console")
				});
				this.brawl = brawl;

				var on_game_over = this.option("on_game_over");
				this.brawl.run(function(winner, forced) {
					on_game_over({
						type: "game_over"
						, winner: winner
						, brawl: self.brawl
						, forced: forced
					});
				});

				game_log = this.brawl.get_game_log();
			}

			this.dialog_element = $("<div />");

			this.replay_element = $("<div />").appendTo(this.dialog_element).replay_viewer({
				game_log: game_log
				, debug: this.option("debug")
			});

			this.dialog_element.dialog({
				modal: true
				, resizable: false
				, draggable: true
				, title: this.option("title")
				, width: this.replay_element.replay_viewer("get_width") + 40
				, height: this.replay_element.replay_viewer("get_height") + 60
				, beforeClose: function() {
					_.defer(function() {
						self.destroy();
					});
					return false;
				}
				//, position: 'top'
			});

			this.console_title = $("<div />").addClass("console_title").text("Console");
			this.console_div = $("<div />").addClass("brawl_console");
			this.inner_console = $("<div />").appendTo(this.console_div);

			if(this.option("console")) {
				var console_height = 100;
				this.dialog_element.append(this.console_title).append(this.console_div);
				this.console_div.css("max-height", console_height+"px").height(console_height);
				this.dialog_element.dialog("option", "height", this.replay_element.replay_viewer("get_height") + 60 + console_height + this.console_title.height() + 10);
				game_log.on("console", $.proxy(this.on_console, this));
			}
		}

		, destroy: function() {
			this.console_div.remove();
			if(this.hasOwnProperty("brawl")) {
				this.brawl.terminate();
			}
			this.replay_element.replay_viewer("destroy");
			this.dialog_element.dialog("destroy")
								.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}
		, on_console: function(event) { 
			var game_event = event.game_event;
			var player = game_event.player;
			var team = player.get_team();
			if(team.name === "Me") {
				var console_row = $("<div />").console_row({
					log_event: game_event
				}).appendTo(this.inner_console);

				var scrollable = this.console_div;
				var inner = this.inner_console;
				
				var atBottom = Math.ceil(scrollable.height() - inner.offset().top + scrollable.offset().top) + 20 >= inner.outerHeight();
				
				if ( atBottom ) {
				  scrollable.animate({ scrollTop: inner.outerHeight() });
				}
			}
		}
	};

	$.widget("brawlio.brawl_dialog", BrawlDialog);

	$.widget("brawlio.console_row", {
		options: {
			log_event: undefined
		}

		, _create: function() {
			var self = this;
			var log_event = this.option("log_event");
			this.element.addClass("console_row");
			if(log_event.log_type === "log") {
				this.element.addClass("log");
			} else if(log_event.log_type === "error") {
				this.element.addClass("error");
			}
			this.round_display = $("<span />").addClass("round")
												.html("Round&nbsp;"+(new Number(log_event.round)).toFixed(1)+"")
												.appendTo(this.element);
			this.arg_spans = [];

			_.forEach(log_event.args, function(arg, index) {
				_.forEach(this.get_arg_spans(arg), function(arg_span) {
					this.element.append(arg_span);
					this.arg_spans.push(arg_span);
				}, this);

				if(index < log_event.args.length - 1) {
					this.element.append($("<span />").text(",").addClass("comma arg_separator"));
				}
			}, this);
		}

		, destroy: function() {
			_.forEach(this.arg_spans, function(arg_span) {
				arg_span.remove();
			});
			this.round_display.remove();
			
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, get_arg_spans: function(arg) {
			var rv = [];
			if(_.isArray(arg)) {
				rv.push($("<span />").text("[").addClass("arg_separator"));
				_.forEach(arg, function(arg_element, index) {
					rv.push($("<span />").text(index+":").addClass("arg_separator"));
					rv.push(this.get_arg_spans(arg_element));
					if(index < _.size(arg) - 1) {
						rv.push($("<span />").text(",").addClass("comma arg_separator"));
					}
				}, this);
				rv.push($("<span />").text("]").addClass("arg_separator"));
			} else if(_.isObject(arg)) {
				rv.push($("<span />").text("{").addClass("arg_separator"));
				var index = 0;
				_.forEach(arg, function(arg_element, prop_name) {
					rv.push($("<span />").text(prop_name+":").addClass("arg_separator"));
					rv.push(this.get_arg_spans(arg_element));
					if(index < _.size(arg) - 1) {
						rv.push($("<span />").text(",").addClass("arg_separator"));
					}
					index++;
				}, this);
				rv.push($("<span />").text("}").addClass("arg_separator"));
			} else {
				if(_.isString(arg)) {
					arg = "&quot;"+arg+"&quot;";
				} else if(arg === undefined) {
					arg = "undefined";
				} else if(arg === null) {
					arg = "null";
				} else if(_.isNaN(arg)) {
					arg = "NaN";
				}
				rv.push($("<span />").html(arg));
			}
			return _.flatten(rv);
		}
	});
}(BrawlIO));
