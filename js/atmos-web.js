function submitJson(callbackFunc, requiredToShowConfirm) {
    var headerNameAtmosSessionId = 'atmosphere-session-id';
    var targetMethod = $("#param_method").val();
	var targetUrl = $("#param_url").val();
	var targetParams = $("#param_parameter").val();
    var atmosSessionId = $("#param_atmos_session_id").val();
	
	if (targetMethod === 'GET' && targetParams.length > 0) {
		var queryString = '';
		var paramsJSON = JSON.parse(targetParams);
		for (var pKey in paramsJSON) {
            var rawValue = paramsJSON[pKey];
            if (isJson(rawValue)) {
                var encodedValue = encodeURI(JSON.stringify(rawValue));
            }
            else {
                var encodedValue = encodeURI(rawValue);
            }
			if (queryString.length > 0) {
				queryString += '&';
			}
			queryString += pKey + '=' + encodedValue;
		}
		targetParams = queryString;
	}

    var headers = {};
    headers[headerNameAtmosSessionId] = atmosSessionId;
    
	var sendRequestFunc = function() {
		var requestParams = {
			url: targetUrl,
			type: targetMethod,
			//dataType: 'json',
			dataType: 'text',
			//data: paramObj
			data: targetParams,
            headers: headers
		};
	
		$.ajax(requestParams)
		.done(function(data, textStatus, xhr){
			// store atmosSessionId
            var atmosSessionId = xhr.getResponseHeader('atmosphere-session-id');
            if (typeof(atmosSessionId) != 'undefined' && atmosSessionId != null && atmosSessionId.length > 0) {
                $("#param_atmos_session_id").val(atmosSessionId);
            }

			// call calback
			if (typeof(callbackFunc) != 'undefined' && callbackFunc != null) {
				callbackFunc(data, textStatus, xhr);
			}
		})
		.fail(function(xhr, textStatus, errorThrown){
			alert('error');
			//window.console.debug(errorThrown);
		})
		.always(function(xhr, textStatus, errorThrown){
			//window.console.debug(textStatus);
		});
	};

	if (requiredToShowConfirm) {
		//確認ダイアログを表示
		showConfirmDialog(
			'Confirmation!!!',
			'Are you sure to send request?<br /><p class="text-info">' + targetUrl + '</p>',
			sendRequestFunc
		);
	}
	else {
		sendRequestFunc();
	}

	return false;
}

