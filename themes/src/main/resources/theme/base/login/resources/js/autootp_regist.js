var oneclick = $("#oneclick").val();
var link = $("#link").val();

if(oneclick === undefined || oneclick == null)		oneclick = "";
if(link === undefined || link == null)				link = "";

var gapMinute = 0;
var expirationInMinutes = 0;

var strGapMinute = $("#gapMinute").val();
var strExpirationInMinutes = $("#expirationInMinutes").val();

if(strGapMinute !== undefined && strGapMinute != null && strGapMinute != "")
	gapMinute = parseInt(strGapMinute.replace(/,/g , ''));
if(strExpirationInMinutes !== undefined && strExpirationInMinutes != null && strExpirationInMinutes != "")
	expirationInMinutes = parseInt(strExpirationInMinutes.replace(/,/g , ''));

var username = $("#username").val();
var authDomain = $("#authDomain").val();
var baseUrl = $("#baseUrl").val();

var clientId = $("#clientId").val();
var clientClientId = $("#clientClientId").val();

if(username === undefined || username == null)				username = "";
if(authDomain === undefined || authDomain == null)			authDomain = "";
if(baseUrl === undefined || baseUrl == null)				baseUrl = "";

if(baseUrl == "")
	baseUrl = "javascript:alert('Home URL is not registered.');";

if(clientId === undefined || clientId == null)				clientId = "";
if(clientClientId === undefined || clientClientId == null)	clientClientId = "";

var autootp_terms = 0;
var autootp_millisec = 0;
var timeoutId1 = null;
var timeoutId2 = null;
var pushConnectorUrl = "";
var pushConnectorToken = "";

function AutoOTPRegist() {
	if(gapMinute > expirationInMinutes) {
		$("#autootp_expiration").css("display", "block");
	}
	else if(username == "") {
		$("#userinfo_empty").css("display", "block");
	}
	else {
		$("#autootp_content").css("display", "block");
		AutoOtpManageRestAPI();
	}
}

function showAlert(msg) {
	alert(msg);
	//location.href = baseUrl;
}

function AutoOtpManageRestAPI() {
	var isReg = checkAutoOTPReg();
	//console.log("isReg = " + isReg);
	
	if(isReg == "T") {
		//if(oneclick == "T" && link != "") {
		//	location.href = link;
		//}
		
		$("#autootp_content").css("height", "200px");
		$("#cancel_qr").css("display", "block");
	}
	else {
		$("#reg_qr").css("display", "block");
		loginAutoOTPJoinStart();
	}
}

// Check user regstered
function checkAutoOTPReg() {
	//console.log("----- checkAutoOTPReg() -----");
	
	var ret_val = "";
	
	var data = {
		url: "isApUrl",
		params: "userId=" + username + "&clientId=" + clientId + "&clientClientId=" + clientClientId
	}
	
	var result = callApi(data);
	jsonResult = JSON.parse(result);
	var exist = false;

	var code = jsonResult.code;
	if(code == "000" || code == "000.0")
		exist = jsonResult.data.exist;
	
	if(exist)	ret_val = "T";
	else		ret_val = "F";
	
	return ret_val;
}

function moveHome() {
	location.href = baseUrl;
}

// Request unregister
function loginAutoOTPwithdrawal() {
	//console.log("----- loginAutoOTPwithdrawal() -----");
	
	var data = {
		url: "withdrawalApUrl",
		params: "userId=" + username + "&clientId=" + clientId + "&clientClientId=" + clientClientId
	}
	
	var result = callApi(data);
	//console.log(result);
	jsonResult = JSON.parse(result);
	
	var code = jsonResult.code;
	if(code == "000" || code == "000.0") {
		alert("Registration has been canceled.");
		moveHome();
	}
	else {
		alert("Please try again later.");
		moveHome();
	}
}

// Request register
function loginAutoOTPJoinStart() {
	//console.log("----- loginAutoOTPJoinStart() -----");
	
	var data = {
		url: "joinApUrl",
		params: "userId=" + username + "&name=&email=" + "&clientId=" + clientId + "&clientClientId=" + clientClientId
	}
	
	var result = callApi(data);
	//console.log(result);
	jsonResult = JSON.parse(result);
	
	var code = jsonResult.code;
	if(code == "000" || code == "000.0") {
		var data = jsonResult.data;
		var qr = data.qr;
		var corpId = data.corpId;
		var registerKey = data.registerKey;
		var terms = data.terms;
		var serverUrl = data.serverUrl;
		var userId = data.userId;
		
		pushConnectorUrl = data.pushConnectorUrl;
		pushConnectorToken = data.pushConnectorToken;
		
		/*
		console.log("qr [" + qr + "]");
		console.log("corpId [" + corpId + "]");
		console.log("registerKey [" + registerKey + "]");
		console.log("terms [" + terms + "]");
		console.log("serverUrl [" + serverUrl + "]");
		console.log("userId [" + userId + "]");
		console.log("url [" + pushConnectorUrl + "]");
		*/
		
		$("#qr").prop("src", qr);
		//$("#qr").css("display", "block");
		
		$("#server_url").html(serverUrl);
		$("#corp_id").html(corpId);
		$("#user_id").html(userId);
		
		var today = new Date();
		autootp_millisec = today.getTime();
		autootp_terms = parseInt(terms - 1);
		
		qrSocket = null;
		drawAutoOTP();
		//regAutoOTPRepeat();
		connWebSocket();
	}
	else {
		alert("Please try again later.");
		moveHome();
	}
}

