<!DOCTYPE html>
<!-- 
    File:               makeCustomLayerIndex.php
    Author:             Karol Sanchez
    Info:               Index file for the creating custom layer functionality.  
                        Allows creation of layers from *scratch* from feature sources.  
                        Functionality to create new layers from *existing *layers not complete.
-->
<?php 
  $args = ($_SERVER['SESSION'] == "POST") ? $_POST : $_GET;
  $sessionId = $args['SESSION'];
  $mapName = $args['MAPNAME'];
  $layerSource = $args['SOURCE'];
?>
<html>
  <head>
        <!--[if IE 8]>     <meta http-equiv="X-UA-Compatible" content="IE=8" > <![endif]-->
        <!--[if IE 9]>     <meta http-equiv="X-UA-Compatible" content="IE=9" > <![endif]-->
        <!--[if gt IE 9]>  <meta http-equiv="X-UA-Compatible" content="IE=edge"> <!--<![endif]-->
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <script src="../../common/commonJS.js?<?php echo rand(); ?>" type="text/javascript"></script>
    <script src="javascript/makeCustomLayer.js?<?php echo rand(); ?>" type="text/javascript"></script>
    <script src="../common/json.js" type="text/javascript"></script>
    <script src="../common/e7_mg_lib.js" type="text/javascript"></script>
    <script src="../common/pageLoadFunctions.js" type="text/javascript"></script>
    <link rel="stylesheet" href="css/makeCustomLayer.css?<?php echo rand(); ?>"/>      
        <!--[if lt IE 10]>  <html class = "IEisLame"> <!--<![endif]-->
       
<script>
/* 
  customLayersNS
    ss_sessionId                :sessionStorage, holds string copy of sessionId
    ss_LayerObjects             :sessionStorage, holds string copy of layer objects
    msgDel                      :function, deletes a message
    deleteLayerPopUp            :function, displays option to delete a layer
    collapsibleBoxSwitch        :function, shows or hides collapsible boxes
    mainForm                    :object, controls form functionality 
    layers                      :object, controls layers functionality  
*/

"use strict";