// Returns a random integer between min and max
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addTimelineItem(timelineType, oneMessage) {
	var timelineAreaId = timelineType + '-timeline-area';
	var timelineItems = $("#" + timelineAreaId).children();
	if (timelineItems.length > 0 && timelineItems[0].id >= oneMessage['created_at']) {
		return;
	}
	var avatorPaths = [
		'images/illustrations/paper.png', 
		'images/illustrations/bag.png', 
		'images/illustrations/infinity.png', 
		'images/illustrations/gift.png', 
	];
	var addressesStr = '@' + oneMessage['created_by'];
	if (typeof(oneMessage['addresses']) != 'undefined' && oneMessage['addresses'].length > 0) {
		var filteredAddresses = oneMessage['addresses'].filter(function(element, index, array) {
			return element !== oneMessage['created_by'];
		});
		if (filteredAddresses.length > 0) {
			addressesStr += ' @' + filteredAddresses.join(' @');
		}
	}
	$("#" + timelineAreaId).prepend(
	  ' <div class="timeline-item" id="' + oneMessage['created_at'] + '" message-id="' + oneMessage["_id"] + '">'
	+ '		<div class="timeline-item avator">'
    + '	    	<img src="' + avatorPaths[getRandomInt(0,3)] + '" />'
	+ '		</div>'
	+ '		<span><p class="timeline-item byat">' + oneMessage['created_by'] + ' - ' + utc2jst(oneMessage['created_at']) + '</p></span>'
    + '	    <div class="tooltip timeline-item fade right in">'
    + '        <div class="tooltip-arrow timeline-item-arrow palette-' + timelineType + '-timeline-border-right-color"></div>'
    + '        <div class="tooltip-innter timeline-item-inner palette-' + timelineType + '-timeline-bg-color">' + oneMessage['message'] + '</div>'
    + '    </div>'
	+ '    <div class="timeline-item action-panel">'
	+ '    	<a href="#" class="reply" addresses="' + addressesStr + '"><i class="foundicon-edit" style="color: #f39c12;"></i></a>'
	+ '    	<a href="#" class="response-action" response-action="memo"><i class="foundicon-add-doc"></i></a>' + oneMessage['responses']['memo'].length
	+ '    	<a href="#" class="response-action" response-action="usefull"><i class="foundicon-idea"></i></a>' + oneMessage['responses']['usefull'].length
	+ '    	<a href="#" class="response-action" response-action="good"><i class="foundicon-star"></i></a>' + oneMessage['responses']['good'].length
	+ '    	<a href="#" class="response-action" response-action="fun"><i class="foundicon-smiley"></i></a>' + oneMessage['responses']['fun'].length
	+ '    </div>'
	+ '</div>'
	+ '<div style="clear:right;"></div>');

	applyActionPanelEvent(timelineAreaId);

	$("#" + timelineAreaId).children(":first").children(".action-panel").children(".reply").on('click', function() {
		var targetMessageId = $(this).parent().parent().attr("message-id");
		var orgMsg = $(this).parent().parent().children(".timeline-item").children(".timeline-item-inner").text()
		var addresses = $(this).attr("addresses");
		$("#message_sender_original_message").val(orgMsg);
		$("#message_sender_reply_to").val(targetMessageId);
		$("#message_sender_message_body").val(addresses);
		sendMessage();
	});

	$("#" + timelineAreaId).children(":first").children(".action-panel").children(".response-action").on('click', function() {
		var targetMessageId = $(this).parent().parent().attr("message-id");
		var action = $(this).attr("response-action");
		var classes = $(this).children(":first").attr("class");
		var orgMsg = $(this).parent().parent().children(".timeline-item").children(".timeline-item-inner").text()
		$("#response_sender_dialog_icon").removeClass().addClass(classes);
		$("#response_sender_original_message").val(orgMsg);
		$("#response_sender_target_message_id").val(targetMessageId);
		$("#response_sender_response_action").val(action);
		sendResponseToMessage();
	});
}

function refreshGlobalTimeline() {
    $("#param_method").val('GET');
	$("#param_url").val('/atmos/messages/global_timeline');
	$("#param_parameter").val("");
	//確認ダイアログを表示

	var callback = function(data, textStatus, xhr) {
		var resultJSON = JSON.parse(data);
		if (resultJSON['count'] > 0) {
			for (var resultIndex = resultJSON['count'] - 1; resultIndex >= 0; resultIndex--) {
				var result = resultJSON['results'][resultIndex];
				addTimelineItem('global', result);
			}
		}
	};

	submitJson(callback);

	return false;
}

function refreshMyTimeline() {
    $("#param_method").val('GET');
	$("#param_url").val('/atmos/messages/focused_timeline');
	$("#param_parameter").val("");
	//確認ダイアログを表示

	var callback = function(data, textStatus, xhr) {
		var resultJSON = JSON.parse(data);
		if (resultJSON['count'] > 0) {
			for (var resultIndex = resultJSON['count'] - 1; resultIndex >= 0; resultIndex--) {
				var result = resultJSON['results'][resultIndex];
				addTimelineItem('my', result);
			}
		}
	};

	submitJson(callback);

	return false;
}

function refreshTalkTimeline() {
    $("#param_method").val('GET');
	$("#param_url").val('/atmos/messages/talk_timeline');
	$("#param_parameter").val("");
	//確認ダイアログを表示

	var callback = function(data, textStatus, xhr) {
		var resultJSON = JSON.parse(data);
		if (resultJSON['count'] > 0) {
			for (var resultIndex = resultJSON['count'] - 1; resultIndex >= 0; resultIndex--) {
				var result = resultJSON['results'][resultIndex];
				addTimelineItem('talk', result);
			}
		}
	};

	submitJson(callback);

	return false;
}

