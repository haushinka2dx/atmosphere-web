var createAtmosSockJS = undefined;

(function() {
	function AtmosSockJS() {
		this._receivers = [];
		this._reconnect_timer_id = null;
		this._enable_recoonect = true;
	};
	AtmosSockJS.prototype = {
		start : start,
		end : end,
		send : send,
		notify : notify,
		addNotificationReceiver : addNotificationReceiver,
		reconnect : reconnect,
		stop_reconnect : stop_reconnect,
	};

	function start(atmosSessionId) {
		var that = this;
		that._sock = new SockJS('/atmos-ws/notify');

		that._sock.onopen = function() {
			that._sock.send('{"action":"start","atmosphere-session-id":"' + atmosSessionId + '"}');
			that.stop_reconnect();
		};
			
		that._sock.onmessage = function(e) {
			var msgJSON = JSON.parse(e.data);
			that.notify(msgJSON);
		};
			
		that._sock.onclose = function() {
			that.reconnect();
		};
	}

	function end() {
		if (can(this._sock)) {
			var that = this;
			that._enable_recoonect = false;
			that.stop_reconnect();
			that._sock.close();
			that._sock = undefined;
			that._receivers = [];
		}
	}

	function send(msg) {
		if (can(this._sock)) {
			this._sock.send(msg);
		}
	}

	function stop_reconnect() {
		if (can(this._reconnect_timer_id)) {
			clearInterval(this._reconnect_timer_id);
			this._reconnect_timer_id = null;
		}
	}

	function reconnect() {
		if (this._enable_recoonect && !can(this._reconnect_timer_id)) {
			var that = this;
			that._reconnect_timer_id = setInterval(function(){
				that.start(atmos.atmosSessionId());
			}, 5000);
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
