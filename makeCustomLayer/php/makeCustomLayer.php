<?php 

/*
		File:               makeCustomLayer.php
        Author:             Karol Sanchez
        Info:				Query Mapguide feature sources and create layers
*/

require_once('../../../common/common.php');
require_once('../../../common/layerFunctions.php');
require_once('../../../../mapviewerphp/layerdefinitionfactory.php');


$sessionId = isset($_POST['sessionId']) ? $_POST['sessionId'] : 'unknown';
$mapName = isset($_POST['mapName']) ? $_POST['mapName'] : 'unknown';
$layerSource = isset($_POST['layerSource']) ? $_POST['layerSource'] : 'unknown'; 
$parameters= isset($_POST['parameters']) ? $_POST['parameters'] : 'unknown';
$todo = isset($_POST['todo']) ? $_POST['todo'] : 'unknown';
$dataLocation = "Library://Map3dSample/Data/";


try{
	MgInitializeWebTier($webconfigFilePath);

	$userInfo = new MgUserInformation($sessionId);
	$siteConnection = new MgSiteConnection();
	$siteConnection->Open($userInfo);
	$resourceService = $siteConnection->CreateService(MgServiceType::ResourceService);
	$featureService = $siteConnection->CreateService(MgServiceType::FeatureService);
	$map =  new MgMap($siteConnection);
	$map->Open($mapName);
	if($todo == 'filling'){
		$result = filling($resourceService, $featureService, $dataLocation, $layerSource);
	}else if ($todo == 'makeLayer'){
		$result = makeLayer($sessionId, $map, $resourceService, $featureService, $parameters);
	}else if ($todo == 'removeLayers'){
		$layerName =  isset($_POST['layerName']) ? $_POST['layerName'] : 'unknown'; 
		$result = removeLayers($sessionId, $mapName, $map, $resourceService, $layerName);
	}else if($todo == 'getProps'){
		$layerName =  isset($_POST['layerName']) ? $_POST['layerName'] : 'unknown'; 
		$result = getProps($map, $layerName);
	}
	

}catch(MgException $e){
	$errorMessage = $e->GetExceptionMessage();
	$errorDetails = $e->GetDetails();
	$errorMessage = preg_replace('/\s+/',' ', $errorMessage);
	$errorDetails = preg_replace('/\s+/',' ', $errorDetails);
	$result = '{"success" : "false", "response" : {"message" : "' . str_replace('"', '\"', $errorMessage) . '"}}';

}

echo $result;

//get the properties for the layer
function getProps(&$map, $layerName){
		$layerCollection = $map->GetLayers();
		$layer = $layerCollection->GetItem($layerName);
		$classDefinition = $layer->GetClassDefinition();
		$classPropertyCollection = $classDefinition->GetProperties();
		$numProperties = $classPropertyCollection->GetCount();
		

	//add the properties to the layer definition
	for ($i = 0; $i < $numProperties; $i++){
		$propertyName = $classPropertyCollection->GetItem($i)->GetName();
		$propertyType = $classPropertyCollection->GetItem($i)->GetPropertyType();
		if ($propertyType == 100){ //if GEOM (property type 102) included we get an error in www\mapviewerphp\getselectedfeature.php line 167;
			$properties[$i] = $propertyName;
		}
	}

		return '{"success" : "true", "response" : { "layerName" : "' . $layerName .'", "numProperties" : "'. $numProperties .'", "props": '. json_encode($properties) . ' }}';
}


