var AtmosPrivateConversation = (function() {
	function AtmosPrivateConversation(id, messageId) {
		AtmosConversation.apply(this, [ id, messageId ]);
		this._searchUrl = atmos.createUrl('/private/search');
	};
	AtmosPrivateConversation.prototype = Object.create(AtmosConversation.prototype);
	AtmosPrivateConversation.prototype.constructor = AtmosPrivateConversation;

	AtmosPrivateConversation.prototype.createConversationItem = function(msg, isMain) {
		var context = {};
		context["is-private-message"] = true;
		var privateAddresses = msg["to_user_id"];
		if (!privateAddresses.map) {
			privateAddresses = [ privateAddresses ];
		}
		context["private-message-addresses"] = privateAddresses.map(function(toUserId) { return { "private-message-to-user-id" : toUserId }; });
		context["is-own-message"] = atmos.currentUserId() === msg['created_by'];
		context["conversation-item-message-id"] = msg['_id'];
		context["conversation-item-timestamp"] = utc2jstRelative(msg['created_at']);
		context["conversation-item-avator-img-url"] = atmos.createUrl("/user/avator") + "?user_id=" + msg["created_by"] + '&image_width=48&image_height=48';
		context["conversation-item-username"] = msg["created_by"];
		context["conversation-item-message"] = msg["message"];
		var addresses = msg["addresses"];
		if (can(addresses)) {
			var addressUsers = addresses['users'];
			if (can(addressUsers)) {
				context["conversation-item-address-users"] = addressUsers.map(function(addressUser) { return '@' + addressUser; }).join(' ');
			}
			var addressGroups = addresses['groups'];
			if (can(addressGroups)) {
				context["conversation-item-address-groups"] = addressGroups.map(function(addressGroup) { return '$' + addressGroup; }).join(' ');
			}
		}
		var reactions = [];
		var responses = msg['responses'];
		Object.keys(responses).sort().forEach(function(resType, i, a) {
			var responderUserIds = responses[resType];
			var responseInfo = {};
			responseInfo['reaction-type'] = resType;
			responseInfo['reaction-icon-class'] = "atmos-icon-action-" + resType;
			responseInfo['reaction-count'] = responderUserIds.length;
			reactions.push(responseInfo);
		});
		context["reactions"] = reactions;
		if (isMain) {
			var tmplId = 'tmpl-conversation-item-wrapper-main';
		}
		else {
			var tmplId = 'tmpl-conversation-item-wrapper';
		}
		return Hogan.compile($('#' + tmplId).text()).render(context);
	};

	AtmosPrivateConversation.prototype.applyItemEvents = function($conversationItems) {
		$conversationItems.on('click', 'a.reaction', function(e) {
			var targetLink = e.currentTarget;
			var $base = $(targetLink).parent().parent();
			var targetMessageId = $base.find('input[name=message-id]').val();
			var targetMessageBody = $base.find('input[name=message-body]').val();
			var reactionType = $(targetLink).attr('reaction-type');
			atmos.showResponseDialog(targetMessageId, reactionType, targetMessageBody, true);
		});
		$conversationItems.on('click', 'div.conversation-item-user', function(e) {
			e.stopPropagation();
			atmos.showProfileDialog($(e.target).parents('.conversation-item-wrapper').find('div.conversation-item-username').text());
		});
		$conversationItems.on('click', 'header.conversation-item-header > div.conversation-item-username', function(e) {
			e.stopPropagation();
			atmos.showProfileDialog($(e.target).text());
		});
		$conversationItems.on('click', 'div.conversation-item-address span', function(e) {
			e.stopPropagation();
			atmos.showProfileDialog($(e.target).text());
		});
		$conversationItems.on('click', 'a.reply', function(e) {
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
		$conversationItems.on('click', 'a.remove', function(e) {
			var targetLink = e.currentTarget;
			var $base = $(targetLink).parent().parent();
			var targetMessageId = $base.find('input[name=message-id]').val();
			var targetMessageBody = $base.find('input[name=message-body]').val();
			atmos.showMessageRemoveDialog(targetMessageId, targetMessageBody, true);
		});
	}

	return AtmosPrivateConversation;
})();
