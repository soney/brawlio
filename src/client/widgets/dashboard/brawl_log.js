(function(BrawlIO) {
	var _ = BrawlIO._;
	$.widget("brawlio.brawl_log", {
		options: {
			bot_id: undefined
			, shore_more_adds: 15
			, initial_count: 10
		}
		, _create: function() {
			var self = this;
			this.brawl_rows = [];
			this.brawls = $("<div />").appendTo(this.element);
			this.show_more_button = $("<a />")	.attr("href", "javascript:void(0)")
												.text("(earlier)");
			this.show_more = $("<div />")	.addClass("wide_button")
											.append(this.show_more_button)
											.appendTo(this.element);
			this.show_more_button.on("click.show_more", $.proxy(this.show_more_logs, this));
			this.add_brawls();

			var bot_id = this.option("bot_id");
			var initial_count = this.option("initial_count");

			BrawlIO.get_bot_brawls(bot_id, initial_count, function(brawls) {
				_.forEach(brawls, function(brawl) {
					BrawlIO.add_brawl(brawl);
				});
				self.refresh();
			});
		}
		, destroy: function() {
			this.clear();
			this.brawls.remove();
			this.show_more_button.off("click.show_more");
			this.show_more.remove();
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, refresh: function() {
			this.clear();
			this.add_brawls();
		}
		, clear: function() {
			_.forEach(this.brawl_rows, function(brawl_row) {
				brawl_row.brawl_log_row("destroy");
				brawl_row.remove();
			});
			this.brawl_rows = [];
		}
		, add_brawls: function() {
			var bot_id = this.option("bot_id");
			var brawls = BrawlIO.get_brawls_for_bot_id(bot_id);
			_.forEach(brawls, function(brawl) {
				var row = $("<div />").appendTo(this.brawls);
				row.brawl_log_row({
					brawl: brawl
					, my_bot_id: bot_id
				});
				this.brawl_rows.push(row);

			}, this);
			var num_brawls = brawls.length;
			var bot = BrawlIO.get_bot_by_id(bot_id);
			var tot_brawls = bot.wins + bot.losses + bot.draws;
			if(tot_brawls <= num_brawls) {
				this.show_more.hide();
			}
		}
		, show_more_logs: function() {
			var bot_id = this.option("bot_id");
			var show_more_adds = this.option("shore_more_adds");
			var brawls = BrawlIO.get_brawls_for_bot_id(bot_id);

			var total_count = show_more_adds + brawls.length;
			var self = this;
			BrawlIO.get_bot_brawls(bot_id, total_count, function(brawls) {
				_.forEach(brawls, function(brawl) {
					BrawlIO.add_brawl(brawl);
				});
				self.refresh();
			});
		}
	});

	$.widget("brawlIO.brawl_log_row", {
		options: {
			brawl: undefined
			, my_bot_id: undefined
		}
		, _create: function() {
			var brawl = this.option("brawl");
			var my_bot_id = this.option("my_bot_id");

			this.element.addClass("brawl_row");

			var date = new Date(brawl.date);
			var date_str = format_date(date, "n/j/y g:ia");

			var bot1_name = brawl.user1_name + "/" + brawl.bot1_name;
			var bot2_name = brawl.user2_name + "/" + brawl.bot2_name;

			var bot1_rating = brawl.bot1_pre_rating === 0 ? "Unrated" : brawl.bot1_pre_rating;
			var bot2_rating = brawl.bot2_pre_rating === 0 ? "Unrated" : brawl.bot2_pre_rating;

			var is_draw = brawl.winner_fk === null;
			var i_won = !is_draw && brawl.winner_fk === my_bot_id;

			var win_text, win_class;
			if(is_draw) {
				win_text = "T"; win_class = "draw";
			} else if (i_won) {
				win_text = "W"; win_class = "win";
			} else {
				win_text = "L"; win_class = "loss";
			}

			this.date = $("<span />")	.addClass("date")
										.text(date_str)
										.appendTo(this.element);
			this.bot1_rating = $("<span />").addClass("rating")
											.text("("+bot1_rating+")");
			this.bot1 = $("<span />")	.addClass("bot")
										.text(bot1_name)
										.append("&nbsp;")
										.append(this.bot1_rating)
										.appendTo(this.element);

			this.vs_span = $("<span />").addClass("vs")
										.text("vs.")
										.appendTo(this.element);

			this.bot2_rating = $("<span />").addClass("rating")
											.text("("+bot2_rating+")");
			this.bot2 = $("<span />")	.addClass("bot")
										.text(bot2_name)
										.append("&nbsp;")
										.append(this.bot2_rating)
										.appendTo(this.element);

			if(brawl.winner_fk === brawl.bot1_fk) {
				this.bot1.addClass("winner");
			} else if(brawl.winner_fk === brawl.bot2_fk) {
				this.bot2.addClass("winner");
			}


			this.replay_button = $("<a />")	.attr("href", "javascript:void(0)")
											.text("replay");
											
			this.replay = $("<span />")	.addClass("replay")
										.append(this.replay_button)
										.appendTo(this.element);

			this.result = $("<span />")	.addClass("result")
										.addClass(win_class)
										.text(win_text)
										.appendTo(this.element);

			this.replay_button.on("click.replay_show", $.proxy(this.show_replay, this));
		}
		, destroy: function() {
			this.replay_button.off("click.replay_show");
			$.Widget.prototype.destroy.apply(this, arguments);
		}

		, show_replay: function() {
			var brawl = this.option("brawl");
			BrawlIO.get_game_log(brawl.id, function(game_log) {
				$(window).brawl_dialog({
					game_log: game_log
				});
			});
		}
	});
	// Simulates PHP's date function
var format_date = function(date, format) {
    var returnStr = '';
    var replace = replaceChars;
    for (var i = 0; i < format.length; i++) {       var curChar = format.charAt(i);         if (i - 1 >= 0 && format.charAt(i - 1) == "\\") {
            returnStr += curChar;
        }
        else if (replace[curChar]) {
            returnStr += replace[curChar].call(date);
        } else if (curChar != "\\"){
            returnStr += curChar;
        }
    }
    return returnStr;
};

var replaceChars;
replaceChars = {
    shortMonths: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    longMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    shortDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    longDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

    // Day
    d: function() { return (this.getDate() < 10 ? '0' : '') + this.getDate(); },
    D: function() { return replaceChars.shortDays[this.getDay()]; },
    j: function() { return this.getDate(); },
    l: function() { return replaceChars.longDays[this.getDay()]; },
    N: function() { return this.getDay() + 1; },
    S: function() { return (this.getDate() % 10 == 1 && this.getDate() != 11 ? 'st' : (this.getDate() % 10 == 2 && this.getDate() != 12 ? 'nd' : (this.getDate() % 10 == 3 && this.getDate() != 13 ? 'rd' : 'th'))); },
    w: function() { return this.getDay(); },
    z: function() { var d = new Date(this.getFullYear(),0,1); return Math.ceil((this - d) / 86400000); }, // Fixed now
    // Week
    W: function() { var d = new Date(this.getFullYear(), 0, 1); return Math.ceil((((this - d) / 86400000) + d.getDay() + 1) / 7); }, // Fixed now
    // Month
    F: function() { return replaceChars.longMonths[this.getMonth()]; },
    m: function() { return (this.getMonth() < 9 ? '0' : '') + (this.getMonth() + 1); },
    M: function() { return replaceChars.shortMonths[this.getMonth()]; },
    n: function() { return this.getMonth() + 1; },
    t: function() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 0).getDate() }, // Fixed now, gets #days of date
    // Year
    L: function() { var year = this.getFullYear(); return (year % 400 == 0 || (year % 100 != 0 && year % 4 == 0)); },   // Fixed now
    o: function() { var d  = new Date(this.valueOf());  d.setDate(d.getDate() - ((this.getDay() + 6) % 7) + 3); return d.getFullYear();}, //Fixed now
    Y: function() { return this.getFullYear(); },
    y: function() { return ('' + this.getFullYear()).substr(2); },
    // Time
    a: function() { return this.getHours() < 12 ? 'am' : 'pm'; },
    A: function() { return this.getHours() < 12 ? 'AM' : 'PM'; },
    B: function() { return Math.floor((((this.getUTCHours() + 1) % 24) + this.getUTCMinutes() / 60 + this.getUTCSeconds() / 3600) * 1000 / 24); }, // Fixed now
    g: function() { return this.getHours() % 12 || 12; },
    G: function() { return this.getHours(); },
    h: function() { return ((this.getHours() % 12 || 12) < 10 ? '0' : '') + (this.getHours() % 12 || 12); },
    H: function() { return (this.getHours() < 10 ? '0' : '') + this.getHours(); },
    i: function() { return (this.getMinutes() < 10 ? '0' : '') + this.getMinutes(); },
    s: function() { return (this.getSeconds() < 10 ? '0' : '') + this.getSeconds(); },
    u: function() { var m = this.getMilliseconds(); return (m < 10 ? '00' : (m < 100 ?
'0' : '')) + m; },
    // Timezone
    e: function() { return "Not Yet Supported"; },
    I: function() { return "Not Yet Supported"; },
    O: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + '00'; },
    P: function() { return (-this.getTimezoneOffset() < 0 ? '-' : '+') + (Math.abs(this.getTimezoneOffset() / 60) < 10 ? '0' : '') + (Math.abs(this.getTimezoneOffset() / 60)) + ':00'; }, // Fixed now
    T: function() { var m = this.getMonth(); this.setMonth(0); var result = this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/, '$1'); this.setMonth(m); return result;},
    Z: function() { return -this.getTimezoneOffset() * 60; },
    // Full Date/Time
    c: function() { return this.format("Y-m-d\\TH:i:sP"); }, // Fixed now
    r: function() { return this.toString(); },
    U: function() { return this.getTime() / 1000; }
};
}(BrawlIO));
