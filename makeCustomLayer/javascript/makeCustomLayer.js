/*
        File:       makeCustomLayer.js
        Author:       Karol Sanchez
        Info:       functionality for creating a custom layer
*/

//namespace
var customLayersNS = (function () {
  "use strict";
  var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
  var ss_LayerObjects = window.sessionStorage.getItem('layerObs');
  var ss_sessionId = window.sessionStorage.getItem('sessId');
  var sessionAndMap;
  var layerSource;

 
  /*** FORM FUNCTIONALITY ***/
  var Form = (function () {
    /*
      fields
        private static
          featureSources
        private instance
          form
          formEls

      methods
        public instance 
          setForm
          getForm
          getFormEls
          fillSource
          fillClass
          createRuleOptions
          validate
        
        private static 
          createColorPicker
          createMarkPicker
      */

    var featureSources = {};

    //constructor
    function cls() {
      var self = this;
      var form = '';      //the HTML form element
      var formEls = '';   //array of HTML input/select elements

      //request the feature sources from the server
      this.setForm = function (formId, sourceType, sessMap, existingLayersArray) {
        existingLayersArray = typeof existingLayersArray !== 'undefined' ? existingLayersArray : 'nothing';
        layerSource = sourceType;
        sessionAndMap = sessMap;
        form = document.getElementById(formId);
        formEls = this.setFormEls(layerSource);
        
        //fill form based on desired layer source
        if(layerSource == 'existingLayers'){
          //create array to hold the option values for the layers drop down menu
            var optionsArray = [
              ['', 'Choose...', true, true]   //the first option in all the drop down menus: [value, innerHTML, selected, disabled]
            ]; 
            var counter = 1;

            //fill the options array for each layer

            for(var i = 0; i < existingLayersArray.length; i++) {
              
              if(existingLayersArray[i].legend !== ""){
                optionsArray[counter] = [existingLayersArray[i].name, existingLayersArray[i].legend, false, false];
                counter++;
               
              }
            }

            //fill the layers drop down menu 
            makeOptions(formEls.namedItem('existinglayers'), optionsArray);

        }else{

          makeAjaxRequest(xmlhttp, 'php/makeCustomLayer.php', self.fillSource, sessionAndMap + '&todo=filling');

        }
      }

      this.getForm = function () {
        return form;
      }

      this.setFormEls = function(whichSource){
        if(whichSource == 'existingLayers'){
          form.removeChild(document.getElementById('featureSourceOpt'));
        }else{
          form.removeChild(document.getElementById('existingLayerOpt'));
        }
        
        return form.elements;        
      }

      this.getFormEls = function () {
        return formEls;
      }
//(xmlhttp, queryRequestScriptPHP, queryResultsFunctionJS, AJAXRequestString) 
      this.getProps = function(){
        var layerName = formEls.namedItem('existinglayers').value;
        makeAjaxRequest(xmlhttp, 'php/makeCustomLayer.php', self.fillProps, sessionAndMap + '&todo=getProps&layerName=' + layerName);
      }

      this.fillProps = function(){
         if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
          var resultResponse = xmlhttp.responseText.parseJSON();
            if(resultResponse.success != 'true'){
              
            }else{

              var props = resultResponse.response.props;
               //create array to hold the option values for the fileds drop down menu
              var optionsArray = []; 

              //fill the options array for the fields
              for(var i = 0; i < props.length; i++) {
                  optionsArray[i] = [props[i], props[i], false, false];
              }

              //fill the feature source drop down menu 
              makeOptions(formEls.namedItem('layerattributes'), optionsArray);

            }
          
         }else if(xmlhttp.readyState == 4 && xmlhttp.status != 200) {
          //couldn't contact the server
          alert('There has been an error in the request to the server. If problem persists contact the site administrator.');
        }
      }

      //fill the feature source drop down menu
      this.fillSource = function () {
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {

          var resultResponse = xmlhttp.responseText.parseJSON();

          if(resultResponse.success != 'true') {
            //couln't retrieve the feature sources
            message.create('ERROR', 'The data could not be retrieved.');

          } else {
            //got the feature sources!
            featureSources = resultResponse.response.featureSources;

            //create array to hold the option values for the feature source drop down menu
            var optionsArray = [
              ['', 'Choose...', true, true]   //the first option in all the drop down menus: [value, innerHTML, selected, disabled]
            ]; 
            var counter = 1;                  //counts number of feature sources

            //fill the options array for each feature source
            for(var item in featureSources) {
              if(featureSources.hasOwnProperty(item)) {
                optionsArray[counter] = [item, item, false, false];
                counter += 1;
              }
            }

            //fill the feature source drop down menu 
            makeOptions(formEls.namedItem('featuresource'), optionsArray);

            //fill the feature class drop down menu
            self.fillClass();
          }

        } else if(xmlhttp.readyState == 4 && xmlhttp.status != 200) {
          //couldn't contact the server
          alert('There has been an error in the request to the server. If problem persists contact the site administrator.');
        }
      }

      //fill the feature class drop down menu
      this.fillClass = function () {
        var currentClasses = featureSources[formEls.namedItem('featuresource').value];    //array of classes for the selected feature source
        var optionsArray = [
          ['', 'Choose...', true, true]   //the first option in all the drop down menus: [value, innerHTML, selected, disabled]
        ]; 
        var counter = 1;                  //counts number of feature classes

        //modifies feature source background color back to white if a value is selected. It is red otherwise, indicating a validation error.
        if(formEls.namedItem('featuresource').value != '') {
          formEls.namedItem('featuresource').style.backgroundColor = '';
        }

        //no feature source currently selected so create empty feature class drop down menu
        if(currentClasses === undefined) {
          makeOptions(formEls.namedItem('featureclass'), optionsArray);
          return;
        };

        //fill the options array for the feature class
        for(var i = 0; i < currentClasses.length; i++) {
          var shortClassName = currentClasses[i][1];
          shortClassName = shortClassName.substr(shortClassName.indexOf('~') + 1);
          shortClassName = shortClassName.substr(0, shortClassName.indexOf('~'));
          optionsArray[counter] = [currentClasses[i], shortClassName, false, false];
          counter += 1;
        }

        //fill the feature class drop down menu
        makeOptions(formEls.namedItem('featureclass'), optionsArray);
      }

      //dynamically create input elements depending on type of rule selected: area, line, or point
      this.createRuleOptions = function (origin) {
        origin = typeof origin === 'undefined' ? 'any' : origin; //origin of createRuleOptions launch. 
        //Possible value: ruleNumInput, launched from change in rules NUMBER. Forces rules NUM validation check.
        //Any other value indicates launch from change in rules TYPE. rules NUMBER is validated if it's not blank.

        var numRules = parseInt(formEls.namedItem('numfilterrules').value, 10);

        //force selection of rule type before creating the subform
        if(formEls.namedItem('ruletype').value == '') {
          formEls.namedItem('numfilterrules').value = '';
          alert('Please select a rule type first.');
          return;
        }

        //validate the input value
        if(origin == 'ruleNumInput' || (origin != 'ruleNumInput' && !isNaN(numRules))) {
          var isValid = self.validate(formEls.namedItem('numfilterrules'));
          if(isValid.stat === false) {
            return;
          }
        } 

        var rulesDiv = document.getElementById('rulesBox');

        //remove previous rule subforms
        while(rulesDiv.hasChildNodes()) {
          rulesDiv.removeChild(rulesDiv.lastChild);
        }

        //create the rules subform
        var newDiv;
        var rulesDivInnerHTML;
        var docFrag;
        var attributeValuesList = {};
        for(var i = 0; i < numRules; i++) {
          newDiv = document.createElement('div'); //div container created for each rule
          newDiv.className = 'ruleSet';
          docFrag  = document.createDocumentFragment();
          docFrag.appendChild(makeEl('div', {'innerHTML': 'Rule ' + (i + 1)}))
          rulesDivInnerHTML = '<div>Rule ' + (i + 1) + ' </div><br>';
          

          //create a legend label input element if more than one rule requested
          if(numRules > 1) {
            rulesDivInnerHTML += '<label for="legendlabel' + i + '">Legend Label</label><input title="Acceptable values: a-zA-Z0-9_$%.-[] spaces" id="legendlabel' + i + '" type="text" name="legendlabel' + i + '"><br>';
            
            //create label
            attributeValuesList = {
              'for': 'legendlabel' + i,
              'innerHTML': 'Legend Label'
            };

          } else {
            rulesDivInnerHTML += '<input type="hidden" id="legendlabel' + i + '" name="legendlabel' + i + '" value="' + document.getElementsByName('layername')[0].value + ' "">';
          }

          //create filter input
          rulesDivInnerHTML += '<label for="rulefilter' + i + '">Rule Filter</label><input placeholder="Case Sensitive!!!" onchange="customLayersNS.mainForm.validate(this)" title="Acceptable operators: \',<,<=,>,>=,=,LIKE,AND,OR,%,_" type="text" id="rulefilter' + i + '" name="rulefilter' + i + '"><br>'; 

          //create the input elements!
          if(formEls.namedItem('ruletype').value == 'area') {
            //create inputs for area rules
            rulesDivInnerHTML += '<label for="foregroundcolor' + i + '">Foreground Color</label>' + createColorPicker(i, 'foregroundcolor') + '<br>';

          } else if(formEls.namedItem('ruletype').value == 'line') {
            //create inputs for line rules
            rulesDivInnerHTML += '<label for="lcolor' + i + '">Line Color</label>' + createColorPicker(i, 'linecolor') + '<br>';
            rulesDivInnerHTML += '<label for="lthickness' + i + '">Line Thickness</label><input id="lthickness' + i + '" name="lthickness' + i + '" type="text" title="Acceptable values: 1-3" placeholder="[1-3]" onchange="customLayersNS.mainForm.validate(this)"><br>';

          } else {
            //create inputs for point rules
            var markSymbol = '';
            var textSymbol = '';

            /* text properties dont seem to show up on layer
            textSymbol += '<label for="marktext' + i + '">Text</label><input id="marktext' + i + '" type="text" name="marktext' + i + '" onchange="customLayersNS.mainForm.validate(this)"><br>';
            textSymbol += '<label for="fontheight' + i + '">Font Height</label><input  class="shortInput" id="fontheight' + i + '" type="text" name="fontheight' + i + '" onchange="customLayersNS.mainForm.validate(this)">';
            textSymbol += '<label for="textcolor' + i + '">Text Color</label>' + createColorPicker(i, 'textcolor') + '<br>';
            */

            markSymbol += '<label for="markcolor' + i + '">Mark Color</label>' + createColorPicker(i, 'markcolor') + '<br>';
            markSymbol += '<label for="markwidth' + i + '">Width</label><input class="shortInput" id="markwidth' + i + '" type="text" name="markwidth' + i + '" onchange="customLayersNS.mainForm.validate(this)">';
            markSymbol += '<label for="markheight' + i + '">Height</label><input class="shortInput" id="markheight' + i + '" type="text" name="markheight' + i + '" onchange="customLayersNS.mainForm.validate(this)">';


            //rulesDivInnerHTML += textSymbol;
            rulesDivInnerHTML += '<label for="markname' + i + '">Symbol</label>' + createMarkPicker(i, 'markname') + '<br>';

            rulesDivInnerHTML += markSymbol;

          }

          //attach the subform to the document
          newDiv.innerHTML = rulesDivInnerHTML;
          rulesDiv.appendChild(newDiv);
        }

        if(origin == 'ruleNumInput') {
          collapsibleBoxSwitch(document.getElementById('rulesArrow'), 'Show');
        }
      }

      this.validate = function (element) {
        var inputName = element.name;
        element.value = element.value.replace(/^\s+|\s+$/g, '');
        var inputValue = element.value;
        var isValid = {};
        isValid.stat = false;
        isValid.msg = '';

        var regX;
        var match;

        if(inputName == 'layername') {
          regX = /^\w+$/;
          match = regX.test(inputValue);
          if(match) {
            isValid.stat = true;
          } else {
            isValid.msg = "Only the following characters are allowed: a-zA-Z0-9_";
          }
        } else if(inputName == 'numfilterrules' || inputName.indexOf("lthickness") != -1) {
          regX = /^[1-3]{1}$/;
          match = regX.test(inputValue);
          if(match) {
            isValid.stat = true;
          } else {
            isValid.msg = "Only the following range of numbers are allowed: [1-3]";
          }
        } else if(inputName.indexOf('fontheight') != -1 || inputName.indexOf('markwidth') != -1 || inputName.indexOf('markheight') != -1) {
          regX = /^[0-9]{1,2}$/;
          match = regX.test(inputValue);
          inputValue = parseInt(inputValue, 10)
          if(match && inputValue <= 64 && inputValue >= 1) {
            isValid.stat = true;
          } else {
            isValid.msg = "Only values from 1 to 64 are allowed.";
          }
        } else if(inputName.indexOf("legendlabel") != -1 || inputName.indexOf("marktext") != -1) {
          regX = /[\w><$\[\]\-%]/;
          match = regX.test(inputValue);
          if(match) {
            isValid.stat = true;
          } else {
            isValid.msg = "Only the following characters are allowed: a-zA-Z0-9_$%.-[] spaces. Can not be empty string.";
          }

        } else if(inputName == 'featuresource' || inputName == 'featureclass' || inputName == 'ruletype' || inputName.indexOf('markname') != -1) {
          if(inputValue != '') {
            isValid.stat = true;
          } else {
            isValid.msg = "You must choose an option!";
          }

        } else if(inputName.indexOf("rulefilter") != -1) {
          regX = /^\s*$/;
          match = regX.test(inputValue);
          //change double quoutes to single quotes for valid filter
          element.value = element.value.replace(/"/g, '\'');
          if(match) {
            isValid.msg = "Can not be blank.";
          } else {
            isValid.stat = true;
          }

        } else if(inputName.indexOf('color') != -1 || element.type == 'button' || element.type == 'reset') {

          isValid.stat = true;
        }

        //invalid value! change background color of input element and display message
        if(isValid.stat === false) {
          element.style.backgroundColor = '#E9967A';
          alert(isValid.msg);
        } else {
          element.style.backgroundColor = '';
        }

        return isValid;
      }

    }

    var createColorPicker = function (whichRuleNum, name) {
      var colors = ["FFFFFF", "C0C0C0", "808080", "000000", "FF0000", "FFFF00", "00FF00", "00FFFF", "0000FF", "FF00FF", "800000", "808000", "008000", "008080", "000080", "800080", "500000", "700000", "900000", "C00000", "E00000", "FF0000", "FF2020", "FF4040", "FF5050", "FF6060", "FF8080", "FF9090", "FFA0A0", "FFB0B0", "FFD0D0", "501400", "701C00", "902400", "A02800", "C03000", "E03800", "FF4000", "FF5820", "FF7040", "FF7C50", "FF9470", "FFA080", "FFB8A0", "FFC4B0", "FFDCD0", "502800", "603000", "804000", "A05000", "B05800", "D06800", "E07000", "FF8000", "FF9830", "FFA850", "FFB060", "FFC080", "FFD0A0", "FFD8B0", "FFE8D0", "503C00", "604800", "806000", "906C00", "A07800", "C09000", "D09C00", "F0B400", "FFC000", "FFD040", "FFD860", "FFDC70", "FFE490", "FFECB0", "FFF4D0", "505000", "606000", "707000", "909000", "A0A000", "B0B000", "C0C000", "F4F400", "F0F000", "FFFF00", "FFFF40", "FFFF70", "FFFF90", "FFFFB0", "FFFFD0", "305000", "3A6000", "4D8000", "569000", "60A000", "73C000", "7DD000", "90F000", "9AFF00", "B3FF40", "C0FF60", "CDFF80", "D3FF90", "E0FFB0", "EDFFD0", "005000", "006000", "008000", "00A000", "00B000", "00D000", "00E000", "00FF00", "50FF50", "60FF60", "70FF70", "90FF90", "A0FFA0", "B0FFB0", "D0FFD0", "005028", "006030", "008040", "00A050", "00B058", "00D068", "00F470", "00FF80", "50FFA8", "60FFB0", "70FFB8", "90FFC8", "A0FFD0", "B0FFD8", "D0FFE8", "005050", "006060", "008080", "009090", "00A0A0", "00C0C0", "00D0D0", "00F0F0", "00FFFF", "50FFFF", "70FFFF", "80FFFF", "A0FFFF", "B0FFFF", "D0FFFF", "003550", "004B70", "006090", "006BA0", "0080C0", "0095E0", "00ABFF", "40C0FF", "50C5FF", "60CBFF", "80D5FF", "90DBFF", "A0E0FF", "B0E5FF", "D0F0FF", "001B50", "002570", "001C90", "0040C0", "004BE0", "0055FF", "3075FF", "4080FF", "508BFF", "70A0FF", "80ABFF", "90B5FF", "A0C0FF", "C0D5FF", "D0E0FF", "000050", "000080", "0000A0", "0000D0", "0000FF", "2020FF", "1C1CFF", "5050FF", "6060FF", "7070FF", "8080FF", "9090FF", "A0A0FF", "C0C0FF", "D0D0FF", "280050", "380070", "480090", "6000C0", "7000E0", "8000FF", "9020FF", "A040FF", "A850FF", "B060FF", "C080FF", "C890FF", "D0A0FF", "D8B0FF", "E8D0FF", "500050", "700070", "900090", "A000A0", "C000C0", "E000E0", "FF00FF", "FF20FF", "FF40FF", "FF50FF", "FF70FF", "FF80FF", "FFA0FF", "FFB0FF", "FFD0FF", "500028", "700060", "900048", "C00060", "E00070", "FF008A", "FF2090", "FF40A0", "FF50A8", "FF60B0", "FF80C0", "FF90C8", "FFA0D0", "FFB0D8", "FFD0E8", "000000", "101010", "202020", "303030", "404040", "505050", "606060", "707070", "909090", "A0A0A0", "B0B0B0", "C0C0C0", "D0D0D0", "E0E0E0", "F0F0F0"];
      var selectInnerHTML = '<select id="' + name + whichRuleNum + '" name="' + name + whichRuleNum + '" onckeyup="this.style.backgroundColor = \'#\' + this.value;" onchange="this.style.backgroundColor = \'#\' + this.value;">';
      selectInnerHTML += '<option selected disabled value="">Choose...</option>';
      for(var i = 1; i < colors.length; i++) {
          selectInnerHTML += '<option value="' + colors[i-1] + '" style="background-color:#' + colors[i-1] + ';"></option>';
      }

      selectInnerHTML += '</select>';

      return selectInnerHTML;
    }

    var createMarkPicker = function (whichRuleNum, name) {
      // var symbols = ['Square', 'Circle', 'Triangle', 'Star', 'Cross', 'X-Mark'];
      var symbols = ['PushPin'];
      var selectInnerHTML = '<select id="' + name + whichRuleNum + '" name="' + name + whichRuleNum + '">';
      selectInnerHTML += '<option selected disabled value="">Choose...</option>';
      for(var i = 0; i < symbols.length; i++) {
        selectInnerHTML += '<option value="' + symbols[i] + '">' + symbols[i] + '</option>';
      }

      selectInnerHTML += '</select>';

      return selectInnerHTML;
    }

    return cls;

  })();


  /*** LAYERS FUNCTIONALITY ***/
  var Layers = (function () {

    var layerObjects = {}; //holds details for each successfully created layer

    //constructor
    function cls() {

      this.setLayerObjects = function (layerObs) {
        layerObjects = layerObs;
      }

      this.getLayerObjects = function () {
        return layerObjects;
      }

      //make request to create a layer
      this.make = function (form) {
        var parameters = {}; //layer creation parameters to be sent to server
        var isValid;

        //validate each form value one last time
        for(var i = 0; i < form.getFormEls().length; i++) {
          isValid = form.validate(form.getFormEls()[i]);
          
          if(isValid.stat) {
            parameters[form.getFormEls()[i].name] = form.getFormEls()[i].value;
          } else {
            return;
          }
        }

        //check if layer name is already used
        for(var layer in layerObjects) {
          if(layerObjects.hasOwnProperty(layer)) {
            if(form.getFormEls().namedItem('layername').value == layerObjects[layer].name) {
              alert("There is already a layer with that name. Change the layer name.");
              return;
            }
          }
        }

        //make the request to the server
        makeAjaxRequest(xmlhttp, 'php/makeCustomLayer.php', function () {
          return makeLayerResponseHandler(form)
        }, sessionAndMap + '&todo=makeLayer&parameters=' + parameters.toJSONString());

      }

      //delete a layer
      this.del = function (boolVal, thisEl) {
        if(boolVal) {
          var listElement = thisEl.getAttribute('data-eldel');
          var layerToDeleteName = listElement.substr(listElement.indexOf("_") + 1);
          var requestString = sessionAndMap + '&todo=removeLayers&layerName=' + layerToDeleteName;
          makeAjaxRequest(xmlhttp, 'php/makeCustomLayer.php', deleteLayerResponseHandler, requestString)
        }
        document.getElementById('deleteLayerPopUp').className = 'Hide';
      }

      //change how the rule parameters for each layer are presented
      this.changeRuleStyle = function (element) {
        var styleSpan = element.parentNode.getElementsByTagName('span');
        for(var i = 0; i < 3; i++) {
          styleSpan[i].className = '';
        }

        element.className = 'currentRuleChoice';
        var layerName = element.getAttribute('data-ln');
        var ruleType = element.getAttribute('data-rs');
        var rulesHolder = document.getElementById(layerName + 'RuleHolder');

        var layerBox = document.getElementById(layerName + 'Box');
        var newRulesHolder = createRulesPresentation(layerName, ruleType);

        layerBox.replaceChild(newRulesHolder, layerBox.lastChild);
      }

      //dynamically create HTML for layer details. Used when there are previous layers saved in session storage
      this.createCustomLayerDetail = function (layerName, ruleStyle) {
        createCustomLayerDetail(layerName, ruleStyle);
      }
    }

    var makeLayerResponseHandler = function (form) {
      if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        var resultResponse = xmlhttp.responseText.parseJSON();

        if(resultResponse.success != 'true') {
          //the layer could not be created!
          message.create('ERROR', resultResponse.response.message);
        } else {
          var layerName = resultResponse.response.layerName;
          var messageString = resultResponse.response.message;

          //save the layer details to the layer objects array
          layerObjects[layerName] = createLayerObject(form.getFormEls());

          //update the sessionStorage copy of the layer objects array
          window.sessionStorage.setItem('layerObs', layerObjects.toJSONString());

          //create the details box for the layer
          createCustomLayerDetail(layerName);

          //create the message for the layer
          message.create('SUCCESS', 'The layer <span class="layerNameHighlight">' + layerName + '</span> was successfully created. ' + messageString);

          //display the details box for the layer
          collapsibleBoxSwitch(document.getElementById('customLayersArrow'), 'Show');

          //Hide the rules box for the form
          collapsibleBoxSwitch(document.getElementById('rulesArrow'), 'collapsed');

          form.getForm().reset();
          getMapFrame().Refresh();
          getLegend().Refresh();
        }

        //display the message box for the layer
        collapsibleBoxSwitch(document.getElementById('messagesArrow'), 'Show');

      } else if(xmlhttp.readyState == 4 && xmlhttp.status != 200) {
        //couldn't contact the server
        alert('There has been an error in the request to the server. If problem persists contact the site administrator.');
      }
    }

    //each layer has an object with details of the parameters used to create it
    var createLayerObject = function (formEls) {
      var layerObject = {};
      var name = formEls.namedItem('layername').value;
      var source = formEls.namedItem('featuresource').value;

      var selectedIndex = formEls.namedItem('featureclass').selectedIndex;
      var lclass = formEls.namedItem('featureclass').options[selectedIndex].innerHTML;
      var ruleType = formEls.namedItem('ruletype').value;
      var numRules = formEls.namedItem("numfilterrules").value;
      var properties = [];
      var rulesNumProps;    //number of properties per rule. depends on rule type. Modified by Rules()
      var totalNumProps;    //total number of properties in form. Depends on ruleNumProps. Modified by Rules()


      layerObject.name = name;
      layerObject.source = source;
      layerObject.lclass = lclass;
      layerObject.rules = Rules(properties, ruleType, numRules, rulesNumProps, totalNumProps);
      layerObject.ruleType = ruleType;
      layerObject.numRules = numRules;
      layerObject.rulesNumProps = rulesNumProps;
      layerObject.totalNumProps = totalNumProps;
      return layerObject;

    }

    //return the values for the rules parameters based on rule type for each rule
    //modifies properties array
    var Rules = function (properties, ruleType, numRules, rulesNumProps, totalNumProps) {
      var ruleObjects = [];

      if(ruleType == 'area') {
        properties = ['foregroundcolor'];
      } else if(ruleType == 'line') {
        properties = ['linecolor', 'lthickness'];
      } else {
        //properties = ['marktext', 'fontheight', 'textcolor', 'markname', 'markcolor', 'markwidth', 'markheight'];
        properties = ['markname', 'markcolor', 'markwidth', 'markheight'];
      }
      
      //create an array of property/values for each rule
      var legend;
      var filter;
      for(var i = 0; i < numRules; i++) {

        legend = document.getElementById('legendlabel' + i).value;
        filter = document.getElementById('rulefilter' + i).value;
        ruleObjects[i] = {
          'legend': legend,
          'filter': filter
        };

        for(var j = 0; j < properties.length; j++) {
          ruleObjects[i][properties[j]] = document.getElementById(properties[j] + i).value
        }
      }

      rulesNumProps = properties.length + 2;    //properties.length depends on rule type + filter + legend label
      totalNumProps = rulesNumProps + 5;        //rulesNumProps + layer name + feature source + feature class + rule type + number of rules
      return ruleObjects
    }

    //dynamically create HTML for layer details
    var createCustomLayerDetail = function (layerName, ruleStyle) {
      ruleStyle = typeof (ruleStyle) == 'undefined' ? 'list' : ruleStyle; //possible values: list, ruleCols (each rule is a column), ruleRows (each rule is a row)

      //outer box for layer details. Contains layer name and buttons for deleting layer and hiding the layer deatils
      var newCustomLayer = document.createElement('li');
      newCustomLayer.id = "customLayer_" + layerName;
      newCustomLayer.innerHTML = '<span class="subSect">' + layerName + '</span><span title="Remove layer from map" class="deleteLayerX" onclick="customLayersNS.deleteLayerPopUp(this)"></span><p id="' + layerName + 'Arrow"  class="arrow" onclick="customLayersNS.collapsibleBoxSwitch(this)"><span>▲</span></p>';

      //inner box for for layer deatils. 
      var cBox = document.createElement('div');
      cBox.id = layerName + 'Box';
      cBox.className = 'collapsibleBox';

      //list of layer details: Source, Class, Type, # Rules
      var u = document.createElement('ul');
      u.innerHTML = '<li>Source: ' + layerObjects[layerName].source + '</li>';
      u.innerHTML += '<li>Class: ' + layerObjects[layerName].lclass;
      u.innerHTML += '<li>Type: ' + layerObjects[layerName].ruleType + '</li>';
      u.innerHTML += '<li># Rules: ' + layerObjects[layerName].numRules + '<span class="ruleChoices"><span data-ln="' + layerName + '" data-rs="list" class="currentRuleChoice" onclick="customLayersNS.layers.changeRuleStyle(this)"> List </span><span data-ln="' + layerName + '" data-rs="ruleCols" onclick="customLayersNS.layers.changeRuleStyle(this)"> RuleCols </span><span data-ln="' + layerName + '" data-rs="ruleRows" onclick="customLayersNS.layers.changeRuleStyle(this)">RuleRows</span></span></li>';
      cBox.appendChild(u);

      //create the rules details based on list or table layout
      var presentationElement = createRulesPresentation(layerName, ruleStyle);
      cBox.appendChild(presentationElement);
      newCustomLayer.appendChild(cBox);

      //attach the details to the DOM
      if(document.getElementById("customLayersList").hasChildNodes()) {
        document.getElementById("customLayersList").insertBefore(newCustomLayer, document.getElementById("customLayersList").firstChild);
      } else {
        document.getElementById("customLayersList").appendChild(newCustomLayer);
      }
    }

    //create table or list for the rules details 
    var createRulesPresentation = function (layerName, ruleType) {
      var colVal = '';
      var d = document.createElement('div');
      d.id = layerName + 'RuleHolder';

      if(ruleType == 'ruleRows' || ruleType == 'ruleCols') {
        var table = document.createElement('table');
        var row = document.createElement('tr');
        var col = document.createElement('td');
        var hcol = document.createElement('th');
        var header = row.cloneNode();
        var headerInnerHTML = '';


        if(ruleType == 'ruleRows') {
          //each rule is a row!
          //create the header row
          var newHeaderCol = hcol.cloneNode();    //create column for rule 
          newHeaderCol.innerHTML = 'Rule';
          header.appendChild(newHeaderCol);       //append Rule column to header row

          //create a column for each property name
          for(var ruleProp in layerObjects[layerName].rules[0]) {
            if(layerObjects[layerName].rules[0].hasOwnProperty(ruleProp)) {
              var newCol = col.cloneNode();
              newCol.innerHTML = ruleProp;
              header.appendChild(newCol);         //append the property name column to the header row
            }
          }
          table.appendChild(header);              //append the header row  to the table


          //create a row for each rule
          for(var i = 0; i < layerObjects[layerName].numRules; i++) {
            var newRow = row.cloneNode();
            var newCol = col.cloneNode();         //column with rule number 
            newCol.innerHTML = (i + 1);  
            newRow.appendChild(newCol);           //append the rule number column to the row

            //create a column for each property value. append each column to the row for the current rule
            for(var ruleProp in layerObjects[layerName].rules[i]) {
              var newCol = col.cloneNode();

              if(layerObjects[layerName].rules[i].hasOwnProperty(ruleProp)) {
                if(ruleProp.indexOf('color') == -1) {
                  newCol.innerHTML = layerObjects[layerName].rules[i][ruleProp];
                } else {
                  //if its a color property, change the style color
                  newCol.innerHTML = '<span style="color:#' + layerObjects[layerName].rules[i][ruleProp] + '">' + layerObjects[layerName].rules[i][ruleProp] + '</span>';
                }

                newRow.appendChild(newCol);       //append the property value column to the row for the current rule
              }
            }


            //append the row for the current rule to the table
            table.appendChild(newRow);
          }

          //append the table to the div
          d.appendChild(table);

        } else if(ruleType == 'ruleCols') {
          //each rule is a column
          //create the header
          header.appendChild(hcol.cloneNode());

          //create a column for each rule number and append to the header row
          for(var i = 0; i < layerObjects[layerName].numRules; i++) {
            var newHeaderCol = hcol.cloneNode();
            newHeaderCol.innerHTML = 'Rule ' + (i + 1);
            header.appendChild(newHeaderCol);
          }
          table.appendChild(header);

          //create array with the property names 
          var propertyNamesCol = {};

          for(var ruleProp in layerObjects[layerName].rules[0]) {
            if(layerObjects[layerName].rules[0].hasOwnProperty(ruleProp)) {
              propertyNamesCol[ruleProp] = '';
            }
          }

          //create a row for each property, whith a column for each rule
          for(var ruleProp in propertyNamesCol) {                                 //loop thorugh property names
            if(propertyNamesCol.hasOwnProperty(ruleProp)) {
              var newRow = row.cloneNode();                                       //create row for current property
              var newCol = col.cloneNode();                                       //create column for the property name
              newCol.innerHTML = ruleProp;                                        //first column for the row is the property name
              newRow.appendChild(newCol);                             
              for(var i = 0; i < layerObjects[layerName].numRules; i++) {         //loop through each rule
                var newCol = col.cloneNode();                                     //create a column for the current property value for the current rule  
 
                //set column to the value of the current property for the current rule
                if(ruleProp.indexOf('color') == -1) {                             
                  newCol.innerHTML = layerObjects[layerName].rules[i][ruleProp];
                } else {
                  //if its a color property, change the font color!
                  newCol.innerHTML = '<span style="color:#' + layerObjects[layerName].rules[i][ruleProp] + '">' + layerObjects[layerName].rules[i][ruleProp] + '</span>';
                }

                //append the column for the current property value for the current rule to the current row for the current property (WHAT THE HELL?!?!?)
                newRow.appendChild(newCol)  
              }

              //append the current row for the current property to the table
              table.appendChild(newRow);
            }
          }
          d.appendChild(table);
        }

      } else {
        //create a simple list

        var u = document.createElement('ul');

        for(var i = 0; i < layerObjects[layerName].numRules; i++) {
           //create a list element for each rule property
          for(var ruleProp in layerObjects[layerName].rules[i]) {
            if(layerObjects[layerName].rules[i].hasOwnProperty(ruleProp)) {
              if(ruleProp.indexOf('color') == -1) {
                colVal = layerObjects[layerName].rules[i][ruleProp]
              } else {
                //change font color for color property
                colVal = '<span style="color:#' + layerObjects[layerName].rules[i][ruleProp] + '">' + layerObjects[layerName].rules[i][ruleProp] + '</span>'
              }

              u.innerHTML += '<li>R' + (i + 1) + '-' + ruleProp + ': ' + colVal + '</li>';
            }
          }
        }
        d.appendChild(u);
      }

      return d;

    }

    var deleteLayerResponseHandler = function () {
      if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        var resultResponse = xmlhttp.responseText.parseJSON()
        var layerNameRemoved = resultResponse.response.layerName;
        if(resultResponse.success != 'true') {
          //couldn't delete the layer!
          message.create('ERROR', resultResponse.response.message);
        } else {
          //layer deleted!
          getMapFrame().Refresh();
          getLegend().Refresh();

          message.create('SUCCES', 'Layer <span class="layerNameHighlight">' + layerNameRemoved + '</span> successfully removed.');
          document.getElementById('customLayersList').removeChild(document.getElementById('customLayer_' + layerNameRemoved));
          delete layerObjects[layerNameRemoved];
          window.sessionStorage.setItem('layerObs', layerObjects.toJSONString());
        }

        //display the message box for the layer
        collapsibleBoxSwitch(document.getElementById('messagesArrow'), 'Show');

      } else if(xmlhttp.readyState == 4 && xmlhttp.status != 200) {
        //couldn't contact the server!
        alert('There has been an error in the request to the server. If problem persists contact the site administrator.');
      }
    }

    return cls;

  })();

  /*** MESSAGES FUNCTIONALITY ***/
  var message = {
    create: function (successType, message) {
      var newListItem = document.createElement('li');
      var randId = Math.floor(Math.random() * 100 + 1);
      newListItem.id = "messages_" + randId;
      newListItem.innerHTML = '<span class="subSect">' + successType + '</span><span title="Remove message from list." class="deleteLayerX" onclick="customLayersNS.msgDel(this.parentNode.id)"></span><p id="message' + randId + 'Arrow"  class="arrow" onclick="customLayersNS.collapsibleBoxSwitch(this)"><span>▲</span></p>';

      var cBox = document.createElement('div');
      cBox.id = randId + 'Box';
      cBox.className = 'collapsibleBox';
      cBox.innerHTML = '<span>' + message + '</span>';

      newListItem.appendChild(cBox);

      if(document.getElementById('messagesList').hasChildNodes()) {
        document.getElementById('messagesList').insertBefore(newListItem, document.getElementById('messagesList').firstChild);
      } else {
        document.getElementById('messagesList').appendChild(newListItem);
      }
    },

    del: function (elId) {
      document.getElementById('messagesList').removeChild(document.getElementById(elId));
      if(document.getElementById('messagesList').hasChildNodes() !== true) {
        collapsibleBoxSwitch(document.getElementById('messagesArrow'), 'collapsed');
      }
    }
  }


  //display option to delete layer
  var deleteLayerPopUp = function (element) {

    var ypos = element.parentNode.parentNode.offsetTop + element.parentNode.offsetTop + 20;

    document.getElementById('layerNameDelete').innerHTML = ' ' + element.parentNode.id.substr(element.parentNode.id.indexOf('_') + 1);
    document.getElementById('deleteLayerPopUp').style.top = ypos + 'px';
    document.getElementById('deleteLayerPopUp').className = 'popUpShow';
    document.getElementById("yesConfirm").setAttribute('data-eldel', element.parentNode.id);
    document.getElementById("noConfirm").setAttribute('data-eldel', element.parentNode.id);
  }


  //show or hide collapsible boxes
    function collapsibleBoxSwitch(element, type) {
      type = typeof type == 'undefined' ? 'auto' : type;

      if(type == 'auto') {
        if(element.className != 'arrow collapsed') {
          element.className = 'arrow collapsed';
        } else {
          element.className = 'arrow';
        }
      } else if(type == 'collapsed') {
        element.className = 'arrow collapsed';
      } else if(type == 'Show') {
        element.className = 'arrow';
      }
    }



  //instantiate a form object
  var mainForm = new Form();

  //instantiate a layers object
  var layers = new Layers();


  return {
    ss_sessionId: ss_sessionId,
    ss_LayerObjects: ss_LayerObjects, 
    layerSource: layerSource,
    mainForm: mainForm,
    layers: layers,
    msgDel: message.del,
    deleteLayerPopUp: deleteLayerPopUp,
    collapsibleBoxSwitch: collapsibleBoxSwitch,
    debug: false
  }
})();