"use strict";

function makeInnerContent(string, element) {
	var innerHTMLdiv = document.createElement('div');
	while (element.hasChildNodes()) {
		element.removeChild(element.lastChild)
	}

	innerHTMLdiv.innerHTML = string;

	element.appendChild(innerHTMLdiv);
}

function makeOptions(element, optionsArray) {

	var docFrag = document.createDocumentFragment();

	for (var i = 0; i < optionsArray.length; i++) {
		var currentOption = optionsArray[i];
		var op = document.createElement('option');

		op.value = currentOption[0];
		op.innerHTML = currentOption[1];
		if (currentOption[2]) {
			op.setAttribute('selected', 'selected');
		}
		if (currentOption[3]) {
			op.setAttribute('disabled', 'disabled');
		}

		docFrag.appendChild(op);
	}

	while (element.hasChildNodes()) {
		element.removeChild(element.lastChild);
	}

	element.appendChild(docFrag);
}

function makeAjaxRequest(xmlhttp, queryRequestScriptPHP, queryResultsFunctionJS, AJAXRequestString) {
	//xmlhttp - xmlhttp object
	//AJAXRequestString - the request parameter string
	//queryRequestScriptPHP - script to send the request parameter to
	//queryResultsFunctionJS - function to handle the response

	xmlhttp.open('POST', queryRequestScriptPHP, true);
	xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xmlhttp.send(AJAXRequestString);
	xmlhttp.onreadystatechange = queryResultsFunctionJS;
}

function makeEl(elementName, attributeObj){
	var newEl =  document.createElement(elementName);

	for(var key in attributeObj){
		if(attributeObj.hasOwnProperty(key)){
			newEl[key] = attributeObj[key]
		}
	}

	return newEl;

}
