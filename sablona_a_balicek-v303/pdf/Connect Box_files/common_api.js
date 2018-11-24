/*
	common_api.js
*/

// ======================================== 
//								  			 
// MAIN SCRIPT			  		
// 								  			
// ======================================== 
var timeCtlP="";
var _server = {'Alert':0,'Msg':''};
var _OpenServerAlert = true;
var _AccessLevel = "";
var _SwVersion = "";
var _OperatorId = "";
var _GWOperMode = "";
var _DsLite = "";
var _PortControl = "";
var _GwProvisionMode="";
var _CmProvisionMode="";
var _ConfigModelName ="";
var _WPSinterval=0;
var _Interface = "";
var _ACCESSTYPE ="";
var btnR = {"check"	: "../images/common_imgs/radio-box-checked.png",
			"default" : "../images/common_imgs/radio-box-default.png",
			"check-disabled" : "../images/common_imgs/radio-box-checked-disabled.png",
			"default-disabled" : "../images/common_imgs/radio-box-default-disabled.png"};
var btnC = {"check"	: "../images/common_imgs/check-box-checked.png",
			"default" : "../images/common_imgs/check-box-default.png",
			"check-disabled" : "../images/common_imgs/check-box-checked-disabled.png",
			"default-disabled" : "../images/common_imgs/check-box-default-disabled.png"};
var excludeSSID = [	"Liberty Global", "Telenet", "Virgin Media", "Ziggo", "Horizon Wi-Free",
					"TELENETHOMESPOT","TelenetWiFree","TelenetSecure","UPC WiFiSpots","UPC Wi-Free",
					"Unitymedia WifiSpot","Unitymedia Public WifiSpot","VTR","LibertyPR"];
var _CurrentPage="";
var _CurrentPageApplyFunction="";
var eMessage ="";
var NoticeCheckIsChange = function() { return false; };
var nothingIsChange = function() { return false; };
var NoneAction = function(){};
var GetXmlResponseDone = false;
var SetTimeout = false;
var WIFIPWD = new Array();
var GlobalSt = {"VMFuncEn" : false, "waitTimeScreen" : false , "HideModemMode" : true, "title": "Connect Box" ,"goto":false, "HideRemoteAccess":false};
//Token mechanism S
var _ajaxWorking = 0;
var _ajaxLine = [];
//old_token=0;//for debuging
//Token mechanism E
var _Cm_upgrade_status;
$(function($) {
	if (top.location != location) {//prevent accessing from iframe
		top.location.href = document.location.href ;
	}
	updateToken();
	loadGlobalValue();
	loadContent();
	
	$.fn.cbnSwitchClass = function(rm,add){
		return this.each(function(){
			$(this).removeClass(rm).addClass(add);
		});
	};
}); // Close main function $(function())


function loadGlobalValue()
{
	var data = {'fun':1};
	var ai = {1:"LAN",2:"HFC",4:"WAN"};
	cbnAjax({
		type:"POST",
		url:"../xml/getter.xml",
		async:false,
		data: data,
		dataType:"xml",
		error:function(xmlResponse) { 
			displayErrorMessage();
		},
		success:function(xmlResponse) {
			_AccessLevel = $(xmlResponse).find('AccessLevel').text();
			_SwVersion = $(xmlResponse).find('SwVersion').text();
			_OperatorId = $(xmlResponse).find('OperatorId').text();
			_GWOperMode = $(xmlResponse).find('GWOperMode').text();
			_DsLite = $(xmlResponse).find('DsLite').text();
			_PortControl = $(xmlResponse).find('PortControl').text();
			_GwProvisionMode = $(xmlResponse).find('GwProvisionMode').text();
			_CmProvisionMode = $(xmlResponse).find('CmProvisionMode').text();
			_ConfigModelName = $(xmlResponse).find('ConfigVenderModel').text();
			_Interface = ai[$(xmlResponse).find('Interface').text()];
			_ACCESSTYPE = ($(xmlResponse).find('AccessType').text() == 0)?"eth":"wifi";
			_Cm_upgrade_status = $(xmlResponse).find('operStatus').text();
			if(_AccessLevel == 0)
			{
				if($('body#cbnLogin').length || $('body#cbnFirstInstall').length){
					clearCookie("All");
				}else{
					clearCookie("notAll");
				}
			}

			if((_OperatorId == "VIRGINMEDIA") && ($(xmlResponse).find('CountryID').text() != '6'))
				GlobalSt["VMFuncEn"] = true;
			else
				GlobalSt["VMFuncEn"] = false;
			
			GlobalSt["HideModemMode"] = ($(xmlResponse).find('HideModemMode').text() == "True" ? true : false);
			GlobalSt["HideRemoteAccess"] = ($(xmlResponse).find('HideRemoteAccess').text() == "True" ? true : false);
			GlobalSt["title"] = $(xmlResponse).find('title').text();
			document.title = GlobalSt["title"];
		}
	});
}

// ========================================
//								  		 
// COMMON FUNCTIONS			  	
// 								  			
// ========================================

//CBN Derek - to handle multi-ajax
function cbnAjax(ajaxObj,ajaxRef){
	
	if(ajaxObj.url.match('getter.xml')||ajaxObj.url.match('setter.xml')){
		
		if(ajaxRef && ("thread" in ajaxRef)){// check key of object is exist
			ajaxObj.ajaxRef = function(){return ajaxRef;};//pass reference			
		}
		parent._ajaxLine.push(ajaxObj);//go to line and wait for executing
		if(parent._ajaxWorking==0){//ajax is not working
			parent._ajaxWorking = 1;
			ajaxGo();//ajax start
		}
	}else{
		$.ajax(ajaxObj);
	}
}
		
function ajaxGo(){
	if(parent._ajaxLine.length>=1){
		updateToken();
		var ajaxObj = parent._ajaxLine.shift();
		//delete ajaxObj.data.token;//make sure token be the first item
		var DataWithToken = {
			'token':_Token
		};
		$.extend(DataWithToken,ajaxObj.data);//update token
		ajaxObj.data = DataWithToken;
		
		if(ajaxObj.complete)
			alert('Warnning: xhrFields will be rewrited');
		ajaxObj.complete= function(jqXHR,textStatus){
			//console.log('req one ajax done');
			ajaxGo();
		};
		/*ajaxObj.xhrFields= { //for taking cookie in request header
				withCredentials: true
			};*/
		//ajaxObj.async = true;
		if(typeof ajaxObj.ajaxRef == 'function' && ("thread" in ajaxObj.ajaxRef())){
			ajaxObj.ajaxRef().thread = $.ajax(ajaxObj);
		}else{
				$.ajax(ajaxObj);}
	}else{
		parent._ajaxWorking = 0;
	}
}

function ajaxGet(data,node,func) {
	cbnAjax({
        url:"../xml/getter.xml",
        type:"POST",
        data: data,
        dataType:"xml",
        success:function(xmlResponse) {
        	func(xmlResponse,node);
        },
		error:function(xmlResponse) {
			displayErrorMessage();
        }
	});
}

