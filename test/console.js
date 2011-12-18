var database = require('../server/database').database;
var stdin = process.openStdin();

var helptext = "========================================\n"
				+ "             COMMANDS                  \n\n"
				+ "adduser <username> <email> - Create a new user\n"
				+ "listusers - List every user\n"
				+ "addbot <user_fk> <name> <code> - Create a new bot\n"
				+ "create - Create all of the tables\n"
				+ "drop - Drop all of the tables\n"
				+ "help - This list\n"
				+ "quit - Quit the program\n"
				+ "reset - Drop and then create all of the tables\n"
				+ "========================================";

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
			callback_fn("User " + username + (email ? " ("+email+") " : " ") + "added with id " + user_id);
		});
	} else if(command_name === "LISTUSERS") {
		database.get_users(function(users) {
			for(var i = 0; i<users.length; i++) {
				var user = users[i];
				var user_str = "";
				for(var key in user) {
					if(user.hasOwnProperty(key)) {
						var value = user[key];
						user_str += key + ": " + value + "    ";
					}
				}
				console.log(user_str);
			}
			callback_fn();
		});
	} else if(command_name === "CREATE") {
		database.create_tables(callback("Created tables"));
	} else if(command_name === "RESET") {
		database.drop_tables(function() {
			database.create_tables(callback("Reset"));
		});
	} else if(command_name === "HELP") {
		console.log(helptext+"\n");
		callback_fn();
	} else if(command_name === "ADDBOT") {
		var user_fk = command[1];
		var name = command[2];
		var code = command[3];

		callback_fn();
	} else {
		console.log("Unknown command '" + command[0] + "'\n");
		console.log(helptext+"\n");
		callback_fn();
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
