var database = require('../server/database').database;
var stdin = process.openStdin();

var handle_command = function(command_str, callback_fn) {
	var command = command_str.split(" ");
	var command_name = command[0].toUpperCase();

	var callback = function() {
		var args = arguments;
		return function() {
			return callback_fn.apply(this, args);
		};
	};

	if(command_name === "QUIT" || command_name === "Q") {
		console.log("Bye!");
		process.exit(0);
	} else if(command_name === "DROP") {
		database.drop_tables(callback("Dropped all tables"));
	} else if(command_name === "ADDUSER") {
		var username = command[1];
		var email = command[2];
		database.add_user({
			username: username
			, email: email
		}, function(user_id) {
			callback_fn();
		});
	} else {
		callback_fn("Unknown command '" + command[0] + "'");
	}
};

var do_prompt = function(message) {
	if(message !== undefined) {
		console.log(message);
	}
	process.stdout.write('> ');
	stdin.once('data', function(command_buffer) {
		var command = command_buffer.toString();
		command = command.substr(0, command.length-1);
		handle_command(command, do_prompt);
	});
};


do_prompt();
