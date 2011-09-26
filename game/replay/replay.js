define(function(require, exports, module) {
	var Replay = function(options) {
		this.map = options.map;
		this.last_snapshot_index =	null; 
		this.snapshots = options.snapshots || [];
		this.objects = options.objects || [];
		this.complete = options.complete || false;
	};

	(function() {
		this.concat_snapshot = function(snapshot) {
			this.snapshots.push(snapshot);
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
