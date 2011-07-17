define(function() {
	var Replay = function(options) {
		this.options = options;
		this.update = options.update;
		this.map = this.options.map;
		this.last_snapshot_index =	null; 
		this.snapshots = [];
		this.objects = [];
		this.complete = false;
	};

	(function() {
		this.concat_chunk = function(replay_chunk) {
			var objects = replay_chunk.objects
				, snapshots = replay_chunk.snapshots;

			this.objects = objects;
			this.snapshots = this.snapshots.concat(snapshots);
		};

		this.get_snapshot = function(index) { return this.snapshots[index]; };
		this.get_object = function(index) { return this.objects[index]; };
		this.num_snapshots = function() { return this.snapshots.length; };
		this.mark_complete = function() { this.complete = true; };
		this.is_complete = function() { return this.complete; };
		this.get_last_snapshot_index = function() { return this.last_snapshot_index; };
		this.get_map = function() { return this.map; };
	}).call(Replay.prototype);

	return Replay;
});
