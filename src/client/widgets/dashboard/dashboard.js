(function(BrawlIO) {
	var Dashboard = {
		options: {
		}

		, _create: function() {
			var element = this.element;
			this.render_home();
			$("a#home", element).on("click.dashboard", $.proxy(this.render_home, this));
		}

		, destroy: function() {
			var element = this.element;
			$.Widget.prototype.destroy.apply(this, arguments);
			$("a#home", element).off("click.dashboard");
			destroy_body();
		}

		, destroy_body: function() {
			var element = this.element;
			if(element.data("dashboard_home")) {
				element.dashboard_home("destroy");
			}
		}

		, render_home: function() {
			var element = this.element;
			this.destroy_body();
			element.dashboard_home({
				dashboard: this
			});
		}
	};

	$.widget("brawlio.dashboard", Dashboard);
}(BrawlIO));
