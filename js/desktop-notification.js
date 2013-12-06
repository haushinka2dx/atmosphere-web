var DesktopNotification = (function() {
	function DesktopNotification() {
		this.init();
	};

	DesktopNotification.prototype.init = function() {
		if (("Notification" in window)) {
			this._hasNotifyFunction = true;
			if (typeof Notification.permission !== 'undefined') {
				switch (Notification.permission) {
					case 'granted':
						this._enabled = true;
						this._confirmed = true;
						break;
					case 'denied':
						this._enabled = false;
						this._confirmed = true;
						break;
					case 'default': // for not Chrome
						this._enabled = undefined;
						this._confirmed = false;
						break;
				}
			}
			else {
				this._enabled = undefined;
				this._confirmed = false; // for Chrome
			}
		}
		else {
			this._hasNotifyFunction = false;
		}
	};

	DesktopNotification.prototype.hasNotifyFunction = function() {
		return this._hasNotifyFunction;
	};

	DesktopNotification.prototype.confirmed = function() {
		return this._confirmed;
	};

	DesktopNotification.prototype.enabled = function() {
		return this._enabled;
	};

	DesktopNotification.prototype.reqiresConfirmation = function() {
		return this.hasNotifyFunction() && !this.confirmed();
	};

	DesktopNotification.prototype.applyPermissionResult = function(permissionStatus) {
		this._confirmed = true;
		console.log('permissionStatus: ' + permissionStatus);
		switch (permissionStatus) {
			case 'granted':
				if(!('permission' in Notification)) {
					console.log("Chrome");
					Notification.permission = permissionStatus;
				}
				console.log("enabled was true");
				this._enabled = true;
				break;
			case 'denied':
				this._enabled = false;
		}
	};

	DesktopNotification.prototype.confirmPermission = function() {
		if (this.reqiresConfirmation()) {
			var applyPermissionResultFunc = DesktopNotification.prototype.applyPermissionResult.bind(this);
			Notification.requestPermission(applyPermissionResultFunc);
		}
	};

	DesktopNotification.prototype.show = function(title, options, timeoutSeconds) {
		if (this.hasNotifyFunction() && this.enabled()) {
			var n = new Notification(title, options);
			if (timeoutSeconds > 0) {

				n.onshow = function() {
					var that = this;
					setTimeout(function() { that.close(); }, timeoutSeconds * 1000);
				};
			}
		}
	};

	return DesktopNotification;
})();