//retrieve the feature source values
function filling(&$resourceService, &$featureService, &$dataLocation, $sourceType)
{

	$repositoryId = new MgResourceIdentifier($dataLocation);
	$byteReader = $resourceService->EnumerateResources($repositoryId, -1, 'FeatureSource', true);
	$XMLContent = $byteReader->ToString();

	$domDocument = DOMDocument::loadXML($XMLContent);
	$featureSources = $domDocument->getElementsByTagName('ResourceId');

	$featureSourcesNoPathArray = array();
	$numFeatureSources = $featureSources->length;

	for($i = 0; $i < $numFeatureSources; $i++){
		$nameWithPath = $featureSources->item($i)->nodeValue;
		$path = substr($nameWithPath, 0, strrpos($nameWithPath,'/') + 1);
		$name = substr($nameWithPath, strrpos($nameWithPath,'/') + 1);
		$name = substr($name, 0, strrpos($name, '.'));
		$featureSourcesNoPathArray[$name] = array(); 

		$fsResourceId = new MgResourceIdentifier($nameWithPath);
		$schemaCollection = $featureService->GetSchemas($fsResourceId);
		for($j = 0; $j < $schemaCollection->GetCount(); $j++){
			$classCollection = $featureService->GetClasses($fsResourceId,$schemaCollection->GetItem($j));
			$schema = $schemaCollection->GetItem($j);
			for($k = 0; $k < $classCollection->GetCount(); $k++){	
				$classDefinition = $featureService->GetClassDefinition($fsResourceId, $schemaCollection->GetItem($j), $classCollection->GetItem($k)) ;
				$className = $classDefinition->GetName();
				$geometry = $classDefinition->GetDefaultGeometryPropertyName();
				//$featureSourcesNoPathArray[$name][$k] = array($classCollection->GetItem($k), $geometry, $path);
				$featureSourcesNoPathArray[$name][$k] = array($schema, $className, $geometry, $path);
			}
		}
	}


	$postArray = array('featureSources' => $featureSourcesNoPathArray);

	return '{"success" : "true", "response" : '. json_encode($postArray) .' }';
}

