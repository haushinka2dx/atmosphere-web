var AtmosSettings = (function() {
	function AtmosSettings() {
	}

	AtmosSettings.Desktop = (function() {
		function _Desktop() {
		}

		_Desktop.notifyPermission = function(permission) {
			var key = 'Notification.permission';
			if (canl(permission)) {
				localStorage.setItem(key, permission);
			}
			return localStorage.getItem(key) || 'default';
		};

		_Desktop.closeTimeoutSeconds = function(timeout) {
			var key = 'Notification.closeTimeoutSeconds';
			if (can(timeout)) {
				localStorage.setItem(key, timeout);
			}
			var ret = localStorage.getItem(key);
			return typeof ret === 'undefined' || ret === null ? '10' : ret;
		};

		return _Desktop;
	})();

	return AtmosSettings;
})();
