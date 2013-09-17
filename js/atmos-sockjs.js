var createAtmosSockJS = undefined;

(function() {
	function AtmosSockJS() {
		this._receivers = [];
	};
	AtmosSockJS.prototype = {
		start : start,
		end : end,
		send : send,
		notify : notify,
		addNotificationReceiver : addNotificationReceiver,
	};

	function start(atmosSessionId) {
		if (!can(this._sock)) {
			var that = this;
			that._sock = new SockJS('/atmos-ws/notify');
	
			that._sock.onopen = function() {
				that._sock.send('{"action":"start","atmosphere-session-id":"' + atmosSessionId + '"}');
			};
				
			that._sock.onmessage = function(e) {
				var msgJSON = JSON.parse(e.data);
				that.notify(msgJSON);
			};
				
			that._sock.onclose = function() {
			};
		}
	}

	function end() {
		if (can(this._sock)) {
			var that = this;
			that._sock.close();
			that._sock = undefined;
		}
	}

	function send(msg) {
		if (can(this._sock)) {
			this._sock.send(msg);
		}
	}

	function addNotificationReceiver(receiver) {
		if (can(receiver) && typeof(receiver.fire) === 'function') {
			this._receivers.push(receiver);
		}
	}

	function notify(msg) {
		for (var i=0; i<this._receivers.length; i++) {
			this._receivers[i].fire(msg);
		}
	}

	createAtmosSockJS = function() {
		return new AtmosSockJS();
	};
})();