//create the layer
function makeLayer($sessionId, &$map, $resourceService, $featureService, $parameters){

	$parameters = json_decode($parameters, true);

	$numRules = $parameters['numfilterrules'];
	$featureClassArray = explode(',',$parameters['featureclass']);
	$schema =  $featureClassArray[0];
	$featureClass = $featureClassArray[1];
	$geometry = $featureClassArray[2];
	$path = $featureClassArray[3];
	$featureSource = $path . $parameters['featuresource'] . ".FeatureSource";
	


	$queryOptions = new MgFeatureQueryOptions();

	$compoundFilter = '('. $parameters['rulefilter0'] . ')';
	if ($numRules > 1){
		for ($i = 1; $i < $parameters["numfilterrules"]; $i++){
		$compoundFilter .= 'OR (' . $parameters['rulefilter' . $i] . ')';
		}
    }

    $compoundFilter = $compoundFilter;
	$queryOptions->SetFilter($compoundFilter);

	//check greater than 0 results found
	$featureSourceId = new MgResourceIdentifier($featureSource);
	$selectedFeaturesReader = $featureService->SelectFeatures($featureSourceId, $featureClass, $queryOptions);
	$numSelected = 0;
	while($selectedFeaturesReader->ReadNext()){
		++$numSelected;
	}

	//NO FEATURES FOUND - EXIT!
	if ($numSelected == 0){ 
		return '{"success" : "false", "response" : {"layerName" : "' . replaceOperators($parameters['layername'], 'layerName'). '", "message" : "No features found that match the criteria - ' . $compoundFilter .'. Layer not created."}}';
	}

	

	$factory = new LayerDefinitionFactory();

	//create the rules
	$ruleType = $parameters['ruletype'];

	$rules = '';
	for($i = 0; $i < $numRules; $i++){
			
			$legendLabel = $parameters['legendlabel' . $i];
			$filterText = replaceOperators($parameters['rulefilter' . $i], 'xmlFilter');
			$lineStyle = 'Solid';
			$lineUnit = 'Points';
			$lineSizeContext = 'DeviceUnits';

			if($ruleType == 'area'){
				//CreateAreaRule($legendLabel, $filterText, $fillPattern, $foreGroundColor, $backGroundColor, $lineStyle, $lineThickness, $lineColor, $lineUnit, $lineSizeContext)
				
				$fillPattern ='Solid';
				$foreGroundColor = $parameters['foregroundcolor' . $i];
				$backGroundColor = $parameters['foregroundcolor' . $i];
				$lineThickness = '1';
				$lineColor = '000000';
				$rules .= $factory->CreateAreaRule($legendLabel, $filterText, $fillPattern, $foreGroundColor, $backGroundColor, $lineStyle, $lineThickness, $lineColor, $lineUnit, $lineSizeContext);
			
			}elseif($ruleType == 'line'){
				//CreateLineRule($legendLabel, $filter, $lineStyle, $lineThickness, $lineColor, $lineUnit, $lineSizeContext)
				
				$lineColor = $parameters['linecolor'. $i];
				$lineThickness = $parameters['lthickness' . $i];
				$rules .= $factory->CreateLineRule($legendLabel, $filterText, $lineStyle, $lineThickness, $lineColor, $lineUnit, $lineSizeContext);

			}else{
				//CreateMarkSymbol($resourceId, $symbolName, $width, $height, $color)
				$markResourceId  = "Library://Samples/Sheboygan/Symbols/BasicSymbols.SymbolLibrary";
				$markName = $parameters['markname' . $i];
				$markHeight = $parameters['markheight' . $i];
				$markWidth = $parameters['markwidth' . $i];
				$markColor = $parameters['markcolor' . $i];
				$markSymbol = $factory->CreateMarkSymbol($markResourceId, $markName, $markWidth, $markHeight, $markColor);

				//CreateTextSymbol($text, $fontHeight, $foregroundColor)
				$markText = $parameters['marktext' . $i];
				$markTextHeight = $parameters['fontheight' . $i];
				$markTextColor = $parameters['textcolor' . $i];
				$textSymbol = $factory->CreateTextSymbol($markText, $markTextHeight, $markTextColor);

				//CreatePointRule($legendLabel, $filter, $label, $pointSym)
				$rules .= $factory->CreatePointRule($legendLabel, $filterText, $textSymbol, $markSymbol);

			}		   
	}
	
	switch($ruleType){
		case "area":
			$typeStyle = $factory->CreateAreaTypeStyle($rules);
			break;
		case "line":
			$typeStyle = $factory->CreateLineTypeStyle($rules);
			break;
		case "point":
			$typeStyle =$factory->CreatePointTypeStyle($rules);
			break;
	}
	

	//Create a scale range
	$minScale = '0';
	$maxScale = '1000000000';
	$scaleRange = $factory->CreateScaleRange($minScale, $maxScale, $typeStyle);

	$layerDefinition = $factory->CreateLayerDefinition($featureSource, $featureClass, $geometry, $scaleRange); 
	
	//get the properties for the feature class
	$classDefinition = $featureService->GetClassDefinition($featureSourceId, $schema, $featureClass);
	$classPropertyCollection = $classDefinition->GetProperties();
	$numProperties = $classPropertyCollection->GetCount();
	

	$dom = domDocument::loadXML($layerDefinition);
	$geometryNode = $dom->getElementsByTagName('Geometry')->item(0);

	//add the properties to the layer definition
	for ($i = 0; $i < $numProperties; $i++){
		$propertyName = $classPropertyCollection->GetItem($i)->GetName();
		$propertyType = $classPropertyCollection->GetItem($i)->GetPropertyType();
		if ($propertyType == 100){ //if GEOM (property type 102) included we get an error in www\mapviewerphp\getselectedfeature.php line 167;
			$propertyElement = $dom->createElement('PropertyMapping');
			$nameElement = $dom->createElement('Name');
			$valueElement = $dom->createElement('Value');
			$nameElement->nodeValue = $propertyName;
			$valueElement->nodeValue = $propertyName;
			$propertyElement->appendChild($nameElement);
			$propertyElement->appendChild($valueElement);
			$geometryNode->parentNode->insertBefore($propertyElement, $geometryNode);
		}
	}

	$layerDefinition = $dom->saveXML();
	/*$fp = fopen('Layer_'. replaceOperators($parameters['layername'], 'layerName') . '.txt', 'w');
	fwrite($fp, $layerDefinition);
	fclose($fp);*/
	
	$newLayer = add_layer_definition_to_map($layerDefinition, replaceOperators($parameters['layername'], 'layerName'), replaceOperators($parameters['layername'], 'legendName'), $sessionId, $resourceService, $map);
	add_layer_to_group($newLayer,'CustomLayers', 'CUSTOM LAYERS', $map,$sessionId);

	$map->Save($resourceService);
		
	return '{"success" : "true", "response" : {"layerName" : "' .replaceOperators($parameters['layername'], 'layerName'). '", "message" : "' . $numSelected . ' feature(s) found."}}';
}


//remove layer from map
function removeLayers($sessionId, $mapName, &$map, &$resourceService, $layerName){
	$layerCollection = $map->GetLayers();
	$layer = $layerCollection->GetItem($layerName);
	$removed = $layerCollection->Remove($layer);
	if ($removed){
		$map->Save($resourceService);
		return  '{"success" : "true", "response" : {"layerName" : "' . $layerName . '", "message" : "Layer successfully removed."}}';
	}else{
		return  '{"success" : "false", "response" : {"layerName" : "' . $layerName . '", "message" : "Layer could not be removed."}}';
	}

}

?>