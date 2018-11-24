var langtxt = {	"en" : "", "es" : "", "de" : "", "tw" : "", "cn" : "", "nl" : "",
				"fr" : "", "cz" : "", "pl" : "", "sk" : "", "it" : "", "tr" : "",
				"ro" : "", "hu" : "", "ru" : "", "uk" : ""};
var langID2val = {"c_lg01":"en","c_lg02":"de","c_lg03":"es","c_lg04":"tw","c_lg05":"cn",
				"c_lg06":"nl","c_lg07":"fr","c_lg08":"cz","c_lg09":"pl","c_lg10":"sk",
				"c_lg11":"it","c_lg12":"tr","c_lg13":"ro","c_lg14":"hu", "c_lg15":"ru"};
var DEFAULT_LANGUAGE_ID = "en";
var LANGUAGE_ID = "en";
var ERROR_XML_TRANSLATE = 'error_translate';
var _Token = "";
var _WebCaPortalTag ="";

function loadContent(){

	cbnAjax({
        url:"../xml/getter.xml",
        type:"POST",
        data: {'fun':3},
        dataType:"xml",
        error:function(xmlResponse) {
        	displayErrorMessage();
        },
        success:function(xmlResponse) {
        	getLanguageContent(xmlResponse);
        }
	});
}

function cachefile ( url, callback ) {
	callback = (typeof callback != 'undefined') ? callback : {};
	cbnAjax({
		type: "GET",
		url: url,
		success: callback,
		dataType: url.match("json")?"json":"script",
		cache: true,
		error: function(){
			if(url.match("/lang/"))
			{
				FirstInstallAjaxSet({'fun':4,'lang': DEFAULT_LANGUAGE_ID});
				if (window.console)
					console.log("File is not exist!("+url+")");
			}
			ReloadPage();				
        }
	});
}

function changeLanguage(lang){

    var langResources = langtxt[lang];
	//change lang
	$(".dynamic").each(function(i, elt){
	var id = $(elt).attr("id").toLowerCase();
	
	if(typeof(langResources[id])!="undefined")
		$(elt).html(langResources[id]);
	else
		$(elt).html(ERROR_XML_TRANSLATE);
    });
	
	//change button lang
	$(".dynamicValue").each(function(i, elt){
	var bid = $(elt).attr("id");		
	if(typeof(langResources[bid])!="undefined")
		$(this).attr({"value": langResources[bid]});
	else
		$(this).attr({"value": ERROR_XML_TRANSLATE});
    });
	
	$("[name=ProductName]").each(function(i, elt){
		//$(elt).html(_ConfigModelName);
		$(elt).html("Wireless Gateway");
	});
  $( "body" ).fadeIn(200);
}

function getLanguageContent(xmlResponse){
	LANGUAGE_ID = $(xmlResponse).find('Lang').text();
	_WebCaPortalTag = $(xmlResponse).find('WebCapPor').text();
	if(langtxt[LANGUAGE_ID] != undefined)
	{	
		cachefile("/lang/"+LANGUAGE_ID+".json?v=20180320185538", function(resp) {
			langtxt[LANGUAGE_ID] = resp ;
			changeLanguage(LANGUAGE_ID);
		});	
	}	
	else
	{
		cachefile("/lang/"+DEFAULT_LANGUAGE_ID+".json?v=20180320185538", function(resp) {
			LANGUAGE_ID = DEFAULT_LANGUAGE_ID;
			langtxt[LANGUAGE_ID] = resp ;
			changeLanguage(LANGUAGE_ID);
		});	
	}
	if(window.location.pathname == "/common_page/FirstInstallation.html")//modify
	{		
		checkedLang();
	}
}

function updateContent(){

	if(langtxt[LANGUAGE_ID]=="")
	{
		cachefile("/lang/"+LANGUAGE_ID+".json?v=20180320185538", function(resp) {
			langtxt[LANGUAGE_ID] = resp ;
			changeLanguage(LANGUAGE_ID);
		});	
	}
	else{
		changeLanguage(LANGUAGE_ID);
	}
	$("#content").fadeIn(300);
}

function checkedLang()
{
	switch(LANGUAGE_ID){
		case 'en':
			RadioOption('iEN','Language')
			break;
		case 'de':
			RadioOption('iDE','Language')
			break;
		case 'es':
			RadioOption('iES','Language')
			break;
		case 'tw':
			RadioOption('iTW','Language')
			break;
		case 'cn':
			RadioOption('iCN','Language')
			break;
		case 'nl':
			RadioOption('iNL','Language')
			break;
		case 'fr':
			RadioOption('iFR','Language')
			break;
		case 'cz':
			RadioOption('iCZ','Language')
			break;
		case 'pl':
			RadioOption('iPL','Language')
			break;
		case 'sk':
			RadioOption('iSK','Language')
			break;
		case 'it':
			RadioOption('iIT','Language')
			break;
		case 'tr':
			RadioOption('iTR','Language')
			break;
		case 'ro':
			RadioOption('iRO','Language')
			break;
		case 'hu':
			RadioOption('iHU','Language')
			break;
		case 'ru':
			RadioOption('iRU','Language')
			break;
		default:			
			RadioOption('iEN','Language')
	}
}

function getLanguageResourcesById(id)
{
	var string = langtxt[LANGUAGE_ID][id];
	if((string != undefined) && (string.match("name='ProductName'") != null))
	{
		string = langtxt[LANGUAGE_ID][id].replace(/<span name='ProductName'><\/span>/, "Wireless Gateway");
	}
	return string;
}

function languageID(id){
	
	switch(id){
		case "en":
			return "c_lg01";
			break;
		case "de":
			return "c_lg02";
			break;
		case "es":
			return "c_lg03";
			break;
		case "tw":
			return "c_lg04";
			break;
		case "cn":
			return "c_lg05";
			break;
		case "nl":
			return "c_lg06";
			break;
		case "fr":
			return "c_lg07";
			break;
		case "cz":
			return "c_lg08";
			break;
		case "pl":
			return "c_lg09";
			break;
		case "sk":
			return "c_lg10";
			break;
		case "it":
			return "c_lg11";
			break;
		case "tr":
			return "c_lg12";
			break;
		case "ro":
			return "c_lg13";
			break;
		case "hu":
			return "c_lg14";
			break;
		case "ru":
			return "c_lg15";
			break;
		case "uk":
			return "c_lg01";
			break;
		}
}

function addLanglist(xmlResponse){
	
	$(xmlResponse).find('lang_support').each(function(){
	var lang = $(this).text();	
	$("#DropDownList-Lang").append($("<option></option>").addClass("dynamic").attr({"value": lang, "id": languageID(lang)}));
	});
}

function FirstInstallAjaxSet(data){
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