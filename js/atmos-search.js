var AtmosSearch = (function() {
	function AtmosSearch(containerSelector) {
		this._containerSelector = containerSelector;
		this._windowSpeed = 'fast';
	};

	AtmosSearch.prototype.showSearchPanel = function() {
		this._panelId = uuid();
		this._panelSelector = '#' + this._panelId;

		$(this._containerSelector).append(Hogan.compile($("#tmpl-search-panel").text()).render({
			"search-panel-id":  this._panelId,
		}));

		var historyAreaSelector = this._panelSelector + ' .history-area';
		AtmosSettings.Search.keywords().forEach(function(keyword) {
			$(historyAreaSelector).append(createHistoryItem(keyword));
		});

		var resultPanelShower = showResultPanel.bind(this);
		var searcher = search.bind(this);
		var closer = AtmosSearch.prototype.close.bind(this);
		$(this._panelSelector).on('click', function(e) {
			e.stopPropagation();
			closer();
		});
		$(this._panelSelector).on('click', '.search-panel', function(e) {
			e.stopPropagation();
		});
		$(this._panelSelector).on('click', '.search-panel .history-area-wrapper .history-area .history .control.apply a', function(e) {
			var keyword = $(e.target).parents('.history').data('keyword');
			$(e.target).parents('.search-panel').find('.command-area .input input').val(keyword);
		});
		$(this._panelSelector).on('click', '.search-panel .history-area-wrapper .history-area .history .control.search a', function(e) {
			var keyword = $(e.target).parents('.history').data('keyword');
			$(e.target).parents('.search-panel').find('.command-area .input input').val(keyword);
			$(e.target).parents('.search-panel').find('.command-area .command a').eq(0).click();
		});
		$(this._panelSelector).on('click', '.search-panel .history-area-wrapper .history-area .history .control.delete a', function(e) {
			var $historyItem = $(e.target).parents('.history');
			var keyword = $historyItem.data('keyword');
			$historyItem.fadeOut('fast', function() { $historyItem.remove(); });
			AtmosSettings.Search.removeKeyword(keyword);
		});
		$(this._panelSelector).on('click', '.search-result-wrapper', function(e) {
			e.stopPropagation();
		});
		$(this._panelSelector).on('keypress', '.search-panel .command-area .input > input', function(e) {
			if(e.keyCode == 13) {
				$(e.target).parents('.command-area').find('.command > a').eq(0).click();
			}
		});
		$(this._panelSelector).on('click', '.search-panel .command-area .command > a', function(e) {
			var timelineId = 'search' + uuid();
			var timelineRootId = 'root-' + timelineId;
			var keyword = $(e.target).parents('.command-area').find('.input input').val();
			var searchCondition = createCondition(keyword);
			var url = '/messages/search?' + searchCondition.toGETParameters();

			var tlDef = {
				"root-id": timelineRootId,
				"id":      timelineId,
				"name":    keyword,
				"icon":    'ls-icon-search',
				"theme":   'timeline-row3',
				"api":     url,
				"private": false,
			};

			resultPanelShower(keyword, tlDef);
			searcher(tlDef);
			
			addOrMoveTopHistoryItem($(e.target).parents('.search-panel').find('.history-area-wrapper .history-area'), keyword);
			AtmosSettings.Search.addKeyword(keyword);
		});

		// 候補が表示されない
		// atmos.applyAutoComplete($(this._panelSelector + ' .search-panel .command-area .input > input'));

		$(this._panelSelector).fadeIn(this._windowSpeed);
		$(this._panelSelector + ' .history-area').find('.history').fadeIn(this._windowSpeed);
		$(this._panelSelector + ' .history-area').perfectScrollbar(atmos.perfectScrollbarSetting());
	}

	AtmosSearch.prototype.close = function() {
		if (canl(this._panelId)) {
			var $panel = $(this._panelSelector);
			$panel.fadeOut(this._windowSpeed, function() {
				$panel.remove();
			});
			this._panelId = undefined;
			this._resultPanelId = undefined;
		}
	}

	AtmosSearch.prototype.isShown = function() {
		return canl(this._panelId);
	}

	function showResultPanel(keyword, tlDef) {
		if (keyword.length > 12) {
			var title = keyword.substr(0, 12) + '...';
		}
		else {
			var title = keyword;
		}
		var timelineAppender = addTimeline.bind(null, tlDef);
		if (!canl(this._resultPanelId)) {
			this._resultPanelId = uuid();
			$(this._panelSelector).append(Hogan.compile($("#tmpl-search-result").text()).render({
				"search-result-id": this._resultPanelId,
				"title": title,
			}));
			$('#' + this._resultPanelId).on('click', '.search-result .header .command a', function(e) {
				timelineAppender();
			});
			$('#' + this._resultPanelId).fadeIn(this._windowSpeed);
		}
		else {
			$('#' + this._resultPanelId + ' .search-result .header .title span span').text(keyword);
			$('#' + this._resultPanelId).off('click').on('click', '.search-result .header .command a', function(e) {
				timelineAppender();
			});
		}
	}

	function createCondition(keyword) {
		var cond = extractSearchCondition(keyword);
		var scCustom = createAtmosSearchCondition();
		scCustom.count(100);
		if (canl(cond.keywords)) {
			scCustom.keywords(cond.keywords);
		}
		if (canl(cond.addressesUsers)) {
			scCustom.addressUsers(cond.addressesUsers);
		}
		if (canl(cond.addressesGroups)) {
			scCustom.addressGroups(cond.addressesGroups);
		}
		if (canl(cond.hashtags)) {
			scCustom.hashtags(cond.hashtags);
		}
		return scCustom;
	}

	function search(tlDef) {
		var resultPanelId = this._resultPanelId;
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					$('#' + resultPanelId + ' .search-result .result-wrapper .result .timeline-item-wrapper').remove();
					if (tlResult['count'] > 0) {
						tlResult['results'].reverse().forEach(function(msg, i, a) {
							$('#' + resultPanelId + ' .search-result .result-wrapper .result').prepend(createTimelineItem(msg));
						});
						$('#' + resultPanelId + ' .search-result .result-wrapper .result .timeline-item-wrapper').fadeIn();
						$('#' + resultPanelId + ' .search-result .result-wrapper .result').perfectScrollbar(atmos.perfectScrollbarSetting());
					}
				}
			},
			this
		);
		atmos.sendRequest(
			atmos.createUrl(tlDef.api),
			'GET',
			{},
			successCallback
		);
	}

	function createTimelineItem(msg) {
		var context = {};
		context["timeline-item-message-id"] = msg['_id'];
		context["timeline-item-timestamp"] = utc2jstRelative(msg['created_at']);
		context["timeline-item-avator-img-url"] = atmos.createUrl("/user/avator") + "?user_id=" + msg["created_by"] + '&image_width=36&image_height=36';
		context["timeline-item-username"] = msg["created_by"];
		context["timeline-item-message"] = msg["message"];
		return Hogan.compile($("#tmpl-search-result-item").text()).render(context);
	}

	function addTimeline(tlDef) {
		var timeline = atmos.timelineManager().addTimeline(tlDef);
		if (timeline) {
			timeline.init();
		}

	}

	function createHistoryItem(keyword) {
		if (keyword.length > 10) {
			var keywordForDisp = keyword.substr(0, 9) + '...';
		}
		else {
			var keywordForDisp = keyword;
		}
		return Hogan.compile($("#tmpl-search-history-item").text()).render({
			keyword: keyword,
			displaykeyword: keywordForDisp,
		});
	}

	function addOrMoveTopHistoryItem($historyArea, keyword) {
		var $targetHistoryItem = undefined;
		$historyArea.find('.history').each(function() {
			if ($(this).data('keyword') === keyword) {
				$targetHistoryItem = $(this);
			}
		});
		if ($targetHistoryItem) {
			$historyArea.prepend($targetHistoryItem);
		}
		else {
			$historyArea.prepend(createHistoryItem(keyword));
			$historyArea.find('.history:first').fadeIn();
		}
	}

	function extractSearchCondition(src) {
		return {
			keywords : extractKeywords(src),
			addressesUsers : extractAddressesUsers(src),
			addressesGroups : extractAddressesGroups(src),
			hashtags : extractHashtags(src),
		};
	}

	return AtmosSearch;
})();