function ajaxSet(data,SetSuccess,SetFail,fail){

	if(GlobalSt["waitTimeScreen"] === true)
		return;
	

	cbnAjax({
		type:"POST",
		url:"../xml/getter.xml",
		async:false,
		data: {'fun':1},
		dataType:"xml",
		beforeSend: function(){
			GlobalSt["waitTimeScreen"] = true;
		},
		error:function(xmlResponse) { 
			window.location.assign("../index.html");
		},
		success:function(xmlResponse) {
			_AccessLevel = $(xmlResponse).find('AccessLevel').text();
			_Cm_upgrade_status = $(xmlResponse).find('operStatus').text();
			if(_AccessLevel == "0")
			{
				SetTimeout = true;
				GlobalSt["waitTimeScreen"] = false;
				if(GetXmlResponseDone === true && NoticeCheckIsChange()===true){
					RemoveErrMsg("loginPassword");
					$("#noticelogin").show();
				}
				else{
					window.location.assign("../common_page/login.html");
				}
			}
			else
			{
				if(_Cm_upgrade_status != 1)
				{
					doLogout();
				}else
				{
					ajaxSetToDB(data,SetSuccess,SetFail,fail);
				}
			}
		}
	});
	return "done";
}

function ajaxSetToDB(data,SetSuccess,SetFail,fail)
{
	var patt = new RegExp('"fun":4');
	
	SetSuccess = (typeof SetSuccess != 'undefined') ? SetSuccess : NoneAction;
	SetFail = (typeof SetFail != 'undefined') ? SetFail : NoneAction;
	SetTimeout = false;
	
	try {
		cbnAjax({
			url: "../xml/setter.xml",
			type: 'POST',
			async: false,
			dataType: "text",			
			data: data,
			success: function(response) {
				_server = {'Alert':0,'Msg':''};
				if(JSON.stringify(data)!='{"fun":16}')
				{
					if(jQuery.trim(response).length > 0){
						_server = {'Alert':1,'Msg':response};
						if(_OpenServerAlert && (response.match("cbnLogin") || response.match("cbnFirstInstall"))){
							window.location.assign("../common_page/login.html");
						}else{
							GlobalSt["waitTimeScreen"] = false;
							SetFail();
							
							if(fail != undefined)
							{
								fail();
							}
							gotoPagetop();
							if(window.console){
								console.log(_server["Msg"]);
							}
						}
					}else if(!patt.test(JSON.stringify(data))){
						NoticeCheckIsChange = nothingIsChange;
						SetSuccess();
					}
				}
			},
			error: function(){
				displayErrorMessage();
			},
		});
	} 
	catch (e) {
		alert(e.message);
	}
}

function ajaxSetNoTokenUpdate(data){

	NoticeCheckIsChange = nothingIsChange;

	try {
		cbnAjax({
			url: "../xml/setter.xml",
			type: 'POST',
			async: false,
			dataType: "text",			
			data: data,
			success: function(response) {
				_server = {'Alert':0,'Msg':''};
				if(JSON.stringify(data)!='{"fun":16}')
				{
					if(jQuery.trim(response).length > 0){
						if(_OpenServerAlert &&(response.match("cbnLogin") || response.match("cbnFirstInstall")))
						{
							window.location.assign("../common_page/login.html");
						}
						_server = {'Alert':1,'Msg':response};
					}
				}
			},
			error: function(){
				displayErrorMessage();
			}
		});
	} 
	catch (e) {
		alert(e.message);
	}
}

function waitTimeScreen(url,seconds,messageID,position,success_renew)
{
	$("#main_page").hide();
	$("#"+position).empty();
	gotoPagetop();
	var string = "<table class='contentFont' align='center'><tr><td align='center'><span class='section_title dynamic' id="+messageID+"></span></td></tr><tr><td align='center'><br><span><img src='/images/common_imgs/loading.gif'/></span></td></tr></table>";
	$(string).appendTo($("#"+position));
	updateContent();		
	GlobalSt["waitTimeScreen"] = true;
	ApplyStatusMsgRemove();
	if(url != "")
	{
		setTimeout(function(){goto(url,"content",success_renew);}, seconds*1000);
	}
}

function ReloadPage()
{
	window.location.assign(window.location.href);
}

function isValidIpAddress(address) {
   var i = 0;
   if ( address == '0.0.0.0' ||
        address == '255.255.255.255' )
      return -1;

   addrParts = address.split('.');
   if ( addrParts.length != 4 ) return -1;

   for (i = 0; i < 4; i++) {
	  if ( isNaN(addrParts[i]) )
	  	 return -1;
      num = parseInt(addrParts[i])
      if ( isNaN(num) )
         return -1;
      if ( num < 0 || num > 255 )
         return -1;
   }
   return 0;
}

function removeSpace(val)
{
	var len = val.length;
	while(len>0)
	{
		val = val.replace(" ", "");
		len--;
	}
	return val;
}

function displayErrorMessage()
{
	GetXmlResponseDone = false;
	if(window.location.pathname == "/common_page/login.html")
	{
		var error_message =$('<br><br><br><br><div class="content">\
							<span class="dynamic" id="c_62">The service may be interrupted, temporarily inaccessible or encountered errors transferring data.</span><br>\
							<a href="javascript:void(0)" onclick="location.reload();" class="dynamic" id="c_61"></a>\
							</div><br><br><br><br><br><br><br><br><br><br><br><br>');
		$("#loginLanguage").empty();
		$(error_message).appendTo($("#loginLanguage"));
	}
	else if(window.location.pathname == "/index.html" || window.location.pathname == "/")
	{
		var error_message =$('<div class="general_text">\
							<br><br><br><span class="dynamic" id="c_62">The service may be interrupted, temporarily inaccessible or encountered errors transferring data.</span><br>\
							<a href="javascript:void(0)" onclick="location.reload();" class="dynamic" id="c_61"></a>\
							</div>');
		$(".content-container").empty();
		$(error_message).appendTo($(".content-container"));
		window.clearInterval(timerId);
	}	
	updateContent();
}

function CheckBoxOption(id,name)
{
	var src = $('#' + id).prop('src');
	if(src == null)src = btnC["default"];
	
	if( (src.match(btnC["default-disabled"]))||(src.match(btnC["check-disabled"])) )
	{
		return;
	}
	
	$('[name='+name+']').attr("src",btnC["default"]);
	var input_id = id.slice(1);
	if(src.match(btnC["default"]))
	{		
		$( '#'+id).attr("src", btnC["check"]);
		$( '#'+input_id ).prop( "checked", true );
	}
	else
	{	
		$( '#'+id).attr("src", btnC["default"]);
		$( '#'+input_id ).prop( "checked", false );
	}
}