function refreshAnnounceTimeline() {
    $("#param_method").val('GET');
	$("#param_url").val('/atmos/messages/announce_timeline');
	$("#param_parameter").val("");
	//確認ダイアログを表示

	var callback = function(data, textStatus, xhr) {
		var resultJSON = JSON.parse(data);
		if (resultJSON['count'] > 0) {
			for (var resultIndex = resultJSON['count'] - 1; resultIndex >= 0; resultIndex--) {
				var result = resultJSON['results'][resultIndex];
				addTimelineItem('announce', result);
			}
		}
	};

	submitJson(callback);

	return false;
}

function refreshMonologTimeline() {
    $("#param_method").val('GET');
	$("#param_url").val('/atmos/messages/monolog_timeline');
	$("#param_parameter").val("");
	//確認ダイアログを表示

	var callback = function(data, textStatus, xhr) {
		var resultJSON = JSON.parse(data);
		if (resultJSON['count'] > 0) {
			for (var resultIndex = resultJSON['count'] - 1; resultIndex >= 0; resultIndex--) {
				var result = resultJSON['results'][resultIndex];
				addTimelineItem('monolog', result);
			}
		}
	};

	submitJson(callback);

	return false;
}

function refreshPrivateTimeline() {
    $("#param_method").val('GET');
	$("#param_url").val('/atmos/private/timeline');
	$("#param_parameter").val("");
	//確認ダイアログを表示

	var callback = function(data, textStatus, xhr) {
		var resultJSON = JSON.parse(data);
		if (resultJSON['count'] > 0) {
			for (var resultIndex = resultJSON['count'] - 1; resultIndex >= 0; resultIndex--) {
				var result = resultJSON['results'][resultIndex];
				addTimelineItem('private', result);
			}
		}
	};

	submitJson(callback);

	return false;
}

function submitJsonManually() {
    $("#param_method").val($("input:radio[name='methodRadioManually']:checked").val());
	$("#param_url").val($("#param_url_manually").val());
	$("#param_parameter").val($("#param_parameter_manually").val());

	submitJson();

	return false;
}

function tryLogin() {

	var loginFunc = function () {
	    var targetMethod = $("#login_dialog_method").val();
		var targetUrl = $("#login_dialog_url").val();
		var inputtedUserId = $("#login_dialog_user_id").val();
		var inputtedPassword = $("#login_dialog_password").val();
	 	var paramJSON = {};
	    paramJSON['user_id'] = inputtedUserId;
	    paramJSON['password'] = inputtedPassword;
	
	    var headers = {};
	    
	    var requestParams = {
	        url: targetUrl,
	        type: targetMethod,
	        dataType: 'text',
	        data: JSON.stringify(paramJSON),
	        headers: headers
	    };
	
	    $.ajax(requestParams)
	    .done(function(data, textStatus, xhr){
	        var atmosSessionId = xhr.getResponseHeader('atmosphere-session-id');
	        if (typeof(atmosSessionId) != 'undefined' && atmosSessionId != null && atmosSessionId.length > 0) {
	            $("#param_atmos_session_id").val(atmosSessionId);
	        }
			var whoamiHeaders = {};
			whoamiHeaders['atmosphere-session-id'] = atmosSessionId;

			var whoamiParams = {
				url: "/atmos/auth/whoami",
				type: "GET",
				dataType: "text",
				data: "",
				headers: whoamiHeaders
			};
			$.ajax(whoamiParams)
			.done(function(data, textStatus, xhr) {
				var dataJson = JSON.parse(data);
				if (dataJson['status'] === 'ok') {
					$("#menuItemLogin").hide();
					var currentUserId = dataJson['user_id'];
					$("#menuItemCurrentUser > a").text('Logged in as ' + currentUserId);
					$("#menuItemCurrentUser").show();
				}
			})
			.fail(function(xhr, textStatus, errorThrown) {
				alert('error');
			})
			.always(function(xhr, textStatus, errorThrown) {
			});
	    })
	    .fail(function(xhr, textStatus, errorThrown){
	        alert('error');
	        //window.console.debug(errorThrown);
	    })
	    .always(function(xhr, textStatus, errorThrown){
	        //window.console.debug(textStatus);
	    });
	
		return false;
	}

	showDialog(
		'loginDialog',
		'loginDialogLabel',
		'loginDialogOK',
		loginFunc,
		null,
		true
	);

	return false;
}

