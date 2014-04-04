var AtmosPrivateTimeline = (function() {
	function AtmosPrivateTimeline(id, rootId, name, description, url, searchCondition, callbackAfterConversation) {
		AtmosTimeline.apply(this, [ id, rootId, name, description, url, searchCondition, callbackAfterConversation ]);
		this._searchUrl = atmos.createUrl('/private/search');
	}
	AtmosPrivateTimeline.prototype = Object.create(AtmosTimeline.prototype);
	AtmosPrivateTimeline.prototype.constructor = AtmosPrivateTimeline;

	AtmosPrivateTimeline.prototype.createTimelineItem = function(msg) {
		var context = {};
		context["is-private-message"] = true;
		var privateAddresses = msg["to_user_id"];
		if (!privateAddresses.map) {
			privateAddresses = [ privateAddresses ];
		}
		context["private-message-addresses"] = privateAddresses.map(function(toUserId) { return { "private-message-to-user-id" : toUserId }; });
		context["is-own-message"] = atmos.currentUserId() === msg['created_by'];
		context["timeline-item-message-id"] = msg['_id'];
		context["timeline-item-timestamp"] = utc2jstRelative(msg['created_at']);
		context["timeline-item-avator-img-url"] = atmos.createUrl("/user/avator") + "?user_id=" + msg["created_by"] + '&image_width=48&image_height=48';
		context["timeline-item-username"] = msg["created_by"];
		context["timeline-item-created-at"] = msg["created_at"];
		context["timeline-item-message"] = msg["message"];
		context["timeline-item-to-user-ids"] = privateAddresses.map(function(toUserId) { return '@' + toUserId; }).join(' ');
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
		return Hogan.compile($("#tmpl-timeline-item-wrapper").text()).render(context);
	}

	AtmosPrivateTimeline.prototype.applyItemEvents = function($timelineItems) {
		var that = this;
		$timelineItems.on('click', 'div.timeline-item-user', function(e) {
			e.stopPropagation();
			atmos.showProfileDialog($(e.target).find('div.timeline-item-username').text());
		});
		$timelineItems.on('click', 'div.timeline-item-address span', function(e) {
			e.stopPropagation();
			atmos.showProfileDialog($(e.target).text());
		});
		$timelineItems.on('click', 'a.reaction', function(e) {
			e.stopPropagation();
			var targetLink = e.currentTarget;
			var $base = $(targetLink).parent().parent();
			var targetMessageId = $base.find('input[name=message-id]').val();
			var targetMessageBody = $base.find('input[name=message-body]').val();
			var reactionType = $(targetLink).attr('reaction-type');
			atmos.showResponseDialog(targetMessageId, reactionType, targetMessageBody, true);
		});
		$timelineItems.on('click', 'a.reply', function(e) {
			e.stopPropagation();
			var targetLink = e.currentTarget;
			var $base = $(targetLink).parent().parent();
			var targetMessageId = $base.find('input[name=message-id]').val();
			var targetMessageBody = $base.find('input[name=message-body]').val();
			var toUserIds = $base.find('input[name=message-to-user-ids]').val();
			var originalMsgCreatedBy = $base.find('input[name=message-created-by]').val();

			var addresses = toUserIds.split(' ');
			addresses.push('@' + originalMsgCreatedBy);
			addresses = addresses.filter(function(v) { return v !== '@' + atmos.currentUserId(); });

			var replyType = $(targetLink).attr('reply-type');
			var defaultMessage = '';
			if (replyType === 'quote') {
				defaultMessage = targetMessageBody;
			}
			atmos.showMessageSenderPanel(defaultMessage, targetMessageId, targetMessageBody, addresses, true);
		});
		$timelineItems.on('click', 'a.show-conversation', function(e) {
			e.stopPropagation();
			var targetMessageId = $(e.currentTarget).parent().parent().find('input[name=message-id]').val();
			that._conversation = new AtmosPrivateConversation(that.id() + '_conversation', targetMessageId);

			var closeHandler = function(conversationPanel) {
				var t = conversationPanel;
				t.hide("normal", function() { t.close(); that._conversation = undefined; });
				if (canl(that._callbackAfterConversation)) {
					that.show("normal", that._callbackAfterConversation);
				}
				else {
					that.show("normal");
				}
			}
			that._conversation.init($("#" + that.rootId()), closeHandler);
			if (canl(that._callbackAfterConversation)) {
				that.hide("normal", that._callbackAfterConversation);
			}
			else {
				that.hide("normal");
			}
			that._conversation.show("normal");
		});
		$timelineItems.on('click', 'a.remove', function(e) {
			e.stopPropagation();
			var targetLink = e.currentTarget;
			var $base = $(targetLink).parent().parent();
			var targetMessageId = $base.find('input[name=message-id]').val();
			var targetMessageBody = $base.find('input[name=message-body]').val();
			atmos.showMessageRemoveDialog(targetMessageId, targetMessageBody, true);
		});
	}

	return AtmosPrivateTimeline;
})();
