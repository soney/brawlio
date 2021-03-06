(function(BrawlIO) {
	var Dashboard = {
		options: {
		}

		, _create: function() {
			var element = this.element;
			this.render_home();
			$("a#home").on("click.dashboard", $.proxy(this.render_home, this));
		}

		, destroy: function() {
			var element = this.element;
			$.Widget.prototype.destroy.apply(this, arguments);
			$("a#home").off("click.dashboard");
			destroy_body();
		}

		, destroy_body: function() {
			var element = this.element;
			if(element.data("dashboard_home")) {
				element.dashboard_home("destroy");
			}
			if(element.data("dashboard_bot")) {
				element.dashboard_bot("destroy");
			}
		}

		, render_home: function() {
			var element = this.element;
			this.destroy_body();
			element.dashboard_home({
				dashboard: this
			});
		}

		, render_bot: function(bot_id) {
			this.destroy_body();
			this.element.dashboard_bot({
				dashboard: this
				, bot_id: bot_id
			});
		}

		, brawl_added: function(brawl) {
			if(this.element.data("dashboard_bot")) {
				this.element.dashboard_bot("brawl_added");
			}
		}
	};

	$.widget("brawlio.dashboard", Dashboard);
}(BrawlIO));
