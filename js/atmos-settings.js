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
	
	AtmosSettings.Timeline = (function() {
		function _Timeline() {
		}

		_Timeline.defaultTimelineDefinitions = {
			"tl_global_timeline-root":{
				"root-id": 'tl_global_timeline-root',
				"id":      'tl_global_timeline',
				"name":    'global timeline',
				"theme":   'timeline-row1'
			},
			"tl_my_timeline-root":{
				"root-id": 'tl_my_timeline-root',
				"id":      'tl_my_timeline',
				"name":    'my timeline',
				"theme":   'timeline-row2'
			},
			"tl_talk_timeline-root":{
				"root-id": 'tl_talk_timeline-root',
				"id":      'tl_talk_timeline',
				"name":    'talk timeline',
				"theme":   'timeline-row2'
			},
			"tl_announce_timeline-root":{
				"root-id": 'tl_announce_timeline-root',
				"id":      'tl_announce_timeline',
				"name":    'announce timeline',
				"theme":   'timeline-row4'
			},
			"tl_monolog_timeline-root":{
				"root-id": 'tl_monolog_timeline-root',
				"id":      'tl_monolog_timeline',
				"name":    'monolog timeline',
				"theme":   'timeline-row5'
			},
			"tl_private_timeline-root":{
				"root-id": 'tl_private_timeline-root',
				"id":      'tl_private_timeline',
				"name":    'private timeline',
				"theme":   'timeline-row-private'
			},
		};

		_Timeline.defaultTimelineOrder = {
			"tl_global_timeline-root":10,
			"tl_my_timeline-root":20,
			"tl_talk_timeline-root":30,
			"tl_announce_timeline-root":40,
			"tl_monolog_timeline-root":50,
			"tl_private_timeline-root":60,
		};

		_Timeline.timelineDefinitions = function(timelineDefinitions) {
			var key = 'Timeline.timelines';
			if (can(timelineDefinitions) && typeof(timelineDefinitions) == 'object') {
				localStorage.setItem(key, JSON.stringify(timelineDefinitions));
			}
			var timelinesString = localStorage.getItem(key);
			if (canl(timelinesString)) {
				return JSON.parse(timelinesString);
			}
			else {
				return this.defaultTimelineDefinitions;
			}
		};

		_Timeline.timelineOrder = function(timelineOrder) {
			var key = 'Timeline.timelineOrder';
			if (can(timelineOrder) && typeof(timelineOrder) == 'object') {
				localStorage.setItem(key, JSON.stringify(timelineOrder));
			}
			var timelineOrderString = localStorage.getItem(key);
			if (canl(timelineOrderString)) {
				return JSON.parse(timelineOrderString);
			}
			else {
				return this.defaultTimelineOrder;
			}
		};

		return _Timeline;
	})();

	return AtmosSettings;
})();