function logout() {

	var logoutFunc = function () {
	    var targetMethod = $("#logout_dialog_method").val();
		var targetUrl = $("#logout_dialog_url").val();
	 	var paramJSON = {};
	
	    var headers = {};
		headers['atmosphere-session-id'] = $("#param_atmos_session_id").val();
	    
	    var requestParams = {
	        url: targetUrl,
	        type: targetMethod,
	        dataType: 'text',
	        data: JSON.stringify(paramJSON),
	        headers: headers
	    };
	
	    $.ajax(requestParams)
	    .done(function(data, textStatus, xhr){
			//do nothing
	    })
	    .fail(function(xhr, textStatus, errorThrown){
			//do nothing
	    })
	    .always(function(xhr, textStatus, errorThrown){
			$("#menuItemCurrentUser").hide();
			$("#menuItemCurrentUser > a").text('Not Login');
			$("#menuItemLogin").show();

			//clear all messages
			$("#global-timeline-area").empty();
			$("#my-timeline-area").empty();
			$("#talk-timeline-area").empty();
			$("#announce-timeline-area").empty();
			$("#monolog-timeline-area").empty();
			$("#private-timeline-area").empty();
	    });
	
		return false;
	}

	showDialog(
		'logoutDialog',
		'logoutDialogLabel',
		'logoutDialogOK',
		logoutFunc,
		null,
		true
	);

	return false;
}

function submitJsonManually() {

	var sendRequestFunc = function () {
	    $("#param_method").val($("input:radio[name='methodRadioManually']:checked").val());
		$("#param_url").val($("#param_url_manually").val());
		$("#param_parameter").val($("#param_parameter_manually").val());

		submitJson();

		return false;
	}

	showDialog(
		'manualSenderDialog',
		'manualSenderDialogLabel',
		'manualSenderDialogOK',
		sendRequestFunc,
		null,
		true
	);

	return false;
}

function sendMessage() {

	var sendMessageFunc = function () {
    	var headerNameAtmosSessionId = 'atmosphere-session-id';
	    var targetMethod = $("#message_sender_dialog_method").val();
		var targetUrl = $("#message_sender_dialog_url").val();
		var replyTo = $("#message_sender_reply_to").val();
		var inputtedMessage = $("#message_sender_message_body").val();
		var messageType = $("#message_sender_message_type").val();
	 	var paramJSON = {};
	    paramJSON['message'] = inputtedMessage;
		if (typeof(replyTo) != 'undefined' && replyTo != null && replyTo.length > 0) {
			paramJSON['reply_to'] = replyTo;
		}
		if (typeof(messageType) != 'undefined' && messageType != null && messageType.length > 0) {
			paramJSON['message_type'] = messageType;
		}
    	var atmosSessionId = $("#param_atmos_session_id").val();
	
        var headers = {};
        headers[headerNameAtmosSessionId] = atmosSessionId;
	    
	    var requestParams = {
	        url: targetUrl,
	        type: targetMethod,
	        dataType: 'text',
	        data: JSON.stringify(paramJSON),
	        headers: headers
	    };
	
	    $.ajax(requestParams)
	    .done(function(data, textStatus, xhr){
	        var atmosSessionId = xhr.getResponseHeader('atmosphere-session-id');
	        if (typeof(atmosSessionId) != 'undefined' && atmosSessionId != null && atmosSessionId.length > 0) {
	            $("#param_atmos_session_id").val(atmosSessionId);
	        }
	    })
	    .fail(function(xhr, textStatus, errorThrown){
	        alert('error');
	        //window.console.debug(errorThrown);
	    })
	    .always(function(xhr, textStatus, errorThrown){
	        //window.console.debug(textStatus);
	    });
	
		return false;
	}

	showDialog(
		'messageSenderDialog',
		'messageSenderDialogLabel',
		'messageSenderDialogOK',
		sendMessageFunc,
		null,
		true
	);

	return false;
}

