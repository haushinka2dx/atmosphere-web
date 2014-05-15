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
				"name":    'Everyone\'s Messages',
				"icon":    'ls-icon-globe',
				"theme":   'timeline-row1',
				"api":     '/messages/global_timeline',
				"private": false,
			},
			"tl_my_timeline-root":{
				"root-id": 'tl_my_timeline-root',
				"id":      'tl_my_timeline',
				"name":    'Following Messages',
				"icon":    'ls-icon-flag',
				"theme":   'timeline-row2',
				"api":     '/messages/focused_timeline',
				"private": false,
			},
			"tl_talk_timeline-root":{
				"root-id": 'tl_talk_timeline-root',
				"id":      'tl_talk_timeline',
				"name":    'Messages to You',
				"icon":    'ls-icon-comments',
				"theme":   'timeline-row3',
				"api":     '/messages/talk_timeline',
				"private": false,
			},
			"tl_announce_timeline-root":{
				"root-id": 'tl_announce_timeline-root',
				"id":      'tl_announce_timeline',
				"name":    'Group Messages',
				"icon":    'ls-icon-circle',
				"theme":   'timeline-row4',
				"api":     '/messages/announce_timeline',
				"private": false,
			},
			"tl_monolog_timeline-root":{
				"root-id": 'tl_monolog_timeline-root',
				"id":      'tl_monolog_timeline',
				"name":    'Monologue',
				"icon":    'ls-icon-lock',
				"theme":   'timeline-row5',
				"api":     '/messages/monolog_timeline',
				"private": false,
			},
			"tl_private_timeline-root":{
				"root-id": 'tl_private_timeline-root',
				"id":      'tl_private_timeline',
				"name":    'Private Messages',
				"icon":    'ls-icon-mail',
				"theme":   'timeline-row-private',
				"api":     '/private/timeline',
				"private": true,
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

	AtmosSettings.Complement = (function() {
		function _Complement() {
		}

		var userUsedHistoryKey = 'Complement.userUsedHistory';
		var groupUsedHistoryKey = 'Complement.groupUsedHistory';

		function load(key, nextValue) {
			var currentValueString = localStorage.getItem(key);
			if (canl(currentValueString)) {
				return JSON.parse(currentValueString);
			}
			else {
				return {};
			}
		}

		function touch(key, id) {
			if (canl(id)) {
				var c = load(key);
				c[id] = Date.now();
				localStorage.setItem(key, JSON.stringify(c));
			}
		}

		_Complement.getUserUsedHistory = function() {
			return load(userUsedHistoryKey);
		}

		_Complement.updateUserUsedHistory = function(userId) {
			touch(userUsedHistoryKey, userId);
		}

		_Complement.getGroupUsedHistory = function() {
			return load(groupUsedHistoryKey);
		}

		_Complement.updateGroupUsedHistory = function(groupId) {
			touch(groupUsedHistoryKey, groupId);
		}

		return _Complement;
	})();

	AtmosSettings.Search = (function() {
		function _Search() {
		}

		_Search.keyKeywords = 'Search.keywords';

		_Search.keywords = function() {
			var keywordsString = localStorage.getItem(_Search.keyKeywords);
			if (canl(keywordsString)) {
				return JSON.parse(keywordsString);
			}
			else {
				return [];
			}
		};

		_Search.addKeyword = function(keyword) {
			if (!canl(keyword)) {
				return;
			}
			var keywords = [];
			keywords.push(keyword);
			_Search.keywords().forEach(function(currentKeyword) {
				if (currentKeyword !== keyword) {
					keywords.push(currentKeyword);
				}
			});
			localStorage.setItem(_Search.keyKeywords, JSON.stringify(keywords));
		};

		_Search.removeKeyword = function(keyword) {
			if (!canl(keyword)) {
				return;
			}
			var keywords = [];
			_Search.keywords().forEach(function(currentKeyword) {
				if (currentKeyword !== keyword) {
					keywords.push(currentKeyword);
				}
			});
			localStorage.setItem(_Search.keyKeywords, JSON.stringify(keywords));
		};

		return _Search;
	})();

	return AtmosSettings;
})();
