define(function() {
	var make_listenable = function(obj) {
		var id = 0;
		var listeners = [];

		obj.on = obj.add_event_listener = function(type, callback) {
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
			for(var i = 0; i<listeners.length; i++) {
				var listener = listeners[i];
				if(listener.id === id || listener.callback === id) {
					listeners.splice(i, 1);
					return true;
				}
			}
		};
		
		obj.emit = function(event) {
			var type = event.type;
			for(var i = 0, len = listeners.length; i<len; i++) {
				var listener = listeners[i];
				if(listener.type === type) {
					listener.callback(event);
				}
			}
		};

		obj.once = function(type, callback) {
			var callback_id = obj.on(type, function() {
				callback.apply(obj, arguments);
				obj.remove_event_listener(callback_id);
			});
		};

		obj.clear_listeners = function(type) {
			if(arguments.lenth === 0) {
				listeners = [];
			} else {
				for(var i = 0; i<listeners.length; i++) {
					var listener = listeners[i];
					if(listener.type === type) {
						listeners.splice(i, 1);
						i--;
					}
				}
			}
		};
	};

	return make_listenable;
});
