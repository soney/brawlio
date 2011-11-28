(function(BrawlIO) {
	var _ = BrawlIO._;
	var make_listenable = function(obj) {
		var id = 0;
		var listeners = [];

		obj.on = obj.add_event_listener = function(type, callback, context) {
			if(context !== undefined) {
				callback = _.bind(callback, context);
			}

			var listener = {
				type: type
				, callback: callback
				, id: id
			};
			listeners.push(listener);

			id++;
			return listener.id;
		};

		obj.remove_event_listener = function(id) {
			var i;
			for(i = 0; i<listeners.length; i++) {
				var listener = listeners[i];
				if(listener.id === id || listener.callback === id) {
					listeners.splice(i, 1);
					return true;
				}
			}
		};
		
		obj.emit = function(event) {
			var type = event.type;
			var i, len = listeners.length;
			for(i = 0; i<len; i++) {
				var listener = listeners[i];
				if(listener.type === type) {
					listener.callback(event);
				}
			}
		};

		obj.once = function(type, callback) {
			var callback_id;
			callback_id = obj.on(type, function() {
				callback.apply(obj, arguments);
				obj.remove_event_listener(callback_id);
			});
		};

		obj.clear_listeners = function(type) {
			if(arguments.lenth === 0) {
				listeners = [];
			} else {
				var i;
				for(i = 0; i<listeners.length; i++) {
					var listener = listeners[i];
					if(listener.type === type) {
						listeners.splice(i, 1);
						i--;
					}
				}
			}
		};
	};

	BrawlIO.make_listenable = make_listenable;
}(BrawlIO));