function RadioOption(id,name)
{	
	var src = $('#' + id).prop('src');
	if(src == null)src = btnR["default"];
	if(src.match(btnR["check"])) //check Default Radio Button Behavior 
		return;	
		
	if((src.match(btnR["default-disabled"]))||(src.match(btnR["check-disabled"])) )
	{
		return;
	}
	$('[name='+name+']').attr("src",btnR["default"]);
	var input_id = id.slice(1);
	if(src.match(btnR["default"]))
	{			
		$( '#'+id).attr("src", btnR["check"]);
		$( '#'+input_id ).prop( "checked", true );
	}
	else
	{		
		$( '#'+id).attr("src", btnR["default"]);
		$( '#'+input_id ).prop( "checked", false );
	}
}

function timeoutCheck(renew)//only for modem.html now
{
	var jqxhr = $.get( "common_page/Notice.html", function() {
		}).done(function(data) {
			if(data.match("cbnLogin") || data.match("cbnFirstInstall"))
			{
				SetTimeout = true;
				if(!checkIsChange())
				{
					if(data.match("cbnLogin"))
						window.location.assign("../common_page/login.html");
					else if(data.match("cbnFirstInstall"))
						window.location.assign("../common_page/FirstInstallation.html");
				}
				else
				{
					RemoveErrMsg("loginPassword");
					$("#noticelogin").show();
				}
				
			}
			else
			{
				SetTimeout = false;
				if(!checkIsChange()){
					waitTimeScreen("../common_page/Modem.html",1,"c_44","wait-massage",renew);
				}else{
					setWanSetting();
				}
			}
		}).fail(function() {
		}).always(function() {
	});
}

function NoticeLogin()
{
	var data;
	data = {
		'fun':15,
		'Username':"NULL",
		'Password':$("input[name='loginPassword']").val()
	};
	cbnAjax({
		url: "../xml/setter.xml", type: 'POST', async: false, dataType:"text", data: data,
		success: function(response){
			updateSID(response);
			var patt = new RegExp("successful");
			if((patt.test(response)) != true)
			{
				InputErrMsg("loginPassword","",getLanguageResourcesById('wm02'));
				if(response.match("cbnLogin") || response.match("cbnFirstInstall"))
					window.location.assign("../common_page/login.html");
				else if(response == "lockedout")
					window.location.assign("../common_page/Access-denied.html");
			}
			else{
				$("#noticelogin").fadeOut();
				$("input[name='loginPassword']").val("");
				if(GetXmlResponseDone === true && NoticeCheckIsChange()===true)
				{
					Notice('common_page/Notice.html','noticecontent');
					SetTimeout = false;
				}
				
			}
		},
		error: function(response){window.location.assign("../common_page/login.html");}
	});
}

function clickParent(thisClass,thisID)
{
	if(thisClass.match("level2"))
	{
		thisID.parent().parent().parent().find(".menuTitle").click();
	}
	else if(thisClass.match("level3arrow"))
	{
		thisID.parent().parent().parent().parent().parent().find(".menuTitle").click();
		thisID.parent().parent().parent().find(".level2").click();
	}
}

function displayCurrentPagesStyle(name)
{
	reload = false;
	var thisClass = "";
	thisClass += $("[name='"+name+"']").attr("class");
	$( ".link" ).removeClass( "select_subtitle" );
	$("[name='"+name+"']").not("#content").addClass("select_subtitle");
			
	if(thisClass.match("noChildMenu"))
	{			
		$(".level3arrow").removeClass("level3_selected");
		$(".level2").removeClass("level2_selected select_title");
	}
	if(thisClass.match("noChildSubMenu"))
	{
		$(".level2").addClass("level2_selected");
		$(".level3arrow").removeClass("level3_selected");
		$("[name='"+name+"']").addClass("level2_selected");
	}
		
	if(thisClass.match("level3arrow"))
	{				
		$(".level3arrow").removeClass("level3_selected");
		$(".noChildSubMenu").removeClass("level2_selected select_title");
		$("[name='"+name+"']").addClass("level3_selected");			
	}
	
	if(thisClass.match("level2"))	
	{
		$(".level2").removeClass("level2_selected select_title");	
		$("[name='"+name+"']").addClass("level2_selected select_title");
		
		$(".noChildSubMenu").each(function(){
			if($("[name='"+name+"']").attr("class").match("select_subtitle"))
				$("[name='"+name+"']").addClass("level2_selected select_title");
		});
	}
}
	
function ImgEnable(img)
{
	img.each(function()
	{
		var src = $(this).attr("src");
		var id = "";
		if(src.match(btnR["check-disabled"]))
		{
			id = $(this).attr("id").slice(1);
			$(this).attr("src",btnR["check"]);
		}
		else if(src.match(btnR["default-disabled"]))
		{
			id = $(this).attr("id").slice(1);
			$(this).attr("src",btnR["default"]);
		}
		else if(src.match(btnC["check-disabled"]))
		{
			id = $(this).attr("id").slice(1);
			$(this).attr("src",btnC["check"]);
		}
		else if(src.match(btnC["default-disabled"]))
		{
			id = $(this).attr("id").slice(1);
			$(this).attr("src",btnC["default"]);
		}
		if(id !="")
			$("#"+id).attr("disabled", false);
	});
}

function ImgDisable(img)
{
	img.each(function(){
		var src = $(this).attr("src");
		var id = "";
		if(src.match(btnR["check"]))
		{
			id = $(this).attr("id").slice(1);
			$(this).attr("src",btnR["check-disabled"]);
		}
		else if(src.match(btnR["default"]))
		{
			id = $(this).attr("id").slice(1);
			$(this).attr("src",btnR["default-disabled"]);
		}
		else if(src.match(btnC["check"]))
		{
			id = $(this).attr("id").slice(1);
			$(this).attr("src",btnC["check-disabled"]);
		}
		else if(src.match(btnC["default"]))
		{
			id = $(this).attr("id").slice(1);
			$(this).attr("src",btnC["default-disabled"]);
		}
		if(id !="")
			$("#"+id).attr("disabled", true);
	});
}
// ========================================
//								  		 
// COOKIE FUNCTIONS			  	
// 								  			
// ======================================== 	
function createCookie(name, value, days) {
    if (days) 
	{
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
	}
	else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++) {
	var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
	if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
    }

function eraseCookie(name,type) {
	if((name !="sessionToken")){
		if(type == "All")
			createCookie(name, "", -1);
		else if((name !="SID"))
			createCookie(name, "", -1);
	}
}

function clearCookie(type)
{ 
	var ca = document.cookie.split(';');
	for (var i = 0; i < ca.length; i++)
	{
		eraseCookie(removeSpace(ca[i].split("=")[0]),type);
	}
} 
	
// Get GET variable from url, qs is the url.
function getQueryParams(qs) {
    qs = qs.split("+").join(" ");
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}

// ========================================
//								  		 
// REGULAR EXPRESSIONS	& TEST FUNCTION		  	
// 								  			
// ======================================== 