window.onload = function () {
  customLayersNS.layerSource = "<?=$layerSource?>";

  if (customLayersNS.layerSource == 'existingLayers'){
    document.getElementById('featureSourceOpt').className = 'Hide';
    document.getElementById('existingLayerOpt').className = '';
    customLayersNS.mainForm.setForm('mainForm', "<?=$layerSource?>" , 'sessionId=' + '<?=$sessionId?>' + '&mapName=' + '<?=$mapName?>', getLegend().GetLayers(false,false));
  }else{
    document.getElementById('existingLayerOpt').className = 'Hide';
    document.getElementById('featureSourceOpt').className = '';
    customLayersNS.mainForm.setForm('mainForm', "<?=$layerSource?>" , 'sessionId=' + '<?=$sessionId?>' + '&mapName=' + '<?=$mapName?>');
  }
  

  //prefill the form for debugging purposes
  if(customLayersNS.debug === true){
    customLayersNS.mainForm.getFormEls().namedItem('layername').value = 'testing' + Math.floor(Math.random() * 100) + 1;
    customLayersNS.mainForm.getFormEls().namedItem('ruletype').selectedIndex = 1;
    customLayersNS.mainForm.getFormEls().namedItem('numfilterrules').value = 1;
    customLayersNS.mainForm.createRuleOptions('ruleNumInput');
    document.getElementById('rulefilter0').value = 'FEATID = 305';
    document.getElementById('foregroundcolor0').value = '#FFFF00';

    window.setTimeout(function(){
      customLayersNS.mainForm.getFormEls().namedItem('featuresource').selectedIndex = 1;
      customLayersNS.mainForm.getFormEls().namedItem('featuresource').value =  customLayersNS.mainForm.getFormEls().namedItem('featuresource').options[1].value;
      customLayersNS.mainForm.fillClass()
      customLayersNS.mainForm.getFormEls().namedItem('featureclass').selectedIndex = 3;
      customLayersNS.mainForm.getFormEls().namedItem('featureclass').value = customLayersNS.mainForm.getFormEls().namedItem('featureclass').options[3].value;
    }, 500)
  }

  //load previously created layers' details if still within the same mapguide session
  if(customLayersNS.ss_sessionId === null) {
    window.sessionStorage.setItem('sessId', '<?=$sessionId?>');
    customLayersNS.ss_sessionId = window.sessionStorage.getItem('sessId');
  } else {

    if(customLayersNS.ss_sessionId == '<?=$sessionId?>') {
      //session storage sessionid  and current mapguide session id are the same.  the browser has not been closed, the mapviewer has not been refreshed.
      if(customLayersNS.ss_LayerObjects !== null) {
        customLayersNS.layers.setLayerObjects(customLayersNS.ss_LayerObjects.parseJSON());
        for(var layerName in customLayersNS.layers.getLayerObjects()) {
          if(customLayersNS.layers.getLayerObjects().hasOwnProperty(layerName)) {
            customLayersNS.layers.createCustomLayerDetail(layerName);
          }
        }

        customLayersNS.collapsibleBoxSwitch(document.getElementById('customLayersArrow'), 'Show');

      }

    } else {
      window.sessionStorage.removeItem('layerObs');
      window.sessionStorage.setItem('sessId', '<?=$sessionId?>')
    }
  }
}
</script>
    
  </head>
  <body>
    <span class='sect'>Layer Definition</span><p id="layerDefinitionArrow"  data-which="layerDefinition" class="arrow" onclick="customLayersNS.collapsibleBoxSwitch(this)"><span>▲</span></p>
    <div id="layerDefinitionBox" class="collapsibleBox hidden">
      <form id="mainForm">
        <div id="existingLayerOpt">
          <label for="existinglayers">Layers</label><select name="existinglayers" onchange="customLayersNS.mainForm.getProps()"></select><br> 
          <label for="layerattributes">Fields</label><select name="layerattributes" onchange=""><option value='' disabled selected>Choose...</option></select><br> 
        </div>
        <div id="featureSourceOpt">
          <label for="layername">Layer Name</label><input title="Acceptable values: A-Z,a-z,_,0-9" type="text" name="layername" autofocus="" onchange="customLayersNS.mainForm.validate(this)"><br>
          <label for="featuresource">Feature Source</label><select name="featuresource" onchange="customLayersNS.mainForm.fillClass()"></select><br> 
          <label for="featureclass">Feature Class</label><select name="featureclass" onchange="customLayersNS.mainForm.validate(this)"></select><br>
        </div>
        <label for="ruletype">Rule Type</label>
          <select name="ruletype" onchange="customLayersNS.mainForm.createRuleOptions()">
            <option value='' disabled selected>Choose...</option>
            <option value='area'>Area</option>
            <option value='line'>Line</option>
            <option value='point'>Point</option>
          </select><br>
        <label for="numfilterrules"># of Rules</label><input type="text" title="Acceptable values: 1-3" id="numfilterrules" name="numfilterrules" placeholder ="[1-3]" onchange="customLayersNS.mainForm.createRuleOptions('ruleNumInput')"><p id="rulesArrow" data-whichBox="rules" class="arrow collapsed" onclick="customLayersNS.collapsibleBoxSwitch(this)"><span>▲</span></p>
        <div id="rulesBox" class="collapsibleBox"></div>
        <button type='button' onclick="customLayersNS.layers.make(customLayersNS.mainForm)">Submit</button>
        <input type="reset" value='Reset'>
      </form>
    </div>
    <span class='sect'>Messages</span><p id="messagesArrow"  data-which="messages" class="arrow collapsed" onclick="customLayersNS.collapsibleBoxSwitch(this)"><span>▲</span></p>
    <div id="messagesBox" class="collapsibleBox">
      <ul id="messagesList"></ul>
    </div>
    <span class='sect'>Custom Layers Details</span><p id="customLayersArrow"  data-which="customLayers" class="arrow collapsed" onclick="customLayersNS.collapsibleBoxSwitch(this)"><span>▲</span></p>
    <div id="customLayersBox" class="collapsibleBox">
      <ul id="customLayersList"></ul>
    </div>
    <div id="deleteLayerPopUp" class="Hide">
        <span>Permanently remove layer "</span><span id="layerNameDelete" class="layerNameHighlight"></span>" from map?<br>
        <span id="yesConfirm" class="deleteLayerConfirmationButton" onclick="customLayersNS.layers.del(true, this)">YES</span><span id="noConfirm" class="deleteLayerConfirmationButton" onclick="customLayersNS.layers.del(false, this)">NO</span>
    </div>
  </body>

</html>