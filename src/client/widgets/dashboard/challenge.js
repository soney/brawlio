(function(BrawlIO) {
	var Challenge = {
		options: {
		}

		, _create: function() {
			var element = this.element;
			element.addClass("challenge");

			var self = this;
			BrawlIO.get_all_bots(function(bots) {
				self.update_bots(bots);
			});
			this.class_col = $("<div />")	.addClass("column")
											.appendTo(element);

			this.class_bot_col = $("<div />")	.addClass("column")
												.appendTo(element);

			this.challenge_col = $("<div />")	.addClass("final column")
												.appendTo(element);

		}

		, destroy: function() {
			this.class_col.remove();
			this.class_bot_col.remove();
			this.challenge_col.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, on_select_class: function(class_name, row) {
			var other_rows = $("> div.row", this.class_col).not(row);
			other_rows.removeClass("selected").addClass("not_selected");
			row.removeClass("not_selected").addClass("selected");

			this.class_bot_col.children().remove();
			var bots = this.sorted_bots[class_name];

			for(var i = 0; i<bots.length; i++) {
				var bot = bots[i];

				var bot_row = $("<div />")	.addClass("bot row")
											.appendTo(this.class_bot_col);
				var bot_link = $("<a />")	.attr("href", "javascript:void(0)")
											.appendTo(bot_row)
											.text(bot.name)
											.on("click", $.proxy(this.on_select_bot, this, bot, bot_row));

				var rating_str = bot.rated === false ? "Unrated" : bot.rating;
				var bot_rating = $("<span />")	.addClass("rating")
												.text(rating_str)
												.appendTo(bot_link);
			}
			this.challenge_col.children().remove();
		}

		, on_select_bot: function(bot, row) {
			var other_rows = $("> .row", this.class_bot_col).not(row);
			row.addClass("selected").removeClass("not_selected");
			other_rows.addClass("not_selected").removeClass("selected");
			this.challenge_col.children().remove();

			var bot_title = $("<div />")	.appendTo(this.challenge_col)
											.addClass("bot_title")
											.text(bot.name);
			var challenge_button = $("<a />")	.attr("href", "javascript:void(0)")
												.appendTo(this.challenge_col)
												.addClass("button")
												.text("Challenge");

		}

		, update_bots: function(bots) {
			this.set_bots(bots);
			var class_names = BrawlIO.get_class_names();
			this.class_col.children().remove();
			var all_row = $("<div />")	.addClass("row all")
										.appendTo(this.class_col);
			var all_link = $("<a />")	.attr("href", "javascript:void(0)")
										.appendTo(all_row)
										.text("All")
										.on("click", $.proxy(this.on_select_class, this, "All", all_row));
			var all_count = $("<span />").addClass("count")
											.text("("+bots.length+")")
											.appendTo(all_link);
			this.on_select_class("All", all_row);
										
			for(var i = 0; i<class_names.length; i++) {
				var class_name = class_names[i];

				var class_bots = this.sorted_bots[class_name];
				if(class_bots.length === 0) { continue; }
				var row = $("<div />")	.addClass("row")
										.appendTo(this.class_col);
				var class_link = $("<a />")	.attr("href", "javascript:void(0)")
											.appendTo(row)
											.text(class_name)
											.on("click", $.proxy(this.on_select_class, this, class_name, row));
				var count = $("<span />")	.addClass("count")
											.text("("+class_bots.length+")")
											.appendTo(class_link);
			}
		}

		, set_bots: function(bots) {
			this.bots = bots.sort(function(bot1,bot2) {
				return bot1.rating > bot2.rating;
			});

			this.sorted_bots = {
				"All": []
			};

			var class_names = BrawlIO.get_class_names();
			for(var i = 0; i<class_names.length; i++) {
				var class_name = class_names[i];
				this.sorted_bots[class_name] = [];
			}

			for(var i = 0; i<this.bots.length; i++) {
				var bot = this.bots[i];
				this.sorted_bots["All"].push(bot);
				if(bot.rated === false) {
					this.sorted_bots["Unrated"].push(bot);
				} else {
					var class_name = BrawlIO.get_class_name(bot.rating);
					this.sorted_bots[class_name].push(bot);
				}
			}
		}
	};

	$.widget("brawlio.challenge", Challenge);
}(BrawlIO));
