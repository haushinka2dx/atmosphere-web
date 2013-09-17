var createAtmosTimeline = undefined;

(function() {
	function AtmosTimeline(id, name, description, url, searchCondition) {
		this.id(id);
		this.name(name);
		this.description(description);
		this.url(url);
		this.searchCondition(searchCondition);
	};
	AtmosTimeline.prototype = {
		id : id,
		name : name,
		description : description,
		url : url,
		searchCondition : searchCondition,
		alreadyReadDateTime : alreadyReadDateTime,
		latestMessageDateTime : latestMessageDateTime,
		oldestMessageDateTime : oldestMessageDateTime,
		createParameters : createParameters,
		init : init,
		readMore : readMore,
		createTimelineItem : createTimelineItem,
		updateTimelineItemReaction : updateTimelineItemReaction,
		refreshMessage : refreshMessage,
	}

	function id(tlId) {
		if (can(tlId) && tlId.length > 0) {
			this._id = tlId;
		}
		return this._id;
	}

	function name(tlName) {
		if (can(tlName) && tlName.length > 0) {
			this._name = tlName;
		}
		return this._name;
	}

	function description(tlDescription) {
		if (can(tlDescription) && tlDescription.length > 0) {
			this._description = tlDescription;
		}
		return this._description;
	}

	function alreadyReadDateTime(tlAlreadyReadDateTime) {
		if (can(tlAlreadyReadDateTime) && tlAlreadyReadDateTime.length > 0) {
			this._alreadyReadDateTime = tlAlreadyReadDateTime;
		}
		return this._alreadyReadDateTime;
	}

	function latestMessageDateTime(tlLatestMessageDateTime) {
		if (can(tlLatestMessageDateTime) && tlLatestMessageDateTime.length > 0) {
			if (!can(this._latestMessageDateTime)) {
				this._latestMessageDateTime = tlLatestMessageDateTime;
			}
			else if (tlLatestMessageDateTime > this._latestMessageDateTime) {
				this._latestMessageDateTime = tlLatestMessageDateTime;
			}
		}
		return this._latestMessageDateTime;
	}

	function oldestMessageDateTime(tlOldestMessageDateTime) {
		if (can(tlOldestMessageDateTime) && tlOldestMessageDateTime.length > 0) {
			if (!can(this._oldestMessageDateTime)) {
				this._oldestMessageDateTime = tlOldestMessageDateTime;
			}
			else if (tlOldestMessageDateTime > this._oldestMessageDateTime) {
				this._oldestMessageDateTime = tlOldestMessageDateTime;
			}
		}
		return this._oldestMessageDateTime;
	}

	function url(tlUrl) {
		if (can(tlUrl) && tlUrl.length > 0) {
			this._url = tlUrl;
		}
		return this._url;
	}

	function searchCondition(tlSearchCondition) {
		if (can(tlSearchCondition)) {
			this._searchCondition = tlSearchCondition;
		}
		return this._searchCondition;
	}

	function createParameters() {
		var cond = this.searchCondition();
		if (can(this.latestMessageDateTime())) {
			cond.futureThan(this.latestMessageDateTime());
		}
		var condJSON = cond.toJSON();
		return condJSON;
	}

	function init() {
		var method = 'GET';
		var data = this.createParameters();
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] > 0) {
						for (var itemIndex = tlResult['count'] - 1; itemIndex >= 0; itemIndex--) {
							var tlItem = tlResult['results'][itemIndex];
							var tlItemHtml = this.createTimelineItem(tlItem);
							$("#" + this.id()).prepend(tlItemHtml);
							$("#" + this.id() + ' > div:first a.reaction').on('click', function(e) {
								var targetLink = e.currentTarget;
								var targetMessageId = $(targetLink).parent().parent().find('input[name=message-id]').val();
								var targetMessageBody = $(targetLink).parent().parent().find('input[name=message-body]').val();
								var reactionType = $(targetLink).attr('reaction-type');
								atmos.showResponseDialog(targetMessageId, reactionType, targetMessageBody);
							});
							$("#" + this.id() + ' > div:first a.reply').on('click', function(e) {
								var targetLink = e.currentTarget;
								var targetMessageId = $(targetLink).parent().parent().find('input[name=message-id]').val();
								var targetMessageBody = $(targetLink).parent().parent().find('input[name=message-body]').val();
								var replyType = $(targetLink).attr('reply-type');
								var defaultMessage = '';
								if (replyType === 'quote') {
									defaultMessage = targetMessageBody;
								}
								atmos.showMessageSenderDialog(defaultMessage, targetMessageId, targetMessageBody);
							});
						}
						this.latestMessageDateTime(tlResult['latest_created_at']);
						this.oldestMessageDateTime(tlResult['oldest_created_at']);
					}
				}
			},
			this
		);
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				console.log(errorThrown);
			},
			this
		);
		atmos.sendRequest(
			this.url(),
			method,
			data,
			successCallback,
			failureCallback);
	}

	function readMore() {
	}

	function createTimelineItem(msg) {
		var tmpl = Hogan.compile($("#tmpl-timeline-item-wrapper").text());
		var context = {};
		context["timeline-item-message-id"] = msg['_id'];
		context["timeline-item-timestamp"] = utc2jstRelative(msg['created_at']);
		context["timeline-item-avator-img-url"] = atmos.createUrl("/user/avator") + "?user_id=" + msg["created_by"];
		context["timeline-item-username"] = msg["created_by"];
		context["timeline-item-message"] = msg["message"];
		var reactions = [];
		var responses = msg['responses'];
		Object.keys(responses).sort().forEach(function(resType, i, a) {
			var responderUserIds = responses[resType];
			var responseInfo = {};
			responseInfo['reaction-type'] = resType;
			responseInfo['reaction-icon-class'] = "foundicon-" + resType;
			responseInfo['reaction-count'] = responderUserIds.length;
			reactions.push(responseInfo);
		});
		context["reactions"] = reactions;
		var generated = tmpl.render(context);
		return generated;
	}

	function updateTimelineItemReaction(msg) {
		var msgId = msg['_id'];
		var reactionPanels = $("article.msg_" + msgId + " div.reaction-panel");
		var responses = msg['responses'];
		Object.keys(responses).forEach(function(resType, i, a) {
			var responderUserIds = responses[resType];
			reactionPanels.find("a.reaction-count[reaction-type=" + resType + "]").text(responderUserIds.length);
		});
	}

	function refreshMessage(messageId) {
		var url = atmos.createUrl("/messages/search");
		var method = 'GET';
		var data = { "message_ids" : messageId };
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] === 1) {
						var tlItem = tlResult['results'][0];
						updateTimelineItemReaction(tlItem);
					}
				}
			},
			this
		);
		var failureCallback = new CallbackInfo(
			function(xhr, textStatus, errorThrown) {
				console.log(errorThrown);
			},
			this
		);
		atmos.sendRequest(
			url,
			method,
			data,
			successCallback,
			failureCallback
		);
	}

	createAtmosTimeline = function(id, name, description, url, searchCondition) {
		return new AtmosTimeline(id, name, description, url, searchCondition);
	}

})();