IPV4_ADDRESS_REGULAR_EXPRESSION = /^((25[0-5]|2[0-4]\d|[0-1]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[0-1]?\d\d?)$/;
IPV6_ADDRESS_REGULAR_EXPRESSION = /^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/;
MAC_ADDRESS_REGULAR_EXPRESSION = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
SINGLE_MAC_ADDRESS_REGULAR_EXPRESSION = /^([0-9a-fA-F][0-9a-fA-F])$/;
POSITIVE_INTEGER_REGULAR_EXPRESSION = /^[0-9]*[1-9][0-9]*$/;
ALPHANUMBERIC_PATTERN = /^[a-zA-Z0-9]{1,31}$/;
HOSTNAME_REGULAR_EXPRESSION = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
NON_NEGATIVE_INTEGER_REGULAR_EXPRESSION = /^(0|[1-9][0-9]*)$/;

function SingleMACAddrTest(addr)
{
	return SINGLE_MAC_ADDRESS_REGULAR_EXPRESSION.test(addr);
}

function MACAddrTest(addr)
{
	if ( addr.toLowerCase() == 'ff:ff:ff:ff:ff:ff' || addr == '00:00:00:00:00:00')
		return false;
	return MAC_ADDRESS_REGULAR_EXPRESSION.test(addr);
}

function IPv4AddrTest(addr)
{
	return (IPV4_ADDRESS_REGULAR_EXPRESSION.test(addr));
}

function IPv6AddrTest(addr)
{
	return (IPV6_ADDRESS_REGULAR_EXPRESSION.test(addr));
}

function PortTest(port)
{
	var pn = parseInt(port);
	if((pn >0) && (pn <=65535) && (isNonNegativeInt(port))){
		return 0;
	}
	else {
		eMessage = port + getLanguageResourcesById("wm15");
		return -1;
	}
}

function ReservedPortTest(protocol,port_S,port_E)
{
	var port = -1;
	var ReservedPort = {	"TCP" :	[25,53,135,137,138,139,161,162,445,1080],
							"UDP" : [53,135,137,139,161,162],
							"Both": [25,53,135,137,138,139,161,162,445,1080],
							"Protocol":{1: "TCP", 2: "UDP", 3: "Both"}};
	var P = ReservedPort["Protocol"][parseInt(protocol)];
	var tmpPort = ReservedPort[P];
	
	for(var i = 0 ; i < tmpPort.length ; i++)
	{
		if((parseInt(tmpPort[i]) > parseInt(port_S) ) && (parseInt(tmpPort[i]) < parseInt(port_E))) 
			port = 0;
		else if (parseInt(port_S) == parseInt(tmpPort[i]))
			port = port_S;
		else if(parseInt(port_E) == parseInt(tmpPort[i]))
			port = port_E;
		
		if(parseInt(port) != -1)
		{
			eMessage = getLanguageResourcesById("wm60")+"("+tmpPort.toString().replace(/,(?=[^,]+$)/, ' &')+")";
			break;
		}
	}
	return port;
}

function PositiveIntegerTest(value)
{
	return (POSITIVE_INTEGER_REGULAR_EXPRESSION.test(value));
}

function InputTextEnable(id, ValStr)
{
	var value = $('#' + id).val();
	/*var MLValue = getLanguageResourcesById(ValStr); //for Multiple Language
	if(value == MLValue)*/
	$('#' + id).removeClass('default');
	$('#' + id).addClass('enabled');		
	if(value == ValStr)
	{
		//$('#' + id).removeClass('default');
		//$('#' + id).addClass('enabled');	
		$('#' + id).val('');
	}
	
}
function InputTextDefault(id, ValStr)
{
	var value = $('#' + id).val();
	$('#' + id).addClass('default');
	$('#' + id).removeClass('enabled');
	if(value =="")
	{
		//$('#' + id).addClass('default');
		//$('#' + id).removeClass('enabled');
		//$('#' + id).val(getLanguageResourcesById(ValStr)); //for Multiple Language
		$('#' + id).val(ValStr);
	}
	
}

function gotoPagetop(){
	$('html, body').animate({ scrollTop:0 }, 'fast');
}

function changePWstatus(status, ArrowPosition, textPosition){
    
    var arrow = {	"weak":     "<svg height='4' width='7' class='svg-inject red  replaced-svg' xml:space='preserve' enable-background='new 197.6 220.9 199.6 124.4' viewBox='197.6 220.9 199.6 124.4' y='0px' x='0px' id='ArrowColor' version='1.1'><path d='M297.4,222.3h87.2c7.9,0,12.8,8.5,8.9,15.4l-87.2,101c-3.9,6.8-13.8,6.8-17.8,0  l-87.2-101c-3.9-6.8,1-15.4,8.9-15.4H297.4z' clip-rule='evenodd' fill-rule='evenodd'></path></svg>",
                    "good":         "<svg height='4' width='7' class='svg-inject orange  replaced-svg' xml:space='preserve' enable-background='new 197.6 220.9 199.6 124.4' viewBox='197.6 220.9 199.6 124.4' y='0px' x='0px' id='Layer_2' version='1.1'><path d='M297.4,222.3h87.2c7.9,0,12.8,8.5,8.9,15.4l-87.2,101c-3.9,6.8-13.8,6.8-17.8,0  l-87.2-101c-3.9-6.8,1-15.4,8.9-15.4H297.4z' clip-rule='evenodd' fill-rule='evenodd'></path></svg>",
                    "strong": 	    "<svg height='4' width='7' class='svg-inject green  replaced-svg' xml:space='preserve' enable-background='new 197.6 220.9 199.6 124.4' viewBox='197.6 220.9 199.6 124.4' y='0px' x='0px' id='Layer_2' version='1.1'><path d='M297.4,222.3h87.2c7.9,0,12.8,8.5,8.9,15.4l-87.2,101c-3.9,6.8-13.8,6.8-17.8,0  l-87.2-101c-3.9-6.8,1-15.4,8.9-15.4H297.4z' clip-rule='evenodd' fill-rule='evenodd'></path></svg>",
                    "extrastrong":       "<svg height='4' width='7' class='svg-inject green  replaced-svg' xml:space='preserve' enable-background='new 197.6 220.9 199.6 124.4' viewBox='197.6 220.9 199.6 124.4' y='0px' x='0px'  id='Layer_2' version='1.1'><path d='M297.4,222.3h87.2c7.9,0,12.8,8.5,8.9,15.4l-87.2,101c-3.9,6.8-13.8,6.8-17.8,0  l-87.2-101c-3.9-6.8,1-15.4,8.9-15.4H297.4z' clip-rule='evenodd' fill-rule='evenodd'></path></svg>"} 
                    
    var arrow_position = {	"weak":     "position:absolute; left:20px; top:6px; z-index:100; margin:0px;",
                            "good":         "position:absolute; left:70px; top:6px; z-index:100; margin:0px;",
                            "strong": 	    "position:absolute; left:140px; top:6px; z-index:100; margin:0px;",
                            "extrastrong":       "position:absolute; left:200px; top:6px; z-index:100; margin:0px;"}  
    
    var str_position = {	"weak":     "position:absolute; left:0px; top:22px; z-index:100; font-size:14px; margin:0px;",
                            "good":         "position:absolute; left:60px; top:22px; z-index:100; font-size:14px; margin:0px;",
                            "strong": 	    "position:absolute; left:130px; top:22px; z-index:100; font-size:14px; margin:0px;",
                            "extrastrong":       "position:absolute; left:177px; top:22px; z-index:100; font-size:14px; margin:0px;"}  

    switch(status){    
        case 'weak':
            $('#'+ ArrowPosition).html(arrow.weak);
            $('#'+ ArrowPosition).attr("style",arrow_position.weak);
            
            $('#' + textPosition).attr("style",str_position.weak);
            $('#' + textPosition + ' span').html(getLanguageResourcesById("c_st23")).attr("class","red");
        break;
        case 'good':
            $('#' + ArrowPosition).html(arrow.good);
            $('#' + ArrowPosition).attr("style",arrow_position.good);
                                
            $('#' + textPosition).attr("style",str_position.good);
            $('#' + textPosition + ' span').html(getLanguageResourcesById("c_st20")).attr("class","orange");
        break;
        case 'strong':
            $('#' + ArrowPosition).html(arrow.strong);
            $('#' + ArrowPosition).attr("style",arrow_position.strong);
                                
            $('#' + textPosition).attr("style",str_position.strong);
            $('#' + textPosition + ' span').html(getLanguageResourcesById("c_st21")).attr("class","green");
        break;
        case 'extrastrong':
            $('#' + ArrowPosition).html(arrow.extrastrong);
            $('#' + ArrowPosition).attr("style",arrow_position.extrastrong);
                                
            $('#' + textPosition).attr("style",str_position.extrastrong);
            $('#' + textPosition + ' span').html(getLanguageResourcesById("c_st24")).attr("class","green");
        break;
    }
    
}

function checkPasswordStrength(passkey, RestrictiveSize) {
        var strength = 0
        if (passkey.length < RestrictiveSize) {
            return 'Wrong Value'
        }
        if (passkey.length >= RestrictiveSize) strength += 1
        // If password contains both lower and uppercase characters, increase strength value.
        if (passkey.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength += 1
        // If it has numbers and characters, increase strength value.
        if (passkey.match(/([a-zA-Z])/) && passkey.match(/([0-9])/)) strength += 1
        // If it has one special character, increase strength value.
        if (passkey.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1
        // If it has two special characters, increase strength value.
        if (passkey.match(/(.*[!,%,&,@,#,$,^,*,?,_,~].*[!,%,&,@,#,$,^,*,?,_,~])/)) strength += 1
        // Calculated strength value, we can return messages
        if(passkey.length >= 8 && RestrictiveSize == 1) strength += 1 
		// for login password.
        return strength;
}
/*var old_token=0;//for debuging*/
function updateToken(){
	_Token = readCookie('sessionToken');
	/* debug_token S */
	/*if(old_token!=_Token){
		console.log("_Token change:"+_Token);
		old_token = _Token;
	}*/
	/*debug_token E */
}

function InfoCircleOption(id,textid,Arrow_type)
{
    var text='<div class="dynamic" id="'+textid+'"></div>';
	//Usage: use $('#'+id).offset() to get info circle icon's absolute position
	var input_id = id.slice(1);
    
    var infoY=$('#'+id).offset().top;
    var infoX=$('#'+id).offset().left;
    var infoHeight = $('#'+input_id).height();
   
	if( $( '#'+input_id ).prop('checked')?true:false || (textid==undefined) || (textid==""))
	{		
		$( '#'+input_id ).prop( "checked", false );		
        $( '#'+input_id+'_bubbleInfoBox').remove();
	}
	else
	{	
		$( '#'+input_id ).prop( "checked", true );
        
        switch(Arrow_type){
    	    case '1': //down-left

                var st="\
                <div id="+input_id+"_bubbleInfoBox style='position:absolute; left:0px; top:0px; z-index:11000; padding-top: 0px;'>\
                    <table cellpadding='0' cellspacing='0'>\
                       <tr><td id="+input_id+"_bubbleInfo class='infobubble-down'>"+text+"</td></tr>\
                       <tr><td style='background:url(../images/common_imgs/bubble-arrow-down-left.png) no-repeat left top'>&nbsp;</td></tr>\
                    </table>\
                </div>"

                $(bubblecontent).append(st);  
                updateContent();
                var bubeleBoxheight=$('#'+input_id+'_bubbleInfoBox').height();
                var adjustX = infoY - (bubeleBoxheight);

                $('#'+input_id+'_bubbleInfoBox').prop("style").top  = adjustX + "px";
                $('#'+input_id+'_bubbleInfoBox').prop("style").left = infoX - 25+"px";

			break;
		    case '2': //down-right

                var st="\
                <div id="+input_id+"_bubbleInfoBox style='position:absolute; left:0px; top:0px; z-index:11000; padding-top: 0px;'>\
                    <table cellpadding='0' cellspacing='0'>\
                       <tr><td id="+input_id+"_bubbleInfo class='infobubble-down'>"+text+"</td></tr>\
                       <tr><td style='background:url(../images/common_imgs/bubble-arrow-down-right.png) no-repeat right top'>&nbsp;</td></tr>\
                    </table>\
                </div>"
               
			break;
		    case '3': //up-left

                var st="\
                <div id="+input_id+"_bubbleInfoBox style='position:absolute; left:0px; top:0px; z-index:11000; padding-top: 0px;'>\
                    <table cellpadding='0' cellspacing='0'>\
                       <tr><td style='background:url(../images/common_imgs/bubble-arrow-up-left.png) no-repeat left bottom'>&nbsp;</td></tr>\
                       <tr><td id="+input_id+"_bubbleInfo class='infobubble-up'>"+text+"</td></tr>\
                    </table>\
                </div>"
                
                $(bubblecontent).append(st);  
                updateContent();
                $('#'+input_id+'_bubbleInfoBox').prop("style").top  = infoY + 15+"px";
                $('#'+input_id+'_bubbleInfoBox').prop("style").left = infoX - 25+"px";                
			break;
			case '4': //up-right

                var st="\
                <div id="+input_id+"_bubbleInfoBox style='position:absolute; left:0px; top:0px; z-index:11000; padding-top: 0px;'>\
                    <table cellpadding='0' cellspacing='0'>\
                       <tr><td style='background:url(../images/common_imgs/bubble-arrow-up-right.png) no-repeat right bottom'>&nbsp;</td></tr>\
                       <tr><td id="+input_id+"_bubbleInfo class='infobubble-up'>"+text+"</td></tr>\
                    </table>\
                </div>"

			break;
    	    case '5': //right-top

                var st="\
                <div id="+input_id+"_bubbleInfoBox style='position:absolute; left:0px; top:0px; z-index:11000; padding-top: 0px;'>\
                    <table cellpadding='0' cellspacing='0'>\
                       <tr><td id="+input_id+"_bubbleInfo class='infobubble-right'>"+text+"</td>\
                       <td style='background:url(../images/common_imgs/bubble-arrow-right-top.png) no-repeat left top; width: 12px;'>&nbsp;</td></tr>\
                    </table>\
                </div>"

			break;
		    case '6': //right-bottom

                var st="\
                <div id="+input_id+"_bubbleInfoBox style='position:absolute; left:0px; top:0px; z-index:11000; padding-top: 0px;'>\
                    <table cellpadding='0' cellspacing='0'>\
                       <tr><td id="+input_id+"_bubbleInfo class='infobubble-right'>"+text+"</td>\
                       <td style='background:url(../images/common_imgs/bubble-arrow-right-bottom.png) no-repeat left bottom; width: 12px;'>&nbsp;</td></tr>\
                    </table>\
                </div>"

			break;
		    case '7': //left-bottom

                var st="\
                <div id="+input_id+"_bubbleInfoBox style='position:absolute; left:0px; top:0px; z-index:11000; padding-top: 0px;'>\
                    <table cellpadding='0' cellspacing='0'>\
                       <tr><td style='background:url(../images/common_imgs/bubble-arrow-left-bottom.png) no-repeat left bottom; width: 12px; padding-right: 0px;'>&nbsp;</td>\
                       <td id="+input_id+"_bubbleInfo class='infobubble-left'>"+text+"</td></tr>\
                    </table>\
                </div>"

                $(bubblecontent).append(st);  
                updateContent();
                var bubeleBoxheight=$('#'+input_id+'_bubbleInfoBox').height();
                
                var adjustX = infoY +10- (bubeleBoxheight-infoHeight);
                //console.log(id+" "+infoY+" "+infoX);
                //console.log(bubeleBoxheight+" "+infoHeight+" "+adjustX );
                
                $('#'+input_id+'_bubbleInfoBox').prop("style").top  = adjustX + "px";
                $('#'+input_id+'_bubbleInfoBox').prop("style").left = infoX + 30+"px";
			break;
			case '8': //left-top

                var st="\
                <div id="+input_id+"_bubbleInfoBox style='position:absolute; left:0px; top:0px; z-index:11000; padding-top: 0px;'>\
                        <table cellpadding='0' cellspacing='0'>\
                           <tr><td style='background:url(../images/common_imgs/bubble-arrow-left-top.png) no-repeat left top; width: 12px; padding-right: 0px;'>&nbsp;</td>\
                           <td id="+input_id+"_bubbleInfo class='infobubble-left' >"+text+"</td></tr>\
                        </table>\
                </div>"

                $(bubblecontent).append(st);  
                updateContent();
                $('#'+input_id+'_bubbleInfoBox').prop("style").top  = infoY - 10+ "px";
                $('#'+input_id+'_bubbleInfoBox').prop("style").left = infoX + 30+"px";
                
			break;			
        }
        
        if(text!=""){
            //$('#'+input_id+'_bubbleInfo').html(text); //text need space to change line
        }else{
            $('#'+input_id+'_bubbleInfo').html("Null string");
        }
		updateContent();
	}
}

function verifyEmail(EmailID)
{
	var emailRule = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;					
	var Email = $("#"+EmailID).val();
	var EmailLen = $("#"+EmailID).val().length;
	
	if(Email == "")
	{
		return false;
	}
	if(Email.match(emailRule))
	{
		return true;
	}
	else
	{
		return false;
	}
}

function verifyEmail_ErrMsg(EmailID, ErrMsg)
{
	var emailRule = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/;					
	var Email = $("#"+EmailID).val();
	var EmailLen = $("#"+EmailID).val().length;
	
	if(Email == "")
	{
		$("[name=MailErrMsg]").text(getLanguageResourcesById('wm00'));
		//$("#"+ErrMsg).show();
		$('[name='+ErrMsg+']').show();
		$("#"+EmailID).addClass("error");
		return false;
	}
	if(Email.match(emailRule))
	{
		$("#"+ErrMsg).hide();
		$('[name='+ErrMsg+']').hide();
		$("#"+EmailID).removeClass("error");
		return true;
	}
	else
	{
		$("[name=MailErrMsg]").text(getLanguageResourcesById('wm01'));
		$('[name='+ErrMsg+']').show();
		$("#"+EmailID).addClass("error");
		return false;
	}
}

function CancelMailErrMsg(EmailID, ErrMsg)
{
	$('[name='+ErrMsg+']').hide();
	$("#"+EmailID).removeClass("error");
}
function isHexDigit(digit) {
   var hexVals = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
                           "A", "B", "C", "D", "E", "F", "a", "b", "c", "d", "e", "f");
   var len = hexVals.length;
   var len2 = digit.length;
   var ret = true;
   for( j = 0; j < len2; j++){
     for ( i = 0; i < len; i++ ){
        if ( digit.charAt(j) == hexVals[i] ) break;
     }
     if ( i >= len )
      ret = false;
   }
   return ret;
}


/*CBN150122 Zacks add for count different char/repeat percent & new PW strength method S*/
function CountDiffCharNum(t){

    var CharCount=0;
    for (var i=0; i<t.length; i++)
    {
        var p=t[i];
        
        for (var j=i+1; j<t.length; j++){
            if (t[j] == p)
            {
                CharCount++;
                break;
            }
        }
    }
    var DiffNum=t.length-CharCount;

    return DiffNum;
}

function checkPasswordStrengthV2(passkey, RestrictiveSize) {
        var strength = 0
        if (passkey.length < RestrictiveSize) {
            return strength;
        }
        
        var strength = VMcheckPasswordStrength(passkey,RestrictiveSize);
        //console.log('VM str: '+strength);
        return strength;
}

function CountRepeatPercent(t){

    var highestPercent=0;
    for (var i=0; i<t.length; i++)
    {
        var percent=0;    
        var p=t[i];

        for (var j=i+1; j<t.length; j++){
            if (t[j] == p)
            {
                percent++;
            }
        }
        var allP=(percent+1)/t.length;
        if(highestPercent<allP){highestPercent=allP}
    }    

    //console.log("highestPercent:"+" "+highestPercent);
    return highestPercent;
}
/*CBN150122 Zacks add for count different char/repeat percent & new PW strength method E*/

/*CBN141212 Zacks add for notice S*/
function Notice(url,id)
{
	if (SetTimeout)
		return;
	
	loadGlobalValue();
	gotoPagetop();
	
    if(_WPSinterval==1){
        _WPSinterval=0;
        window.clearInterval(WPSinterval);
    }
	
	$.get(url, function(result){
	
		if(result.match("cbnLogin") || result.match("cbnFirstInstall"))
		{
			RemoveErrMsg("loginPassword");
			$("#noticelogin").show();
		}
		else
		{
			$result = $(result);
			$('#'+id).empty();
			$result.filter("div").appendTo('#'+id);
			$result.filter("style").appendTo('#'+id);
			$result.filter("#mainScript").appendTo('#'+id);
		}
	}, 'html').fail(function() {ReloadPage();});

}

function NoticeStrart(CurrentPage,CurrentPageApplyFunction){
	NoticeCheckIsChange = checkIsChange;
    _CurrentPage=CurrentPage;
    _CurrentPageApplyFunction=CurrentPageApplyFunction;
}

function NoticeClear(){
	NoticeCheckIsChange = nothingIsChange;
}

/*CBN141212 Zacks add for notice E*/

function DisableRadioOff(input){
    		$('#'+input).attr("disabled", true);
        	if($('#'+input).prop('checked')){ //clicked   enable/turn on all checkbox	
        		$('#i'+input).attr("src", "../images/common_imgs/radio-box-checked-disabled.png");
        	}else{	
        		$('#i'+input).attr("src", "../images/common_imgs/radio-box-default-disabled.png");
        	}           		        	    
    		$('#'+input+'Label').removeClass('general_text');
    		$('#'+input+'Label').addClass('general_text_disabled');      
}

function DisableRadioOn(input){
            $('#'+input).removeAttr("disabled");
        	if($('#'+input).prop('checked')){ //clicked   enable/turn on all checkbox	
        		$('#i'+input).attr("src", "../images/common_imgs/radio-box-checked.png");
        	}else{	
        		$('#i'+input).attr("src", "../images/common_imgs/radio-box-default.png");
        	}           		        	    
    		$('#'+input+'Label').removeClass('general_text_disabled');
    		$('#'+input+'Label').addClass('general_text');
}
var MacAddrErrTag=0;
function InputErrMsg(InputID, MsgId, text)
{
	ApplyStatusMsgRemove();
	var field, ftd="";
	var o_onfocus = $("#"+InputID).attr("onfocus");
	if(!o_onfocus.match("RemoveErrMsg"))
		$("#"+InputID).attr("onfocus", o_onfocus +'RemoveErrMsg("'+InputID+'")');
		
	var Numoftd = $("#"+InputID).parent().index();
	var colspanNum = $("#"+InputID).parent().parent().find("td").length - Numoftd;
	if($("#"+InputID).parent().is('td')==true)
	{
		var tmp_n = $("#"+InputID).parent().attr("colspan");
		if(tmp_n >= 1)
			colspanNum += tmp_n -1;
	}
	for(var i = 0; i < Numoftd; i++)
	{
		ftd += '<td></td>';
	}
	if(text == "")
	{		
		field ='<tr name="ErrMsgField">' + ftd;
		field += '<td align="left" colspan="'+ colspanNum +'"><table cellpadding="0" cellspacing="0" border="0"  class="error-msg-small"><tr><td valign="middle" style="padding:0px 8px 0px 0px;"><img src="../images/common_imgs/error-icon.svg" ></td>'+
				   '<td name="ErrMsg" id="'+MsgId+'" class="dynamic" valign="middle" style="padding:0px; white-space:nowrap;"></td></tr></table></td><td></td></tr>';
	}
	else if(MsgId == "")
	{
		field ='<tr name="ErrMsgField">' + ftd;
		field += '<td align="left" colspan="'+ colspanNum +'"><table cellpadding="0" cellspacing="0" border="0"  class="error-msg-small"><tr><td valign="middle" style="padding:0px 8px 0px 0px;"><img src="../images/common_imgs/error-icon.svg" ></td>'+
				   '<td name="ErrMsg" id="ErrMsgText" valign="middle" style="padding:0px; white-space:nowrap;"></td></tr></table></td><td></td></tr>';
	}
	var tag = $('#'+InputID).parent().parent();
		
	if(tag.next().attr("name") == "ErrMsgField")
		tag.next().remove();
		
	$('#'+InputID).addClass("error");		
	$(tag).after(field).next().find('#ErrMsgText').text(text);
	updateContent();
	MacAddrErrTag = $("input[id*=mac][class*=error]").length;
}
function RemoveErrMsg(InputID)
{
	if(InputID.match("mac") && ($("#"+InputID).attr("class").match("error")))MacAddrErrTag--;
	
	var tag = $('#'+InputID).parent().parent();
	$('#'+InputID).removeClass("error");
	if((tag.next().attr("name") == "ErrMsgField") && ((MacAddrErrTag == 0) || (!InputID.match("mac"))))
	{		
		tag.next().remove();			
	}
}
function CheckMacAddr(id)
{	
	if(!SingleMACAddrTest($('#'+id).val()) && ($('#'+id).val() != ""))
	{			
		InputErrMsg(id,"", $('#'+id).val() + getLanguageResourcesById('wm23'));		
	}
	else
	{			
		var errmsg=$("input[id*=mac][class*=error]").first().attr("id");
		if(errmsg === undefined)return;
		var errval=$("input[id*=mac][class*=error]").first().val();	
		if(SingleMACAddrTest(errval))RemoveErrMsg(errmsg);
		else InputErrMsg(errmsg,"", $('#'+errmsg).val() + getLanguageResourcesById('wm23'));		
	}	
}
function AnyTimeCheckMacAddr(id)
{
	var ErrMsg = "";
	ErrMsg = $("#"+id).parent().parent().next();
	RemoveErrMsg(id);
	if($('#'+id).val().length == 2)CheckMacAddr(id);
	if(($(ErrMsg).attr("name")=="ErrMsgField") && ($(ErrMsg).find(".dynamic").attr("id")=="wm06"))
	{
		$(ErrMsg).remove();
		for(j = 1;j <= 6;j++)
			RemoveErrMsg("mac0"+j);
	}
}
function CheckIPaddr(id)
{
	var status = "NOK";
	if($('#'+id).val() != "")
	{
		var ipaddr = $('#'+id).prev().text() + $('#'+id).val();		
		if(!IPv4AddrTest(ipaddr))
		{			
			InputErrMsg(id,"", ipaddr + getLanguageResourcesById('wm11'));
		}	
		else
		{
			$('#'+id).val(parseInt($('#'+id).val()));	
			status = "OK";
		}
	}
	return status;
}
function CheckIPv6addr(id)
{	
	var ipaddr = $('#'+id).val(), saddr = new Array();
	saddr = ipaddr.split("/");
	
	if(!IPv6AddrTest(saddr[0]))
	{			
		InputErrMsg(id,"", ipaddr + getLanguageResourcesById('wm11'));		
	}		
}


function countMaxPWKeyLowerCaseNum(passkey,num) {

        var count=0; var chain=0; var bigestChain=0;
        for(var i=0;i<passkey.length;i++){
        
            if (passkey[i].match(/([a-z])/)){
                count++;
                if(i==0){
                    chain++;
                    //console.log(passkey[i]+chain)
                }else{
                    if( passkey[(i-1)]!="" ){
                        if(passkey[(i-1)].match(/([a-z])/)){
                            chain++;
                            //console.log(passkey[(i-1)]+passkey[i]+chain)
                        }else{
                            if(chain>bigestChain){bigestChain=chain;}
                            chain=1;
                        }
                    }
                }
            }
        }
        if(chain>bigestChain){bigestChain=chain;}
        //console.log(count+" "+bigestChain);
        
        if(bigestChain>=num){ //password cannot have 10 characters in a row in lower case
            return true;
        }
        return false;
}

function VMcheckSpecialCharNum(password){
    
    var count=0;
    var length=password.length;
    for(l=0;l<length;l++){
       if(password[l].match(/([!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~])/))
       {
            count++
       }
    }
    return count;    
    
}

function VMcheckCapitalCharNum(password){
    
    var count=0;
    var length=password.length;
    for(l=0;l<length;l++){
       if(password[l].match(/([A-Z])/))
       {
            count++
       }
    }
    return count;    
    
}

function VMcheckSmallCharNum(password){
    
    var count=0;
    var length=password.length;
    for(l=0;l<length;l++){
       if(password[l].match(/([a-z])/))
       {
            count++
       }
    }
    return count;    
}

function VMcheckNumbersCharNum(password){
    
    var count=0;
    var length=password.length;
    for(l=0;l<length;l++){
       if(password[l].match(/([0-9])/))
       {
            count++
       }
    }
    return count;    
    
}

function VMcheckPasswordStrength(password,RestrictiveSize)
{
	var wifipwlevel = { insufficient : 0, good : 1, strong : 2, veryStrong : 3};
	var length = password.length;
	var captials = VMcheckCapitalCharNum(password);
	var smalls = VMcheckSmallCharNum(password);
	var numbers = VMcheckNumbersCharNum(password);
	var specials = VMcheckSpecialCharNum(password);
	var strength = wifipwlevel["insufficient"];
	
	
	/* CBN_S - Rex - 20170418 */
	for(var i = 0; i < password.length; i++)
	{
		var charValueDecimal = password.charCodeAt(i);
		if(charValueDecimal == 32)
		{			
			return wifipwlevel["insufficient"];
		}			
    }
	/* CBN_E - Rex - 20170418 */
	
	if((isVerifyASCII(password)===false) || (length > 63))
	{
		return wifipwlevel["insufficient"];
	}
		
	if((14<=length) && (captials>= 3) && (smalls>=3))
	{
		if((30<=length) || ((specials>=1) && (numbers>=3)))
		{
			return wifipwlevel["veryStrong"];
		}
	}
	
	if((12<=length) && (captials>=2) && (smalls>=2) && (numbers>=2)){
		strength = wifipwlevel["strong"];
	}else if((parseInt(RestrictiveSize)<=length) && (captials>=1) && (smalls>=1) && (numbers>=1)){
		strength = wifipwlevel["good"];
	}
	return strength;
}

function isVerifyASCII(value)
{	
	for(var i = 0; i < value.length; i++)
	{
		var charValueDecimal = value.charCodeAt(i);
		if(charValueDecimal < 32 || charValueDecimal > 126){			
			return false;
		}			
    }
	return true;
}

function IPnumber(IPaddress) {
    var ip = IPaddress.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if(ip) {
        return (+ip[1]<<24) + (+ip[2]<<16) + (+ip[3]<<8) + (+ip[4]);
    }
    return null;
}

function IPmask(maskSize) {
    return -1<<(32-maskSize)
}

function isVaildUserPwd(pwd)
{
	var Upper = VMcheckCapitalCharNum(pwd);
	var lower = VMcheckSmallCharNum(pwd);
	var Number = VMcheckNumbersCharNum(pwd);
	var vaild = false;
	if(Upper>0 && Number > 0 && pwd.length >= 8 && pwd.length < 32){
		vaild = true;
	}
	return vaild;
}

function getXmlWifiPreSharedKey(xmlResponse, node)
{
	WIFIPWD.length = 0;
	WIFIPWD[0] = $(xmlResponse).find('PreSharedKey2g').text();
	WIFIPWD[1] = $(xmlResponse).find('PreSharedKey5g').text();
}

function CheckPrimaryGuestPWIsSame(password)
{
	var same = false
	for(var i = 0 ; i < WIFIPWD.length ; i++)
	{
		if(password == WIFIPWD[i])
		{
			same = true;
			break;
		}
	}
	return same;
}

function getUsMSGtype(messageType){
    switch(messageType){
        case '2':
            return '1.0';
            break;
        case '29':
            return '2.0';
            break;
        case '35':
            return '3.0';
            break;        
    }
}

function is_valid_url(url)
{
	var validurl = /^[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/;
	if(validurl.test(url))
		return "OK";
	else
		return "NOK";
}

function updateSID(response)
{
	var patt = new RegExp("successful");
	if((patt.test(response)) != true){	
		clearCookie("notAll");
	}else{
		var SID = response.split("SID=")[1];
		createCookie("SID", (isNumeric(SID)===true?SID:0), false);
	}
}

function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function isNonNegativeInt(value) 
{
    return ((value).match(NON_NEGATIVE_INTEGER_REGULAR_EXPRESSION) != null);
}
//Show Result For Update
function updatesuccess() 
{
	$("#ShowResult").empty().append($('<div class="settings-updates-success"><table cellpadding="5" cellspacing="0" align="center"><tr class="update_success" id="successful"><td valign="middle"><img src="../images/common_imgs/allgood-icon.svg" class="svg-inject green" width="30" height="30"></td><td class="dynamic" id="c_72" valign="middle"></td></tr></table></div>'));
	updateContent();
}

function updateerror() 
{
	$("#ShowResult").empty().append($('<div class="settings-updates-error"><table  cellpadding="5" cellspacing="0" align="center"><tr class="update_error" id="error"><td valign="middle"><img src="../images/common_imgs/error-icon.svg" class="svg-inject red" width="30" height="30"></td><td class="dynamic" id="c_73" valign="middle"></td></tr></table></div>'));	
	updateContent();
}

function ApplyStatusMsgRemove()
{
	$("#ShowResult > .settings-updates-success, #ShowResult > .settings-updates-success").fadeOut(1000, function(){$(this).remove();});
}

/* CBN_S - 20171030 - Cross - When apply wifi settings check wifi status to reload page. */
function CheckWifiStatus(path)
{
	ajaxGet({'fun':328},"",function(xmlResponse, node)
	{
		if($(xmlResponse).find('isWirelessResetting').text() == "0")
		{
			if(path.localeCompare(_currentpage)){
				goto(_currentpage,"content");
			}
			else{
				goto(_currentpage,"content",updatesuccess);
			}
		}
		else
		{
			setTimeout(function(){CheckWifiStatus(path);}, 5000);
		}
	});
}
/* CBN_E - 20171030 - Cross - When apply wifi settings check wifi status to reload page. */