// Check existing user
function regAutoOTPRepeat() {
	
	//console.log("----- regAutoOTPRepeat() -----");
	
	var today = new Date();
	var now_millisec = today.getTime();
	var gap_millisec = now_millisec - autootp_millisec;
	
	if(gap_millisec < autootp_terms * 1000) {
		
		var isReg = checkAutoOTPReg();
		//console.log("isReg = " + isReg);
		
		if(isReg == "T") {
			clearTimeout(timeoutId1);
			clearTimeout(timeoutId2);
			
			alert("Registration is complete.");
			
			if(oneclick == "T" && baseUrl != "") {
				location.href = baseUrl;
			}
			else {
				moveHome();
			}
		}
		else {
			timeoutId1 = setTimeout(regAutoOTPRepeat, 1500);
		}
	}
}

function drawAutoOTP() {
	var today = new Date();
	var gap_second = Math.ceil((today.getTime() - autootp_millisec) / 1000);
	
	if(gap_second < autootp_terms) {
	
		var tmp_min = parseInt((autootp_terms - gap_second) / 60);
		var tmp_sec = parseInt((autootp_terms - gap_second) % 60);
		
		if(tmp_sec < 10)
			tmp_sec = "0" + tmp_sec;
			
		$("#rest_time").html(tmp_min + " : " + tmp_sec);
		
		if(qrSocket != null) {
			//console.log("[" + today.getTime() + "] qrSocket state=" + qrSocket.readyState);
			if(qrSocket.readyState != qrSocket.OPEN) {
				//console.log("WebSocket closed --> change [POLLING]");
				qrSocket = null;
				regAutoOTPRepeat();
			}
		}
		
		timeoutId2 = setTimeout(drawAutoOTP, 100);
	}
	else {
		clearTimeout(timeoutId1);
		clearTimeout(timeoutId2);
		
		$("#rest_time").html("0 : 00");
		
		setTimeout(() => alert("AutoOTP QR registration time has expired."), 100);
		setTimeout(() => moveHome(), 200);
	}
}

function callApi(data) {

	var api_url = "/auth/realms/" + $("#realmName").val() + "/protocol/openid-connect/autootp";
	var ret_val = "";
	
	//console.log("---------- data -----------");
	//console.log(data);
	
	$.ajax({
		url: api_url,
		method: 'POST',
		dataType: 'json',
		data: data,
		async: false,
		success: function(data) {
			//console.log("[SUCCESS]");
			//console.log(data);
			
			ret_val = data.result;
		},
		error: function(xhr, status, error) {
			//console.log("[ERROR] code: " + xhr.status + ", message: " + xhr.responseText + ", status: " + status + ", ERROR: " + error);
			$("#search_result").html("No results were found.");
		},
		complete: function(data) {
			//console.log("[COMPLETE]");
		}
	});
	
	return ret_val;
}

//-------------------------------------------------- WebSocket -------------------------------------------------

/*
	- WebSocket readyState
	  0 CONNECTING
	  1 OPEN
	  2 CLOSING
	  3 CLOSED
*/

var qrSocket = null;
var result = null;

function connWebSocket() {

	qrSocket = new WebSocket(pushConnectorUrl);

	qrSocket.onopen = function(e) {
		//console.log("######## WebSocket Connected ########");
		var send_msg = '{"pushConnectorToken":"' + pushConnectorToken + '"}';
		//console.log("url [" + pushConnectorUrl + "]");
		//console.log("send [" + send_msg + "]");
		try {
			qrSocket.send(send_msg);
		} catch(err) {
			//console.log(err);
		}
	}

	qrSocket.onmessage = async function (event) {
		//console.log("######## WebSocket Data received [" + qrSocket.readyState + "] ########");
		//console.log(event);
		//console.log("=================================================");
		
		try {
			if (event !== null && event !== undefined) {
				result = await JSON.parse(event.data);
				//console.log(result);
				//console.log("=================================================");
			}
		} catch (err) {
			//console.log(err);
		}
	}

	qrSocket.conclose = function(event) {
		/*
		if(event.wasClean)
			console.log("######## WebSocket Disconnected - OK !!! [" + qrSocket.readyState + "] ########");
		else
			console.log("######## WebSocket Disconnected - Error !!! [" + qrSocket.readyState + "] ########");

		console.log("=================================================");
		console.log(event);
		console.log("=================================================");
		*/
	}

	qrSocket.onerror = function(error) {
		/*
		console.log("######## WebSocket Error !!! [" + qrSocket.readyState + "] ########");
		console.log("=================================================");
		console.log(error);
		console.log("=================================================");
		*/
	}
}