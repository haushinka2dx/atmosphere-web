var AtmosTimelineManager = (function() {
	function AtmosTimelineManager(containerSelector) {
		this._publicTimelines = {};
		this._privateTimelines = {};
		this._timelineCount = 50;
		this._timelineRootIds = [];
		this._containerSelector = containerSelector;
	};

	AtmosTimelineManager.prototype.getTimeline = function(tlDef) {
		if (can(tlDef)) {
			if (tlDef["private"]) {
				return this._privateTimelines[tlDef["id"]];
			}
			else {
				return this._publicTimelines[tlDef["id"]];
			}
		}
		return undefined;
	};

	AtmosTimelineManager.prototype.getPublicTimeline = function(id) {
		if (canl(id)) {
			return this._publicTimelines[id];
		}
		return undefined;
	}

	AtmosTimelineManager.prototype.getPrivateTimeline = function(id) {
		if (canl(id)) {
			return this._privateTimelines[id];
		}
		return undefined;
	}

	AtmosTimelineManager.prototype.getTimelines = function() {
		var that = this;
		var tls = [];
		Object.keys(this._publicTimelines).forEach(function(k) { tls.push(that._publicTimelines[k]); });
		Object.keys(this._privateTimelines).forEach(function(k) { tls.push(that._privateTimelines[k]); });
		return tls;
	}

	AtmosTimelineManager.prototype.getPublicTimelines = function() {
		var that = this;
		var tls = [];
		Object.keys(this._publicTimelines).forEach(function(k) { tls.push(that._publicTimelines[k]); });
		return tls;
	}

	AtmosTimelineManager.prototype.getPrivateTimelines = function() {
		var that = this;
		var tls = [];
		Object.keys(this._privateTimelines).forEach(function(k) { tls.push(that._privateTimelines[k]); });
		return tls;
	}

	AtmosTimelineManager.prototype.loadTimelineDefinitions = function(isDefault) {
		// load from settings
		if (isDefault) {
			var allTimelineDefs = AtmosSettings.Timeline.defaultTimelineDefinitions;
		}
		else {
			var allTimelineDefs = AtmosSettings.Timeline.timelineDefinitions();
		}

		// extract timeline definitions that can be handled
		var targetTimelineRootIds = this._timelineRootIds;
		var timelineRootIds = Object.keys(allTimelineDefs).filter(function(timelineRootId) {
			return targetTimelineRootIds.length === 0 || targetTimelineRootIds.indexOf(timelineRootId) > -1;
		});
		var timelineDefs = [];
		timelineRootIds.forEach(function(timelineRootId) { timelineDefs.push(allTimelineDefs[timelineRootId]); });
		
		// sort timeline definition
		var timelineOrder = AtmosSettings.Timeline.timelineOrder();
		timelineDefs.sort(timelineSorter.bind(null, timelineOrder));

		return timelineDefs;
	};

	function timelineSorter(timelineOrder, left, right) {
		var leftOrder = timelineOrder[left['root-id']];
		var rightOrder = timelineOrder[right['root-id']];
		if (typeof leftOrder === 'undefined' && typeof rightOrder === 'undefined') { return 0; }
		else if (typeof leftOrder === 'undefined') { return -1; }
		else if (typeof rightOrder === 'undefined') { return 1; }
		else if (leftOrder < rightOrder) { return -1; }
		else if (leftOrder > rightOrder) { return 1; }
		else { return 0; }
	}

	AtmosTimelineManager.prototype.addTimeline = function(tlDef) {
		if (tlDef["private"]) {
			if (Object.keys(this._privateTimelines).indexOf(tlDef["id"]) > -1) {
				return this._privateTimelines[tlDef["id"]];
			}
		}
		else {
			if (Object.keys(this._publicTimelines).indexOf(tlDef["id"]) > -1) {
				return this._publicTimelines[tlDef["id"]];
			}
		}

		$(this._containerSelector).prepend(Hogan.compile($("#tmpl-timeline").text()).render({
			"timeline-row-class": tlDef["theme"],
			"timeline-root-id":   tlDef["root-id"],
			"timeline-title":     tlDef["name"],
			"timeline-id":        tlDef["id"]
		}));

		var changePositionStatusChanger = applyTimelineEvent.call(this, tlDef);

		var searchCondition = createAtmosSearchCondition();
		searchCondition.count(this._timelineCount);
		if (tlDef["private"]) {
			var timeline = new AtmosPrivateTimeline(tlDef["id"], tlDef["name"], '', atmos.createUrl(tlDef["api"]), searchCondition, changePositionStatusChanger);
			this._privateTimelines[tlDef["id"]] = timeline;
		}
		else {
			var timeline = new AtmosTimeline(tlDef["id"], tlDef["name"], '', atmos.createUrl(tlDef["api"]), searchCondition, changePositionStatusChanger);;
			this._publicTimelines[tlDef["id"]] = timeline;
		}

		changePositionStatusChanger();

		return timeline;
	};

	function applyTimelineEvent(tlDef) {
		var timelineManager = this;
		var targetSelector = ".contents > .timeline";
		var changePositionStatusChanger = changeTimelinePositionLinkStatus.bind(this, targetSelector);
		$(".header-control .timeline-setting a").off('click').on('click', function(e) {
			e.stopPropagation();
			$menu = $(e.currentTarget).parent().parent().next('.header-menu:first').slideToggle('fast');
		});
		$(".timeline-move-position.move-left > a").off('click').on('click', function(e) {
			e.stopPropagation();
			var $timelineRoot = $(e.currentTarget).parents(".timeline");
			var $leftRoot = $timelineRoot.prev('.timeline');
			$leftRoot.before($timelineRoot);
			changePositionStatusChanger();
			storeTimelineOrder($(targetSelector));
		});
		$(".timeline-move-position.move-right > a").off('click').on('click', function(e) {
			e.stopPropagation();
			var $timelineRoot = $(e.currentTarget).parents(".timeline");
			var $rightRoot = $timelineRoot.next('.timeline');
			$rightRoot.after($timelineRoot);
			changePositionStatusChanger();
			storeTimelineOrder($(targetSelector));
		});
		$(".header-menu .timeline-close a").off('click').on('click', function(e) {
			e.stopPropagation();
			var $timelineRoot = $(e.currentTarget).parents(".timeline");
			var targetTimelineId = $timelineRoot.find('.timeline-items').attr("id");
			$timelineRoot.fadeOut('normal', function() {
				$timelineRoot.remove();
				changePositionStatusChanger();
				storeTimelineOrder($(targetSelector));
				if (timelineManager.getPublicTimeline(targetTimelineId)) {
					delete timelineManager._publicTimelines[targetTimelineId];
				}
				else {
					delete timelineManager._privateTimelines[targetTimelineId];
				}
			});
		});

		return changePositionStatusChanger;
	}

	function changeTimelinePositionLinkStatus(targetSelector) {
		var that = this;
		$(targetSelector).each(function(index, timeline) {
			$timeline = $(timeline);
			var timelineId = $timeline.find(".timeline-items:first").attr("id");
			var timeline = that.getPublicTimeline(timelineId);
			if (!can(timeline)) {
				timeline = that.getPrivateTimeline(timelineId);
			}
			if (can(timeline)) {
				var $prevTimeline = $timeline.prev();
				if ($prevTimeline.hasClass("timeline") && $prevTimeline.is(':visible')) {
					timeline.enableChangePositionLeft();
				}
				else {
					timeline.disableChangePositionLeft();
				}
				var $nextTimeline = $timeline.next();
				if ($nextTimeline.hasClass("timeline") && $nextTimeline.is(':visible')) {
					timeline.enableChangePositionRight();
				}
				else {
					timeline.disableChangePositionRight();
				}
			}
		});
	}

	function storeTimelineOrder($timelines) {
		var timelineOrder = {};
		$timelines.each(function(index, timeline) { timelineOrder[$(timeline).attr('id')] = index + 1; });
		AtmosSettings.Timeline.timelineOrder(timelineOrder);
	}

	AtmosTimelineManager.prototype.showTimelineManagementDialog = function() {
		var dialogId = uuid();
		var timelineDefs = this.loadTimelineDefinitions(true);
		var tlDefs = [];
		Object.keys(timelineDefs).forEach(function(tlId) {
			tlDefs.push({
				"timeline-name":timelineDefs[tlId]["name"],
				"timeline-id":timelineDefs[tlId]["id"],
				"timeline-root-id":timelineDefs[tlId]["root-id"]
			});
		});
		$('body').append(Hogan.compile($("#tmpl-timeline-definition-dialog").text()).render({
			"timeline-definition-dialog-id": dialogId,
			"timeline-definitions": tlDefs
		}));

		var timelineDefinitionStatusChanger = changeTimelineDefinitionState.bind(null, dialogId, this._containerSelector);

		var timelineManager = this;
		var closer = (function() {
			var id = dialogId;
			return function(e) {
				e.stopPropagation();
				$('#' + id).hide('fast', function() {
					$('#' + id).remove();
				});
			}
		})();
		$('#' + dialogId).on('click', closer);
		$('#' + dialogId).on('click', '.timeline-definition-dialog', function(e) { e.stopPropagation(); });
		$('#' + dialogId).on('click', 'a.close-button', closer);
		$('#' + dialogId).on('click', '.control a', function(e) {
			e.stopPropagation();
			var targetTimelineRootId = $(this).parents('.timeline-definition').data('timelinerootid');
			var $parent = $(this).parent();
			if ($parent.hasClass('add')) {
				var timeline = timelineManager.addTimeline(timelineDefs.filter(function(tlDef) { return tlDef['root-id'] === targetTimelineRootId; })[0]);
				timeline.init();
				timelineDefinitionStatusChanger();
			}
			else if ($parent.hasClass('remove')) {
			}
			else {
				// nothing to do
			}
		});

		timelineDefinitionStatusChanger();

		$('#' + dialogId + ' .timeline-definitions').perfectScrollbar(atmos.perfectScrollbarSetting);
		$('#' + dialogId).show('fast');
	};

	function changeTimelineDefinitionState(dialogId, timelineContainerSelector) {
		var existingTimelineRootIds = [];
		$(timelineContainerSelector).find('.timeline').each(function() { existingTimelineRootIds.push($(this).attr("id")) });

		$('#' + dialogId + ' .timeline-definition').each(function() {
			if (existingTimelineRootIds.indexOf($(this).data('timelinerootid')) !== -1) {
				$(this).find('.control.add.enable').hide();
				$(this).find('.control.add.disable').show();
				$(this).find('.control.remove.enable').show();
				$(this).find('.control.remove.disable').hide();
			}
			else {
				$(this).find('.control.add.enable').show();
				$(this).find('.control.add.disable').hide();
				$(this).find('.control.remove.enable').hide();
				$(this).find('.control.remove.disable').show();
			}
		});
	}

	return AtmosTimelineManager;
})();
