(function(BrawlIO) {
	var Challenge = {
		options: {
		}

		, _create: function() {
			var element = this.element;
			element.addClass("challenge");

			var self = this;
			BrawlIO.get_all_bots(function(bots) {
				BrawlIO.get_all_users(function(users) {
					self.update_bots(bots, users);
				});
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

		, on_select_class: function(class_name, row, users) {
			var other_rows = $("> div.row", this.class_col).not(row);
			other_rows.removeClass("selected").addClass("not_selected");
			row.removeClass("not_selected").addClass("selected");

			this.class_bot_col.children().remove();
			var bots = this.sorted_bots[class_name];

			for(var i = 0; i<bots.length; i++) {
				var bot = bots[i];

				var owner;
				for(var j = 0; j<users.length; j++) {
					var user = users[j];
					if(user.id === bot.user_fk) {
						owner = user;
						break;
					}
				}
				var owner_name = owner === undefined ? "" : owner.username+"/"

				var bot_row = $("<div />")	.addClass("bot row")
											.appendTo(this.class_bot_col);
				var bot_link = $("<a />")	.attr("href", "javascript:void(0)")
											.appendTo(bot_row)
											.text(owner_name+bot.name)
											.on("click", $.proxy(this.on_select_bot, this, bot, bot_row, owner));

				var rating_str = bot.rated === false ? "Unrated" : (bot.rating + " " + BrawlIO.get_class_name(bot.rating));
				var bot_rating = $("<span />")	.addClass("rating")
												.text(rating_str)
												.appendTo(bot_link);
			}
			this.challenge_col.children().remove();
		}

		, on_select_bot: function(bot, row, owner) {
			var owner_name = owner === undefined ? "" : owner.username+"/"
			var other_rows = $("> .row", this.class_bot_col).not(row);
			row.addClass("selected").removeClass("not_selected");
			other_rows.addClass("not_selected").removeClass("selected");
			this.challenge_col.children().remove();

			var rating_text;
			if(bot.rated === false ) {
				rating_text = "Unrated";
			} else {
				rating_text = bot.rating + "(" + BrawlIO.get_class_name(bot.rating) + ")";
			}

			var record_text = bot.wins + " wins, " + bot.losses + " losses, " + bot.draws + " draws";

			var bot_subtitle = record_text + "; " + rating_text;

			var bot_title = $("<div />")	.appendTo(this.challenge_col)
											.addClass("bot_title")
											.text(owner_name+bot.name);
			var but_subtitle = $("<div />")	.appendTo(this.challenge_col)
											.addClass("bot_subtitle")
											.text(bot_subtitle);

			var self = this;
			var challenge_button = $("<a />")	.attr("href", "javascript:void(0)")
												.appendTo(this.challenge_col)
												.addClass("button")
												.text("Challenge")
												.on("click", function() {
													self.element.trigger({
														type: "challenge"
														, opponent_id: bot.id
													});
												});
			
		}

		, update_bots: function(bots, users) {
			this.set_bots(bots);
			var class_names = BrawlIO.get_class_names();
			this.class_col.children().remove();
			var all_row = $("<div />")	.addClass("row all")
										.appendTo(this.class_col);
			var all_link = $("<a />")	.attr("href", "javascript:void(0)")
										.appendTo(all_row)
										.text("All")
										.on("click", $.proxy(this.on_select_class, this, "All", all_row, users));
			var all_count = $("<span />").addClass("count")
											.text("("+this.sorted_bots["All"].length+")")
											.appendTo(all_link);
			this.on_select_class("All", all_row, users);
										
			for(var i = 0; i<class_names.length; i++) {
				var class_name = class_names[i];

				var class_bots = this.sorted_bots[class_name];
				if(class_bots.length === 0) { continue; }
				var row = $("<div />")	.addClass("row")
										.appendTo(this.class_col);
				var class_link = $("<a />")	.attr("href", "javascript:void(0)")
											.appendTo(row)
											.text(class_name)
											.on("click", $.proxy(this.on_select_class, this, class_name, row, users));
				var count = $("<span />")	.addClass("count")
											.text("("+class_bots.length+")")
											.appendTo(class_link);
			}
		}

		, set_bots: function(bots) {
			this.bots = bots.sort(function(bot1,bot2) {
				return bot1.rating > bot2.rating;
			}).filter(function(bot) {
				return bot.user_fk !== BrawlIO.user.id;
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
