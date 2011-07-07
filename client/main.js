define(["vendor/jquery", "client/widgets/login"], function() {
	var BrawlIO = window.BrawlIO = {
	};

	BrawlIO.assert = function(test, message) {
		if(BrawlIO._debug) {
			console.assert(test, message);
		}
	};

	require(["client/auth", "client/user", "vendor/handlebars", "vendor/socket.io"], function() {
		(function() {
			this.initialize = function() {
				var socket = this._socket = io.connect();

				require(["text!client/templates/register.html"], function(main_text) {
					var template = Handlebars.compile(main_text);
					var context = {};

					var html = template(context);
					$(document.body).html(html);

					var register_button = $("div.register a#register", document.body);

					register_button.click(function() {
						var user_name_input = $("div.register input#input_user_name");
						var email_input = $("div.register input#input_email");

						var user_name = user_name_input.val();
						var email = email_input.val();


						socket.emit("register", user_name, email);
					});
				});

				/*

				var login_button = $("<div />")	.appendTo(document.body)
												.login();

				socket.on("login_success", function(user) {
					console.log(user);
				});
				socket.on("login_failure", function(explanation) {
					console.log(explanation);
				});
				*/
			};

			this.login = function(options) {
				var user = options.user;
				var password = options.password;
				
				var socket = BrawlIO._socket;
				socket.emit("login", user, password);
			};

			this.register = function(options) {
				var socket = BrawlIO._socket;
			};
		}).call(BrawlIO);
	});


	return BrawlIO;
});
