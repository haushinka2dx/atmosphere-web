var atmos = null;

(function() {
	function Atmos() {
		this.baseUrl = '/atmos';
		this._timelines = {};
		this._privateTimelines = {};
		this._allUserIds = [];
		this._allGroupIds = [];
		this._sockjs = createAtmosSockJS();
		this._timelineCount = 50;
		this._timelineRootIds = [
			'tl_global_timeline-root',
			'tl_talk_timeline-root',
			'tl_private_timeline-root',
		];
		this.__desktopNotifier = new DesktopNotification();
	};
	Atmos.prototype = {
		atmosSessionId : atmosSessionId,
		currentUserId : currentUserId,
		createUrl : createUrl,
		sendRequest : sendRequest,
		login : login,
		whoami : whoami,
		logout : logout,
		changePassword : changePassword,
		changeProfile : changeProfile,
		changeNotificationSettings : changeNotificationSettings,
		loadAllUserIds : loadAllUserIds,
		loadAllGroupIds : loadAllGroupIds,
		sendMessage : sendMessage,
		removeMessage : removeMessage,
		sendPrivate : sendPrivate,
		responseToMessage : responseToMessage,
		getTimelines : getTimelines,
		getTimeline : getTimeline,
		getPrivateTimelines : getPrivateTimelines,
		getPrivateTimeline : getPrivateTimeline,
		addTimeline : addTimeline,
		addPrivateTimeline : addPrivateTimeline,
		showLoginDialog : showLoginDialog,
		showLogoutDialog : showLogoutDialog,
		showDesktopNotificationConfirmDialog : showDesktopNotificationConfirmDialog,
		showPasswordChangeDialog : showPasswordChangeDialog,
		showAvatorChangeDialog : showAvatorChangeDialog,
		showProfileChangeDialog : showProfileChangeDialog,
		showNotificationSettingsChangeDialog : showNotificationSettingsChangeDialog,
		showMessageSenderDialog : showMessageSenderDialog,
		showMessageRemoveDialog : showMessageRemoveDialog,
		showPrivateMessageSenderDialog : showPrivateMessageSenderDialog,
		showResponseDialog : showResponseDialog,
		showMessageSenderPanel : showMessageSenderPanel,
		showProfileDialog : showProfileDialog,
		showSettingDialog : showSettingDialog,
		loadTimelineDefinitions : loadTimelineDefinitions,
		createTimelineItem : createTimelineItem,
		createTimelines : createTimelines,
		init : init,
		initSockJS : initSockJS,
		initScrollbars : initScrollbars,
		processServerNotification : processServerNotification,
		refreshTimelines : refreshTimelines,
		refreshPrivateTimelines : refreshPrivateTimelines,
		allUserIds : allUserIds,
		allGroupIds : allGroupIds,
		clearCurrentInfo : clearCurrentInfo,
		perfectScrollbarSetting : { wheelSpeed: 70, minScrollbarLength: 100 },
		applyAutoComplete : applyAutoComplete,
		showDesktopNotification : showDesktopNotification,
	}

	function atmosSessionId(id) {
		if (canl(id)) {
			this._atmosAuthSessionId = id;
		}
		return this._atmosAuthSessionId;
	}

	function currentUserId(userId) {
		if (canl(userId)) {
			this._atmosCurrentUserId = userId;
		}
		return this._atmosCurrentUserId;
	}

	function createUrl(path) {
		return this.baseUrl + path;
	}

	// try login
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function login(id, pw, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var loginResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (loginResult['status'] === 'login successful') {
					resultStatus = 'ok';
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback);
		this.sendRequest(this.createUrl('/auth/login'), 'POST', { user_id: id, password: pw }, successCallback, failureCallback);
	}

	// determine who am I
	// callback(when successed): { "status":"ok", "user_id":user id of current user }
	// callback(when failed): { "status":"error" }
	function whoami(callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var whoamiResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (whoamiResult['status'] === 'ok') {
					resultStatus = 'ok';
					resultUserId = whoamiResult['user_id'];
					this.currentUserId(resultUserId);
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callbackResult['user_id'] = resultUserId;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback);
		this.sendRequest(this.createUrl('/auth/whoami'), 'GET', {}, successCallback, failureCallback);
	}

	// logout
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function logout() {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var logoutResult = JSON.parse(res);
				if (logoutResult['status'] === 'ok' || textStatus == 401) {
					this.clearCurrentInfo();
					this.init();
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
		this.sendRequest(this.createUrl('/auth/logout'), 'GET', {}, successCallback, failureCallback);
	}

	// change password
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function changePassword(currentPassword, newPassword, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var changedResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (changedResult['status'] === 'ok') {
					resultStatus = 'ok';
					showSuccessNotification('Changing password was done successfully.');
				}
				else {
					showErrorNotification('Changing password was failed.');
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Changing password was failed.');
		this.sendRequest(this.createUrl('/user/change_password'), 'POST', { current_user_password : currentPassword, new_user_password : newPassword }, successCallback, failureCallback);
	}

	function changeProfile(newProfileInfo, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var changedResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (changedResult['status'] === 'ok') {
					resultStatus = 'ok';
					showSuccessNotification('Changing profile was done successfully.');
				}
				else {
					showErrorNotification('Changing profile was failed.');
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Changing profile was failed.');
		this.sendRequest(this.createUrl('/user/change_profile'), 'POST', newProfileInfo, successCallback, failureCallback);
	}

	function changeNotificationSettings(newNotificationSettings, callback) {
		AtmosSettings.Desktop.closeTimeoutSeconds(newNotificationSettings['new-timeout-seconds']);
		showSuccessNotification('Notification settings were changed.');
		if (can(callback)) {
			callback.fire({'status':'ok'});
		}
	}

	// obtain all user id(s)
	function loadAllUserIds(callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var result = JSON.parse(res);
				var resultStatus = 'ng';
				if (result['status'] === 'ok') {
					resultStatus = 'ok';
					this.allUserIds(result['results'].map(function(u) { return u['user_id']; }));
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback);
		this.sendRequest(this.createUrl('/user/list'), 'GET', {}, successCallback, failureCallback);
	}

	// obtain all group id(s)
	function loadAllGroupIds(callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var result = JSON.parse(res);
				var resultStatus = 'ng';
				if (result['status'] === 'ok') {
					resultStatus = 'ok';
					this.allGroupIds(result['results'].map(function(g) { return g['group_id']; }));
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback);
		this.sendRequest(this.createUrl('/group/list'), 'GET', {}, successCallback, failureCallback);
	}

	// send message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function sendMessage(message, messageType, replyToMessageId, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var sendResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (sendResult['status'] === 'ok') {
					resultStatus = 'ok';
					showSuccessNotification('Message was sent successfully.', {
						cancel: {
							label: 'Cancel!!',
							action: function() {
								atmos.removeMessage(sendResult["_id"], false);
							}
						}
					});
				}
				else {
					showErrorNotification('Message was not sent.');
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Message was not sent.');
		this.sendRequest(this.createUrl('/messages/send'), 'POST', { message : message, message_type : messageType, reply_to : replyToMessageId }, successCallback, failureCallback);
	}

	// remove  message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function removeMessage(targetMessageId, isPrivate, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var sendResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (sendResult['status'] === 'ok') {
					resultStatus = 'ok';
					showSuccessNotification('Message was removed successfully.');
				}
				else {
					showErrorNotification('Message was not removed. ' + sendResult['message']);
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Message was not removed.');
		if (isPrivate) {
			this.sendRequest(this.createUrl('/private/destroy'), 'POST', { _id: targetMessageId }, successCallback, failureCallback);
		}
		else {
			this.sendRequest(this.createUrl('/messages/destroy'), 'POST', { _id: targetMessageId }, successCallback, failureCallback);
		}
	}

	// send message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function sendPrivate(addressUserIds, message, replyToMessageId, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var sendResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (sendResult['status'] === 'ok') {
					resultStatus = 'ok';
					showSuccessNotification('Private Message was sent successfully.', {
						cancel: {
							label: 'Cancel!!',
							action: function() {
								atmos.removeMessage(sendResult["_id"], true);
							}
						}
					});
				}
				else {
					showErrorNotification('Private Message was not sent.');
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Private Message was not sent.');
		this.sendRequest(this.createUrl('/private/send'), 'POST', { to_user_id : addressUserIds, message : message, reply_to : replyToMessageId }, successCallback, failureCallback);
	}

	// response to message
	// callback(when successed): { "status":"ok" }
	// callback(when failed): { "status":"error" }
	function responseToMessage(targetMessageId, reactionType, isPrivate, callback) {
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var sendResult = JSON.parse(res);
				var resultStatus = 'ng';
				if (sendResult['status'] === 'ok') {
					resultStatus = 'ok';
					showSuccessNotification('Responding to Message was succeeded.');
				}
				else {
					showErrorNotification('Responding to Message was failed.');
				}
				if (can(callback)) {
					var callbackResult = {};
					callbackResult['status'] = resultStatus;
					callback.fire(callbackResult);
				}
			},
			this
		);
		var failureCallback = createDefaultFailureCallback(this, callback, 'Responding to Message was failed.');
		if (isPrivate) {
			this.sendRequest(this.createUrl('/private/response'), 'POST', { target_id : targetMessageId, action : reactionType }, successCallback, failureCallback);
		}
		else {
			this.sendRequest(this.createUrl('/messages/response'), 'POST', { target_id : targetMessageId, action : reactionType }, successCallback, failureCallback);
		}
	}

	function getTimelines() {
		var that = this;
		var tls = [];
		Object.keys(that._timelines).forEach(function(key) {
			tls.push(that._timelines[key]);
		});
		return tls;
	}

	function getTimeline(timelineId) {
		return this._timelines[timelineId];
	}

	function getPrivateTimelines() {
		var that = this;
		var tls = [];
		Object.keys(that._privateTimelines).forEach(function(key) {
			tls.push(that._privateTimelines[key]);
		});
		return tls;
	}

	function getPrivateTimeline(timelineId) {
		return this._privateTimelines[timelineId];
	}

	function showLoginDialog(message, defaultUserId) {
		(new AtmosDialog(
			'Atmosphere',
			[ can(message) ? message : ''],
			[ {"input-type":"text", "input-place-holder":"user id", "input-name":"user_id", "input-value":defaultUserId },
			  {"input-type":"password", "input-place-holder":"password", "input-name":"password", "input-value":"" } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var userId = result['inputs']['user_id'];
					var password = result['inputs']['password'];
					var postLogin = new CallbackInfo(
						function(res) {
							if (can(res) && res['status'] === 'ok') {
								this.init();
							}
							else {
								this.showLoginDialog('Login failed.  Please confirm user id or password, or both.', userId);
							}
						},
						atmos
					);
					atmos.login(userId, password, postLogin);
				}
			}
		)).show();
	}

	function showLogoutDialog(message, defaultUserId) {
		(new AtmosDialog(
			'Logout?',
			[ ],
			[ ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					atmos.logout();
				}
			}
		)).show();
	}

	function showDesktopNotificationConfirmDialog(nextCallbackInfo) {
		if (this.__desktopNotifier.requiresConfirmation()) {
			(new AtmosDialog(
				'Enable Desktop Notification?',
				[ 'Are you sure you want to enable Desktop Notification?', 'A notification will be shown if the browser is background.' ],
				[ ],
				true,
				function(result) {
					if (result['action'] === 'ok') {
						console.log(atmos.__desktopNotifier);
						atmos.__desktopNotifier.confirmPermission();
					}
					if (can(nextCallbackInfo)) {
						nextCallbackInfo.fire();
					}
				}
			)).show();
		}
		else {
			if (can(nextCallbackInfo)) {
				nextCallbackInfo.fire();
			}
		}
	}

	function showPasswordChangeDialog(message) {
		(new AtmosDialog(
			'Change password',
			[ can(message) ? message : '' ],
			[ {"input-type":"password", "input-place-holder":"current password", "input-name":"current-password", "input-value":"" },
			  {"input-type":"password", "input-place-holder":"New password", "input-name":"new-password", "input-value":"" } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var currentPassword = result['inputs']['current-password'];
					var newPassword = result['inputs']['new-password'];
					var postChange = new CallbackInfo(
						function(res) {
							if (can(res) && res['status'] === 'ok') {
							}
							else {
								this.showPasswordChangeDialog('Changing password was failed. ' + res['message']);
							}
						},
						atmos
					);
					atmos.changePassword(currentPassword, newPassword, postChange);
				}
			}
		)).show();
	}

	function showAvatorChangeDialog() {
		var that = this;
		var dialog = new AtmosDialog(
			'Change avator',
			[  ],
			[ {"input-type":"file", "input-place-holder":"", "input-name":"profileImage", "input-value":null } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var avatorFilePath = result['inputs']['profileImage'];
					if (can(avatorFilePath)) {
						$("#" + dialog.id()).upload(
							that.createUrl('/user/change_avator'),
							function(res) {
								showInfoNotification(res);
							},
							'json'
						);
					}
				}
			}
		)
		dialog.show();
	}

	function showProfileChangeDialog(profileInfo, message) {
		(new AtmosDialog(
			'Change Profile',
			[ can(message) ? message : '' ],
			[ {"is-textarea":true, "input-place-holder":"introduction", "input-name":"new_introduction", "input-id":"inputted-new-introduction", "input-value":profileInfo.introduction } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var newProfileInfo = {};
					Object.keys(result['inputs']).forEach(function (key, i, a) { newProfileInfo[key] = result['inputs'][key]; });
					var postChange = new CallbackInfo(
						function(res) {
							if (can(res) && res['status'] === 'ok') {
							}
							else {
								this.showPasswordChangeDialog('Changing profile was failed. ' + res['message']);
							}
						},
						atmos
					);
					atmos.changeProfile(newProfileInfo, postChange);
				}
			}
		)).show();
	}

	function showNotificationSettingsChangeDialog(notificationSetitings, message) {
		(new AtmosDialog(
			'Notification Settings',
			[ can(message) ? message : '' ],
			[
				{"input-label-text":"timeout second(s) untill automatically closed"},
				{"is-textarea":false, "input-type":"text", "input-place-holder":"timeout second(s) automatically closed", "input-name":"new-timeout-seconds", "input-id":"inputted-new-timeout-seconds", "input-value":notificationSetitings.timeoutSeconds },
				{"input-label-text":"Set blank or 0 if you want not to close automatically."},
			],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var newNotificationSettings = {};
					Object.keys(result['inputs']).forEach(function (key, i, a) { newNotificationSettings[key] = result['inputs'][key]; });
					var postChange = new CallbackInfo(
						function(res) {
							if (can(res) && res['status'] === 'ok') {
							}
							else {
								this.showNotificationSettingsChangeDialog(newNotificationSettings, 'Changing notification settings was failed. ' + res['message']);
							}
						},
						atmos
					);
					atmos.changeNotificationSettings(newNotificationSettings, postChange);
				}
			}
		)).show();
	}

	function showMessageSenderDialog(defaultMessage, replyToMessageId, originalMessageBody, addresses) {
		var msgs = [];
		if (can(replyToMessageId)) {
			msgs.push('Reply to');
			msgs.push('');
			msgs.push(originalMessageBody);
		}
		if (!can(defaultMessage)) {
			defaultMessage = '';
		}
		if (can(addresses)) {
			for (var i=0; i<addresses.length; i++) {
				if (defaultMessage.indexOf(addresses[i]) === -1) {
					defaultMessage = addresses[i] + ' ' + defaultMessage;
				}
			}
		}
		(new AtmosDialog(
			'Send Message',
			msgs,
			[ {"is-textarea":true, "input-place-holder":"message", "input-name":"message", "input-id":"inputted-message", "input-value":defaultMessage } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var message = result['inputs']['message'];
					var messageType = result['inputs']['message-type'];
					atmos.sendMessage(message, messageType, replyToMessageId);
				}
			}
		)).show();
	}

	function showMessageRemoveDialog(targetMessageId, targetMessageBody, isPrivate) {
		if (isPrivate) {
			var title = 'Remove Private Message';
		}
		else {
			var title = 'Remove Message';
		}
		var msgs = [];
		msgs.push('Are you sure to remove message?');
		msgs.push('');
		msgs.push(targetMessageBody);
		(new AtmosDialog(
			title,
			msgs,
			[ ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					atmos.removeMessage(targetMessageId, isPrivate);
				}
			}
		)).show(isPrivate);
	}

	function showPrivateMessageSenderDialog(addressUserId, defaultMessage, replyToMessageId, originalMessageBody) {
		var msgs = [];
		if (can(replyToMessageId)) {
			msgs.push('Reply to');
			msgs.push('');
			msgs.push(originalMessageBody);
		}
		(new AtmosDialog(
			'Send Private',
			msgs,
			[ {"is-textarea":false, "input-type":"text", "input-place-holder":"user id of destination", "input-name":"address-user-id", "input-id":"inputted-address-user-id", "input-value":addressUserId },
			  {"is-textarea":true, "input-place-holder":"message", "input-name":"message", "input-id":"inputted-message", "input-value":defaultMessage } ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					var dstUserId = result['inputs']['address-user-id'];
					var message = result['inputs']['message'];
					atmos.sendPrivate(dstUserId, message);
				}
			}
		)).show(true);
	}

	function showResponseDialog(targetMessageId, reactionType, messageBody, isPrivate) {
		(new AtmosDialog(
			'Response',
			[ 'Are you sure to response "' + reactionType + '" ?',
			  '',
			  messageBody, ],
			[ ],
			true,
			function(result) {
				if (result['action'] === 'ok') {
					atmos.responseToMessage(targetMessageId, reactionType, isPrivate);
				}
			}
		)).show(isPrivate);
	}

	function showMessageSenderPanel(defaultMessage, replyToMsgId, replyToMessage, addresses, isPrivate) {
		var that = this;
		if (!can(this._senderPanel)) {
			var id = 'sender-panel-' + uuid()
			this._senderPanel = createAtmosSenderPanel(id, $("div.contents-wrapper:first"), function() { that._senderPanel = undefined; });
		}
		if (isPrivate) {
			this._senderPanel.setVariablesForPrivateMessage(defaultMessage, replyToMsgId, replyToMessage, addresses);
		}
		else {
			this._senderPanel.setVariablesForNormalMessage(defaultMessage, replyToMsgId, replyToMessage, addresses);
		}
		this._senderPanel.show("normal", this.initScrollbars.bind(this));
	}

	function showProfileDialog(userId) {
		if (can(this._currentProfileDialog)) {
			this._currentProfileDialog.close();
			this._currentProfileDialog = undefined;
		}
		var profile = new AtmosProfile(userId);
		var show = new CallbackInfo(
			function(res) {
				if(res.status === 'ok') {
					profile.show('fast');
				}
				else {
					showErrorNotification('Failed to show profile.');
				}
			},
			this
		);
		profile.init(show);
		this._currentProfileDialog = profile;
	}

	function showSettingDialog() {
		this.showProfileDialog(this.currentUserId());
	}

	function sendRequest(url, method, dataJSON, successCallback, failureCallback) {
		var that = this;

		//set atmosphere-session-id to request header if has sessionId.
		var reqHeaders = {};
		if (can(that.atmosSessionId())) {
			reqHeaders['atmosphere-session-id'] = that.atmosSessionId();
		}

		var reqData = null;
		if (method === 'GET') {
			var query = '';
			Object.keys(dataJSON).forEach(function(pName, pIndex, pArray) {
				if (query.length > 0) {
					query += '&';
				}
				query += pName + '=' + dataJSON[pName];
			});
			reqData = query;
		}
		else {
			if (Object.keys(dataJSON).length > 0) {
				reqData = JSON.stringify(dataJSON);
			}
		}

	    var requestParams = {
	        url: url,
	        type: method,
//	        dataType: 'json',
	        dataType: 'text',
	        data: reqData,
			cache: false,
	        headers: reqHeaders
	    };
	
	    $.ajax(requestParams)
	    .done(function(data, textStatus, xhr){
	        var sessionId = xhr.getResponseHeader('atmosphere-session-id');
	        that.atmosSessionId(sessionId);

			if (can(successCallback)) {
				successCallback.fire(data, textStatus, xhr);
			}
	    })
	    .fail(function(xhr, textStatus, errorThrown){
			if (can(failureCallback)) {
				failureCallback.fire(xhr, textStatus, errorThrown);
			}
			else {
				console.log(errorThrown);
			}
	    })
	    .always(function(xhr, textStatus, errorThrown){
	        //window.console.debug(textStatus);
	    });
	}

	function createTimelineItem(msg) {
		var tmpl = Hogan.compile($("#tmpl-timeline-item-wrapper").text());
		var context = {};
		context["timeline-item-timestamp"] = utc2jst(msg['created_at']);
		context["timeline-item-avator-img-url"] = this.createUrl("/user/avator") + "?user_id=" + msg["created_by"];
		context["timeline-item-username"] = msg["created_by"];
		context["timeline-item-message"] = msg["message"];
		var reactions = [];
		var responses = msg['responses'];
		Object.keys(responses).sort().forEach(function(resType, i, a) {
			var responderUserIds = responses[resType];
			var responseInfo = {};
			responseInfo['reaction-icon-class'] = "foundicon-" + resType;
			responseInfo['reaction-count'] = responderUserIds.length;
			reactions.push(responseInfo);
		});
		context["reactions"] = reactions;
		var generated = tmpl.render(context);
		return generated;
	}

	function createTimelineOutline(timelineRootId, timelineId, timelineTitle, timelineRowClass) {
		return Hogan.compile($("#tmpl-timeline").text()).render({
			"timeline-row-class": timelineRowClass,
			"timeline-root-id": timelineRootId,
			"timeline-title": timelineTitle,
			"timeline-id": timelineId,
		});
	}

	function loadTimelineDefinitions() {
		// load from settings
		var allTimelineDefs = AtmosSettings.Timeline.timelineDefinitions();

		// extract timeline definitions that can be handled
		var targetTimelineRootIds = this._timelineRootIds;
		var timelineRootIds = Object.keys(allTimelineDefs).filter(function(timelineRootId) {
			return targetTimelineRootIds.indexOf(timelineRootId) > -1;
		});
		var timelineDefs = [];
		timelineRootIds.forEach(function(timelineRootId) { timelineDefs.push(allTimelineDefs[timelineRootId]); });
		
		// sort timeline definition
		var timelineOrder = AtmosSettings.Timeline.timelineOrder();
		timelineDefs.sort(function(left, right) {
			var leftOrder = timelineOrder[left['root-id']];
			var rightOrder = timelineOrder[right['root-id']];
			if (typeof leftOrder === 'undefined' && typeof rightOrder === 'undefined') {
				return 0;
			}
			else if (typeof leftOrder === 'undefined') {
				return -1;
			}
			else if (typeof rightOrder === 'undefined') {
				return 1;
			}
			else if (leftOrder < rightOrder) {
				return -1;
			}
			else if (leftOrder > rightOrder) {
				return 1;
			}
			else {
				return 0;
			}
		});

		return timelineDefs;
	}

	function createTimelines() {
		var changePositionStatusChanger = changeTimelinePositionLinkStatus.bind(this);

		this.loadTimelineDefinitions().forEach(function(timelineDef) {
			$("div.contents-wrapper > div.contents").append(createTimelineOutline(
				timelineDef["root-id"],
				timelineDef["id"],
				timelineDef["name"],
				timelineDef["theme"]
			));
		});
		$(".timeline-move-position.move-left > a").on('click', function(e) {
			e.stopPropagation();
			var $timelineRoot = $(e.currentTarget).parent().parent().parent().parent();
			var $leftRoot = $timelineRoot.prev('.timeline');
			$leftRoot.before($timelineRoot);
			changePositionStatusChanger($(".contents > .timeline"));
			storeTimelineOrder($(".contents > .timeline"));
		});
		$(".timeline-move-position.move-right > a").on('click', function(e) {
			e.stopPropagation();
			var $timelineRoot = $(e.currentTarget).parent().parent().parent().parent();
			var $rightRoot = $timelineRoot.next('.timeline');
			$rightRoot.after($timelineRoot);
			changePositionStatusChanger($(".contents > .timeline"));
			storeTimelineOrder($(".contents > .timeline"));
		});
	}

	function storeTimelineOrder($timelines) {
		var timelineOrder = {};
		$timelines.each(function(index, timeline) { timelineOrder[$(timeline).attr('id')] = index + 1; });
		AtmosSettings.Timeline.timelineOrder(timelineOrder);
	}

	function changeTimelinePositionLinkStatus($timelines) {
		var that = this;
		$timelines.each(function(index, timeline) {
			$timeline = $(timeline);
			var timelineId = $timeline.find(".timeline-items:first").attr("id");
			var timeline = that.getTimeline(timelineId);
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

	function init() {
		$('.timeline-items').empty();
		if (!can(atmosSessionId())) {
			var sessionIdInCookie = $.cookie('atmosphere-session-id');
			if (can(sessionIdInCookie)) {
				this.atmosSessionId(sessionIdInCookie);
				var whoamiCallback = new CallbackInfo(
					function(res) {
						if (res['status'] === 'ok') {
							var initCallback = new CallbackInfo(
								function() {
									this.loadAllUserIds();
									this.loadAllGroupIds();
									this.refreshTimelines();
									this.refreshPrivateTimelines();
									this.initSockJS();
								},
								this
							);
							this.showDesktopNotificationConfirmDialog(initCallback);
						}
						else {
							this.showLoginDialog();
						}
					},
					this
				);
				this.whoami(whoamiCallback);
			}
			else {
				this.showLoginDialog();
			}
		}

		var timelinePositionChangeLinkStatusChanger = changeTimelinePositionLinkStatus.bind(this, $(".contents > .timeline"));

		// defines timelines
		var scGlobal = createAtmosSearchCondition();
		scGlobal.count(this._timelineCount);
		var tlGlobal = new AtmosTimeline('tl_global_timeline', 'Global', 'all messages', this.createUrl('/messages/global_timeline'), scGlobal, timelinePositionChangeLinkStatusChanger);
		this.addTimeline(tlGlobal);

		var scTalk = createAtmosSearchCondition();
		scTalk.count(this._timelineCount);
		var tlTalk = new AtmosTimeline('tl_talk_timeline', 'Talk', '', this.createUrl('/messages/talk_timeline'), scTalk, timelinePositionChangeLinkStatusChanger);
		this.addTimeline(tlTalk);

		var scPrivate = createAtmosSearchCondition();
		scPrivate.count(this._timelineCount);
		var tlPrivate = new AtmosPrivateTimeline('tl_private_timeline', 'Private', '', this.createUrl('/private/timeline'), scPrivate, timelinePositionChangeLinkStatusChanger);
		this.addPrivateTimeline(tlPrivate);

		timelinePositionChangeLinkStatusChanger();

		this.initScrollbars();
	}

	function initSockJS() {
		this._sockjs.end();
		this._sockjs.addNotificationReceiver(new CallbackInfo(this.processServerNotification, this));
		this._sockjs.start(this.atmosSessionId());
	}

	function initScrollbars() {
		$('.contents').perfectScrollbar(atmos.perfectScrollbarSetting);
		this.getTimelines().forEach(function(tl) { tl.setScrollbar(); });
		this.getPrivateTimelines().forEach(function(tl) { tl.setScrollbar(); });
	}

	function processServerNotification(msgJSON) {
		if (msgJSON['action'] === 'sendResponse') {
			var targetMsgId = msgJSON['info']['target_msg_id'];
			this.getTimelines().forEach(function(tl) { tl.refreshMessage(targetMsgId); });
			if (can(this._currentProfileDialog)) {
				this._currentProfileDialog.refreshMessage(targetMsgId);
			}
		}
		else if (msgJSON['action'] === 'sendMessage') {
			this.refreshTimelines();
		}
		else if (msgJSON['action'] === 'removedMessage') {
			var removedMsgId = msgJSON['info']['_id'];
			this.getTimelines().forEach(function(tl) { tl.removeMessage(removedMsgId); });
			if (can(this._currentProfileDialog)) {
				this._currentProfileDialog.removeMessage(removedMsgId);
			}
		}
		else if (msgJSON['action'] === 'sendResponsePrivate') {
			var targetMsgId = msgJSON['info']['target_msg_id'];
			this.getPrivateTimelines().forEach(function(tl) { tl.refreshMessage(targetMsgId); });
		}
		else if (msgJSON['action'] === 'sendPrivate') {
			this.refreshPrivateTimelines();
		}
		else if (msgJSON['action'] === 'removedPrivate') {
			var removedMsgId = msgJSON['info']['_id'];
			this.getPrivateTimelines().forEach(function(tl) { tl.removeMessage(removedMsgId); });
		}

		var notificationInfoCreateCallback = new CallbackInfo(
			function(notificationInfo) {
				if (can(notificationInfo)) {
					this.showDesktopNotification(
						'Atmos: ' + notificationInfo.title,
						notificationInfo.body,
						notificationInfo.icon,
						notificationInfo.id
					);
				}
			},
			this
		);
		createNotificationInformation(msgJSON, notificationInfoCreateCallback);
	}

	function createNotificationInformation(msgJSON, callbackInfo) {
		if (!can(callbackInfo)) {
			return undefined;
		}
		if (!msgJSON['from_myself']) {
			var action = msgJSON['action'];
			switch (action) {
				case 'sendMessage':
					callbackInfo.fire(createSendMessageNotificationInfo(msgJSON, false));
					break;
				case 'sendPrivate':
					callbackInfo.fire(createSendMessageNotificationInfo(msgJSON, true));
					break;
				case 'sendResponse':
					var createResponseNotificationHandler = new CallbackInfo(
						function (notificationInfo) { callbackInfo.fire(notificationInfo); },
						this
					);
					callbackInfo.fire(createResponseNotificationInfo(createResponseNotificationHandler, msgJSON, false));
					break;
				case 'sendResponsePrivate':
					var createResponseNotificationHandler = new CallbackInfo(
						function (notificationInfo) { callbackInfo.fire(notificationInfo); },
						this
					);
					callbackInfo.fire(createResponseNotificationInfo(createResponseNotificationHandler, msgJSON, true));
					break;
				default:
					callbackInfo.fire(undefined);
					break;
			}
		}
	}

	function createSendMessageNotificationInfo(msgJSON, isPrivate) {
		var title = (isPrivate ? 'Private Msg' : 'Msg' ) + ' from ' + msgJSON['from']
		return {
			title: title,
			body: msgJSON['info']['message'],
			id: msgJSON['action'] + '_' + msgJSON['info']['target_msg_id'],
			icon: atmos.createUrl("/user/avator") + "?user_id=" + msgJSON["from"]
		};
	}

	function createResponseNotificationInfo(callbackInfo, msgJSON, isPrivate) {
		if (!can(callbackInfo)) {
			return;
		}
		var targetMsgId = msgJSON['info']['target_msg_id'];
		var successCallback = new CallbackInfo(
			function(res, textStatus, xhr) {
				var tlResult = JSON.parse(res);
				if (tlResult['status'] === 'ok') {
					if (tlResult['count'] === 1) {
						var tlItem = tlResult['results'][0];
						callbackInfo.fire({
							title: msgJSON['info']['action'] + ' by ' + msgJSON['from'],
							body: "from " + tlItem['created_by'] + ": " + tlItem['message'],
							id: msgJSON['action'] + '_' + targetMsgId + '_' + msgJSON['info']['action'] + '_' + msgJSON['from'],
							icon: atmos.createUrl("/user/avator") + "?user_id=" + msgJSON["from"]
						});
						return;
					}
				}
				callbackInfo.fire();
				return;
			},
			this
		);
		if (isPrivate) {
			var searchUrl = atmos.createUrl('/private/search');
		}
		else {
			var searchUrl = atmos.createUrl('/messages/search');
		}
		atmos.sendRequest(searchUrl, 'GET', { "message_ids" : targetMsgId }, successCallback);
	}

	function addTimeline(timeline) {
		if (can(timeline)) {
			var addedKey = timeline.id();
			var alreadyExists = false;
			Object.keys(this._timelines).forEach(function(key, i, a) {
				if (key === addedKey) {
					alreadyExists = true;
					return;
				}
			});

			if (!alreadyExists) {
				this._timelines[addedKey] = timeline;
			}
		}
	}

	function addPrivateTimeline(timeline) {
		if (can(timeline)) {
			var addedKey = timeline.id();
			var alreadyExists = false;
			Object.keys(this._privateTimelines).forEach(function(key, i, a) {
				if (key === addedKey) {
					alreadyExists = true;
					return;
				}
			});

			if (!alreadyExists) {
				this._privateTimelines[addedKey] = timeline;
			}
		}
	}

	function refreshTimelines() {
		this.getTimelines().forEach(function(tl) { tl.init(); });
	}

	function refreshPrivateTimelines() {
		this.getPrivateTimelines().forEach(function(tl) { tl.init(); });
	}

	function allUserIds(ids) {
		if (can(ids)) {
			this._allUserIds = $.extend(true, [], ids);
		}
		return this._allUserIds;
	}

	function allGroupIds(ids) {
		if (can(ids)) {
			this._allGroupIds = $.extend(true, [], ids);
		}
		return this._allGroupIds;
	}

	function clearCurrentInfo() {
		$.removeCookie('atmosphere-session-id');
		this._atmosAuthSessionId = null;
		this._atmosCurrentUserId = null;
		this._timelines = [];
		this._privateTimelines = [];
		this._allUserIds = [];
		this._allGroupIds = [];
	}

	function applyAutoComplete($target) {
		var that = this;
		if (!can(this._autoCompleteConfig)) {
			this._autoCompleteConfig = {
				// user id strategy
				user: {
					match: /(^|\s)@(\w*)$/,
					search: function (term, callback) {
						var regexp = new RegExp('^' + term);
						callback($.map(that.allUserIds(), function(userId) {
							return regexp.test(userId) ? userId : null;
						}));
					},
					template: function(value) {
						return '<img class="avator-mini" src="' + that.createUrl("/user/avator") + '?user_id=' + value + '" />' + value;
					},
					replace: function (value) {
						return '$1@' + value + ' ';
					},
					cache: false
				},

				// group id strategy
				group: {
					match: /(^|\s)\$(\w*)$/,
					search: function (term, callback) {
						var regexp = new RegExp('^' + term);
						callback($.map(that.allGroupIds(), function(groupId) {
							return regexp.test(groupId) ? groupId : null;
						}));
					},
					template: function(value) {
						return value;
					},
					replace: function (value) {
						return '$1$' + value + ' ';
					},
					cache: false
				}}
		};
		$target.textcomplete(this._autoCompleteConfig);
	}

	function createDefaultFailureCallback(caller, callback, hoverMessage) {
		return (function() {
			return new CallbackInfo(
				function(xhr, textStatus, errorThrown) {
					if (can(callback)) {
						var callbackResult = {};
						callbackResult['status'] = 'error';
						callback.fire(callbackResult);
					}
					console.log(errorThrown);
					if (canl(hoverMessage)) {
						showErrorNotification(hoverMessage);
					}
				},
				caller
			);
		})();
	}

	function showDesktopNotification(title, body, iconUrl, idForPreventDuplication) {
		if (this.__desktopNotifier) {
			if (body.length > 100) {
				body = body.substr(0, 100) + '...';
			}
			this.__desktopNotifier.show(title, { body: body, icon: iconUrl, tag: idForPreventDuplication }, AtmosSettings.Desktop.closeTimeoutSeconds());
		}
	}

	atmos = new Atmos();
	$(document).ready(function() {
		atmos.createTimelines();
		atmos.init();
	});
})();

