var create_controller = require('../server/controller');
var stdin = process.openStdin();

var helptext = "========================================\n"
				+ "             COMMANDS                  \n\n"
				+ "addbot <user_fk> <name> <code> - Create a new bot\n"
				+ "adduser <username> <email> - Create a new user\n"
				+ "create - Create all of the tables\n"
				+ "drop - Drop all of the tables\n"
				+ "gamelog <brawl_id> - Get the game log of a brawl\n"
				+ "help - This list\n"
				+ "listbots - List every bot\n"
				+ "listbrawls - List every brawl\n"
				+ "listusers - List every user\n"
				+ "quit - Quit the program\n"
				+ "reset - Drop and then create all of the tables\n"
				+ "runbrawl <bot1_fk> <bot2_fk> <winner_fk> - Run a brawl\n"
				+ "setcode <bot_fk> <code> - Sets the code of a bot\n"
				+ "========================================";

var controller = create_controller();

var enumerate_properties = function(objs) {
	for(var i = 0; i<objs.length; i++) {
		var obj = objs[i];
		var obj_str = "";
		for(var key in obj) {
			if(obj.hasOwnProperty(key)) {
				var value = obj[key];
				obj_str += key + ": " + value + "    ";
			}
		}
		console.log(obj_str);
	}
};

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
		controller.drop_tables(callback("Dropped all tables"));
	} else if(command_name === "ADDUSER") {
		var username = command[1];
		var email = command[2];
		controller.add_user({
			username: username
			, email: email
		}, function(user_id) {
			callback_fn("User " + username + (email ? " ("+email+") " : " ") + "added with id " + user_id);
		});
	} else if(command_name === "GAMELOG") {
		var brawl_id = command[1];
		controller.get_game_log(brawl_id, function(game_log) {
			console.log(game_log);
			callback_fn();
		});
	} else if(command_name === "LISTUSERS") {
		controller.get_all_users(function(users) {
			enumerate_properties(users);
			callback_fn();
		});
	} else if(command_name === "SETCODE") {
		var bot_k = command[1];
		var code = command[2];
		controller.set_bot_code(bot_k, code, callback("Set code"));
	} else if(command_name === "LISTBOTS") {
		controller.get_all_bots(function(bots) {
			enumerate_properties(bots);
			callback_fn();
		});
	} else if(command_name === "LISTBRAWLS") {
		controller.get_all_brawls(function(brawls) {
			enumerate_properties(brawls);
			callback_fn();
		});
	} else if(command_name === "CREATE") {
		controller.create_tables(callback("Created tables"));
	} else if(command_name === "RESET") {
		controller.drop_tables(function() {
			controller.create_tables(callback("Reset"));
		});
	} else if(command_name === "HELP") {
		console.log(helptext+"\n");
		callback_fn();
	} else if(command_name === "ADDBOT") {
		var user_fk = parseInt(command[1]);
		var name = command[2];
		var code = command[3];

		controller.add_bot(user_fk, name, code, function(bot_id) {
			callback_fn("Bot " + name + " added with id " + bot_id);
		});
	} else if(command_name === "RUNBRAWL") {
		var bot1_fk = parseInt(command[1]);
		var bot2_fk = parseInt(command[2]);
		var winner_bot_fk = parseInt(command[3]);

		controller.brawl_result(bot1_fk, bot2_fk, winner_bot_fk, "", function(bot1, bot2) {
			console.log("Bot 1: " + bot1.wins + "W " + bot1.losses + "L " + bot1.draws + "D ("+bot1.rating+")");
			console.log("Bot 2: " + bot2.wins + "W " + bot2.losses + "L " + bot2.draws + "D ("+bot2.rating+")");
			callback_fn();
		});
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
