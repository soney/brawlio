(function(FistiCode) {
	var fc = FistiCode;

	var Team = function(players) {
		var self = this;
		self.players = players;
		_.forEach(self.players, function(player) {
			player.team = self;
		});

		if(fc._debug) {
			this.type = "Team";

			fc.assert(_.isArray(players));
			fc.assert(players.length == fc.constants.TEAM_SIZE);
		}
	};

	fc._create_team = function(players) {
		return new Team(players);
	};
})(FistiCode);