function sendResponseToMessage() {

	var sendResponseFunc = function () {
    	var headerNameAtmosSessionId = 'atmosphere-session-id';
	    var targetMethod = $("#response_sender_dialog_method").val();
		var targetUrl = $("#response_sender_dialog_url").val();
		var targetMessageId = $("#response_sender_target_message_id").val();
		var responseAction = $("#response_sender_response_action").val();
	 	var paramJSON = {};
	    paramJSON['target_id'] = targetMessageId;
	    paramJSON['action'] = responseAction;
    	var atmosSessionId = $("#param_atmos_session_id").val();
	
        var headers = {};
        headers[headerNameAtmosSessionId] = atmosSessionId;
	    
	    var requestParams = {
	        url: targetUrl,
	        type: targetMethod,
	        dataType: 'text',
	        data: JSON.stringify(paramJSON),
	        headers: headers
	    };
	
	    $.ajax(requestParams)
	    .done(function(data, textStatus, xhr){
	        var atmosSessionId = xhr.getResponseHeader('atmosphere-session-id');
	        if (typeof(atmosSessionId) != 'undefined' && atmosSessionId != null && atmosSessionId.length > 0) {
	            $("#param_atmos_session_id").val(atmosSessionId);
	        }
	    })
	    .fail(function(xhr, textStatus, errorThrown){
	        alert('error');
	        //window.console.debug(errorThrown);
	    })
	    .always(function(xhr, textStatus, errorThrown){
	        //window.console.debug(textStatus);
	    });
	
		return false;
	}

	showDialog(
		'responseSenderDialog',
		'responseSenderDialogLabel',
		'responseSenderDialogOK',
		sendResponseFunc,
		null,
		true
	);

	return false;
}

function applyActionPanelEvent(targetTimelineAreaId) {
	$("#" + targetTimelineAreaId).children(":first").hover(
		function() {
			$(this).children(".action-panel").animate({opacity: "show"}, "normal");
		},
		function() {
			$(this).children(".action-panel").animate({opacity: "hide"}, "fast");
		}
	);
}

$(document).ready(function() {
	$('#loginButton').on('click', function() {
		tryLogin();
	});
	$('#logoutButton').on('click', function() {
		logout();
	});
	$('#sendRequestManualButton').on('click', function() {
		submitJsonManually();
	});
	$('#send_message_button_on_global_timeline').on('click', function() {
		$("#message_sender_message_type").val('');
		sendMessage();
	});
	$('#send_message_button_on_my_timeline').on('click', function() {
		$("#message_sender_message_type").val('');
		sendMessage();
	});
	$('#send_message_button_on_talk_timeline').on('click', function() {
		$("#message_sender_message_type").val('');
		sendMessage();
	});
	$('#send_message_button_on_announce_timeline').on('click', function() {
		$("#message_sender_message_type").val('');
		sendMessage();
	});
	$('#send_message_button_on_monolog_timeline').on('click', function() {
		$("#message_sender_message_type").val('monolog');
		sendMessage();
	});
	$('#refresh_global_timeline_button').on('click', function() {
		refreshGlobalTimeline();
	});
	$('#refresh_my_timeline_button').on('click', function() {
		refreshMyTimeline();
	});
	$('#refresh_talk_timeline_button').on('click', function() {
		refreshTalkTimeline();
	});
	$('#refresh_announce_timeline_button').on('click', function() {
		refreshAnnounceTimeline();
	});
	$('#refresh_monolog_timeline_button').on('click', function() {
		refreshMonologTimeline();
	});
	$('#refresh_private_timeline_button').on('click', function() {
		refreshPrivateTimeline();
	});
});
