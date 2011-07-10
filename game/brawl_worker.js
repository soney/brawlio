importScripts('game/actions.js');

function broadcast(message) {
	self.postMessage({
		type: "broadcast"
		, message: message
	});
};
function get_time() {
	return (new Date()).getTime();
}

var Player = function(model) {
	this.model = model;
	this.id = this.model.id;
	this.actions = [];
};

self.onmessage = function(event) {
	var data = event.data;
	var type = data.type;
	if(type === "run") {
		self.run();
	}
	else if(type === "initialize") {
		self.teams = data.teams;
		self.players = [];
		for(var i = 0, leni = self.teams.length; i<leni; i++) {
			var team = self.teams[i];
			var player_models = team.player_models;
			for(var j = 0, lenj = player_models.length; j<lenj; j++) {
				var player_model = player_models[j];
				var player = new Player(player_model);

				self.players[player.id] = player;
			}
		}
	}
	else if(type === "player_request") {
		var player_id = data.player_id;
		var request = data.request;

		self.on_player_request(player_id, request);
	}
};

self.run = function() {
	self.round = 0;
	self.time = get_time();
	broadcast({
		type: "game_start"
	});
};

self.get_player = function(player_id) {
	return self.players[player_id];
};

self.on_player_request = function(player_id, request) {
	var player = self.get_player(player_id);
	var type = request.type;
	if(type === "action") {
		var action = request.action;
		var action_type = Actions.get_type(action);

		if(action_type === Actions.move_type ||
			action_type === Actions.rotate_type) {
			player.actions[action_type] = action;
		}
	}
};
