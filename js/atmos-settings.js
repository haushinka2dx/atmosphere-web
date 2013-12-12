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

		return _Desktop;
	})();

	return AtmosSettings;
})();
