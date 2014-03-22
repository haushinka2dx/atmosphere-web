var AtmosSearch = (function() {
	function AtmosSearch(containerSelector) {
		this._containerSelector = containerSelector;
		this._windowSpeed = 'fast';
	};

	AtmosSearch.prototype.showSearchPanel = function() {
		this._panelId = uuid();
		$(this._containerSelector).append(Hogan.compile($("#tmpl-search-panel").text()).render({
			"search-panel-id":  this._panelId,
		}));

		var historyAreaSelector = '#' + this._panelId + ' .history-area';
		AtmosSettings.Search.keywords().forEach(function(keyword) {
			$(historyAreaSelector).append(createHistoryItem(keyword, keyword));
		});
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('a', 'a'));
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('keyword1', 'keyword1'));
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('keyword2', 'keyword2'));
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('keyword3', 'keyword3'));
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('keyword4', 'keyword4'));
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('keyword5', 'keyword5'));
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('keyword6', 'keyword6'));
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('keyword7', 'keyword7'));
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('keyword8', 'keyword8'));
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('keyword9', 'keyword9'));
//		$('#' + this._panelId + ' .history-area').append(createHistoryItem('keyword10', 'keyword10'));

		var resultPanelShower = showResultPanel.bind(this);
		var searcher = search.bind(this);
		var that = this;
		$('#' + this._panelId).on('click', function(e) {
			e.stopPropagation();
			that.close();
		});
		$('#' + this._panelId).on('click', '.search-panel', function(e) {
			e.stopPropagation();
		});
		$('#' + this._panelId).on('click', '.search-panel .history-area-wrapper .history-area .history .control.apply a', function(e) {
			var keyword = $(e.target).parents('.history').data('keyword');
			$(e.target).parents('.search-panel').find('.command-area .input input').val(keyword);
		});
		$('#' + this._panelId).on('click', '.search-panel .history-area-wrapper .history-area .history .control.search a', function(e) {
			var keyword = $(e.target).parents('.history').data('keyword');
			$(e.target).parents('.search-panel').find('.command-area .input input').val(keyword);
			$(e.target).parents('.search-panel').find('.command-area .command a').eq(0).click();
		});
		$('#' + this._panelId).on('click', '.search-panel .history-area-wrapper .history-area .history .control.delete a', function(e) {
			var $historyItem = $(e.target).parents('.history');
			var keyword = $historyItem.data('keyword');
			$historyItem.fadeOut('fast', function() { $history.remove(); });
			AtmosSettings.Search.removeKeyword(keyword);
		});
		$('#' + this._panelId).on('click', '.search-result-wrapper', function(e) {
			e.stopPropagation();
		});
		$('#' + this._panelId).on('keypress', '.search-panel .command-area .input > input', function(e) {
			if(e.keyCode == 13) {
				$(e.target).parents('.command-area').find('.command > a').eq(0).click();
			}
		});
		$('#' + this._panelId).on('click', '.search-panel .command-area .command > a', function(e) {
			var timelineId = 'search' + uuid();
			var timelineRootId = 'root-' + timelineId;
			var keyword = $(e.target).parents('.command-area').find('.input input').val();

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

			var url = '/messages/search?' + scCustom.toGETParameters();

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

			var $targetHistoryItem = undefined;
			$(e.target).parents('.search-panel').find('.history-area-wrapper .history-area .history').each(function() {
				if ($(this).data('keyword') === keyword) {
					$targetHistoryItem = $(this);
				}
			});
			if ($targetHistoryItem) {
				$(e.target).parents('.search-panel').find('.history-area-wrapper .history-area').prepend($targetHistoryItem);
			}
			else {
				$(e.target).parents('.search-panel').find('.history-area-wrapper .history-area').prepend(createHistoryItem(keyword, keyword));
				$(e.target).parents('.search-panel').find('.history-area-wrapper .history-area .history:first').fadeIn();
			}

			AtmosSettings.Search.addKeyword(keyword);
		});

		// 候補が表示されない
		// atmos.applyAutoComplete($('#' + this._panelId + ' .search-panel .command-area .input > input'));

		$('#' + this._panelId).fadeIn(this._windowSpeed);
		$('#' + this._panelId + ' .history-area').find('.history').fadeIn(this._windowSpeed);
		$('#' + this._panelId + ' .history-area').perfectScrollbar(atmos.perfectScrollbarSetting);
	}

	AtmosSearch.prototype.close = function() {
		if (canl(this._panelId)) {
			var $panel = $('#' + this._panelId);
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
		var timelineAppender = addTimeline.bind(null, tlDef);
		if (!canl(this._resultPanelId)) {
			this._resultPanelId = uuid();
			$('#' + this._panelId).append(Hogan.compile($("#tmpl-search-result").text()).render({
				"search-result-id": this._resultPanelId,
				"title": keyword,
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
						$('#' + resultPanelId + ' .search-result .result-wrapper .result').perfectScrollbar(atmos.perfectScrollbarSetting);
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
		context["timeline-item-avator-img-url"] = atmos.createUrl("/user/avator") + "?user_id=" + msg["created_by"];
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

	function createHistoryItem(keyword, keywordForDisp) {
		return Hogan.compile($("#tmpl-search-history-item").text()).render({
			keyword: keyword,
			displaykeyword: keywordForDisp,
		});
	}

//	function addOrMoveTopHistoryItem(keyword) {
//		var historyAreaSelector = '#' + this._panelId + ' .history-area';
//		var displayKeyword = keyword;
//		return Hogan.compile($("#tmpl-search-history-item").text()).render({
//			keyword: keyword,
//			displaykeyword: keywordForDisp,
//		});
//	}
//
//	function removeHistoryItem(keyword, keywordForDisp) {
//		return Hogan.compile($("#tmpl-search-history-item").text()).render({
//			keyword: keyword,
//			displaykeyword: keywordForDisp,
//		});
//	}

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
