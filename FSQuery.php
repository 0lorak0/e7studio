<?php 
	/*******************************************************************************
	File:		FSQuery.php
	Name:		Karol Sanchez
	Date		10/10/2013
	Info:		Query Mpaguide Feature Sources. Created to replace PHP mssql and sqlsrv extensions not available in PHP 64bit.
	
		SQL KEYWORDS IN QUERY STRING NEED TO BE CAPITALIZED
		TODO: Parse for more SQL keywords.  
		      Add functionality (is it possible through mapguide?) for parametrized queries   
	******************************************************************************
	*/


	require_once(__DIR__.'/../common.php');
	

	class FSQUery{
		private $resourceId;
		private $site;
		private $featureService;
		private $success = array('err' => false, 'msg' => '');
		private $selectOptions = array(
			'length' => 1,
			'star'=> false,
			'as' => false,
			'count' => false,
			'allStarRows' => 0,
			'distinct' => false
			 );
		//private $fieldNameArray = array();

		public $error;

		function __construct($user,$pwd){
			try{
				$this->site = new MgSiteConnection();
				$this->site->Open(new MgUserInformation($user, $pwd));
				$this->featureService = $this->site->CreateService(MgServiceType::FeatureService);	
			}catch(MgException $e){
				$msg = "Exception during FSQuery instantiation : " . $e->GetExceptionMessage();
				$this->error['err'] = true;
				$this->error['msg'] = $msg;
				echo $msg;
			}
		}

		function getErrorBool(){
			return $this->error['err'];
		}

		function getErrorMsg(){
			return $this->error['msg'];
		}

		function setFeatureSource($resourceId_arg){
			try{
				$this->resourceId = new MgResourceIdentifier($resourceId_arg);
			}catch(MgException $e){
				$msg = "Exception at FSQuery->setFeatureSource : " . $e->GetExceptionMessage();
				$this->error['err'] = true;
				$this->error['msg'] = $msg;
				echo $msg;
			}
		}

		private function setSelect($keyValArray, &$queryOptions){    
		try{
			$selOptArr = $keyValArray['SELECT'];      
			//print_r($selOptArr);                                                         
			$this->selectOptions['length'] = count($selOptArr);
			$star = $this->selectOptions['star'];
			$as = $this->selectOptions['as'];
			$count = $this->selectOptions['count'];

			if($star && $this->selectOptions['length'] == 1){
			
				if($as){
					$explodedArray = explode('AS', $selOptArr[0]);
					$explodedArray[0] = trim($explodedArray[0]);
					$explodedArray[1] = trim($explodedArray[1]);
					$this->selectOptions['starCountedAlias'] = $explodedArray[1];
					
				}else if($count){
					$this->selectOptions['starCountedAlias'] = 'COUNT(*)';
				}

			}else{
				for($i = 0; $i < $this->selectOptions['length']; $i++){

					$selOptArr[$i] = trim($selOptArr[$i]);

					if(strpos($selOptArr[$i], 'DISTINCT') !== false){
						$queryOptions->SelectDistinct(true);
						$distinctExplodedArray = explode('DISTINCT', $selOptArr[$i]);
						$selOptArr[$i] = trim($distinctExplodedArray[1]);
					}

					if(strpos($selOptArr[$i], 'AS') !== false){

						$explodedArray = explode('AS', $selOptArr[$i]);
						$explodedArray[0] = trim($explodedArray[0]);
						$explodedArray[1] = trim($explodedArray[1]);
						//echo 'added computed property :' . $explodedArray[1] . ' ' .$explodedArray[0] . '<br>';
 						$queryOptions->AddComputedProperty($explodedArray[1], $explodedArray[0]);

					}else if(strpos($selOptArr[$i], 'AS') == false && $count){

						$leftParenPos = strpos($selOptArr[$i], '(');
						$rightParenPos = strpos($selOptArr[$i], ')');
						$countedPropertyName = trim(substr($selOptArr[$i], $leftParenPos + 1, $rightParenPos - $leftParenPos - 1));
						$this->selectOptions[$countedPropertyName.'COUNTED'] = $countedPropertyName;
						$queryOptions->AddComputedProperty($countedPropertyName.'COUNTED', $selOptArr[$i]);

					}else{
						//echo 'added property :' . $selOptArr[$i] . '<br>';
						$queryOptions->AddFeatureProperty($selOptArr[$i]);
				
					}
				}
			}	
			}catch(MgException $e){
				$msg = "Exception at FSQuery->setWhere : " . $e->GetExceptionMessage();
				$this->error['err'] = true;
				$this->error['msg'] = $msg;

				echo $msg;
			}			
		}

		private function setOrdering($keyValArray, &$queryOptions){
			$stringCollection = new MgStringCollection();
			$orderType = MgOrderingOption::Ascending;

			for($i = 0; $i < count($keyValArray['ORDER BY']); $i++){
				$orderProp = $keyValArray['ORDER BY'][$i];

				//check if ASC or DESC keyword present
				if(strpos($orderProp, 'DESC') !== false){
					$orderProp = substr($keyValArray['ORDER BY'][$i], 0, strpos($keyValArray['ORDER BY'][$i], 'DESC'));
					$orderType = MgOrderingOption::Descending;
				}elseif(strpos($orderProp, 'ASC') !== false){
					$orderProp = substr($keyValArray['ORDER BY'][$i], 0, strpos($keyValArray['ORDER BY'][$i], 'ASC'));
				}

				$stringCollection->Add(trim($orderProp));
			}

			$queryOptions->SetOrderingFilter($stringCollection, $orderType);
		}

		private function setWhere($keyValArray, &$queryOptions){
			$newWhereString = '';
			$whereString = $keyValArray['WHERE'][0];
			$explodedArray = explode('AND', $whereString);
			for($i = 0; $i < count($explodedArray); $i++){
				if(strpos($explodedArray[$i], 'IS NULL') !== false){
					$explodedArray[$i] = str_replace('IS NULL', 'NULL', $explodedArray[$i]);

				}elseif(strpos($explodedArray[$i], 'IS NOT NULL') !== false){
					$explodedArray[$i] =  ' NOT '. str_replace('IS NOT NULL', 'NULL', $explodedArray[$i]);
				}elseif(strpos($explodedArray[$i], 'NOT LIKE') !== false){
					$explodedArray[$i] =  ' NOT '. str_replace('NOT LIKE', 'LIKE', $explodedArray[$i]);
				}
			}

			$newWhereString = implode(' AND ', $explodedArray);	
	
			$queryOptions->SetFilter($newWhereString);

		}

		function query($queryStr){
			try{
				$keyValArray = $this->parseQuery($queryStr);
				if($this->selectOptions['distinct']){
					$queryOptions = new MgFeatureAggregateOptions();
				}else{
					$queryOptions = new MgFeatureQueryOptions();
				}
				
				//set select properties
				$this->setSelect($keyValArray, $queryOptions);

				//set ordering
				if(array_key_exists('ORDER BY', $keyValArray)){
					$this->setOrdering($keyValArray, $queryOptions);
				}

				//set filter
				if(array_key_exists('WHERE', $keyValArray)){	
					$this->setWhere($keyValArray, $queryOptions);
				}

				if($this->selectOptions['distinct']){
					return $this->featureService->SelectAggregate($this->resourceId, $keyValArray['FROM'][0], $queryOptions);
				}else{
					return $this->featureService->SelectFeatures($this->resourceId, $keyValArray['FROM'][0], $queryOptions);
				}

			}catch(MgException $e){
				$msg = "Exception at FSQuery->query : " . $e->GetExceptionMessage();
				$this->error['err'] = true;
				$this->error['msg'] = $msg;

				echo $msg;
			}
		}

		private function parseQuery($queryString){
			try{
				$keyValArray = array();
				$keyWordArray = array('ORDER BY', 'WHERE', 'FROM', 'SELECT'); 
				$arraySize = count($keyWordArray);

				//loop through query string to separate the keyword-value pairs
				for($i = 0; $i < $arraySize; $i++){
					$explodedArray = explode($keyWordArray[$i], $queryString); 
					if(count($explodedArray) > 1) {	//keyword found in query string
						if($keyWordArray[$i] == 'SELECT'){
							if(strpos($explodedArray[1], '*') !== false){
								$this->selectOptions['star'] = true;
							}
							if(strpos($explodedArray[1], 'AS') !== false){
								$this->selectOptions['as'] = true;
							}
							if(strpos($explodedArray[1], 'COUNT') !== false){
								$this->selectOptions['count'] = true;
							}
							if(strpos($explodedArray[1], 'DISTINCT') !== false){
								$this->selectOptions['distinct'] = true;
							}
						}

						if(strstr($explodedArray[1], ',')){	//the keyword consists of comma seperated list
							$explodedSubArray = explode(',', $explodedArray[1]);
							for($j = 0; $j < count($explodedSubArray); $j++){
								$explodedSubArray[$j] = trim($explodedSubArray[$j]);
							}
							$keyValArray[$keyWordArray[$i]] = $explodedSubArray;
						}else{
							$keyValArray[$keyWordArray[$i]] = array(trim($explodedArray[1]));
						}
						$queryString = trim($explodedArray[0]);
					}
				}

				return $keyValArray;

			}catch(MgException $e){
				$msg = "Exception at FSQuery->parseQuery : " . $e->GetExceptionMessage();
				$this->error['err'] = true;
				$this->error['msg'] = $msg;
				echo $msg;
			}
		}

		function fetchArray(&$queryResult, $returnArrayType = 'BOTH'){
			try{
				$finalArray = false;
				$resultAssocArray = array();
				$resultNumArray =  array();

				if($queryResult->ReadNext()){
					$this->selectOptions['allStarRows']++;
					if($this->selectOptions['length'] == 1 && $this->selectOptions['star'] && $this->selectOptions['count']){
						$countingRows = 1;
						while($queryResult->ReadNext()){
							$countingRows++;
						}
						$resultAssocArray[$this->selectOptions['starCountedAlias']] = $countingRows;
						$resultNumArray[0] = $countingRows;
				    }else{
				    	$propertyCount = $queryResult->GetPropertyCount();
					
						//create an associative and an index array with the properties retrieved from the query
						for($i = 0; $i < $propertyCount; $i++){

							$currentPropertyName = $queryResult->GetPropertyName($i);
							$currentPropertyValue = $this->GetProperty($currentPropertyName, $queryResult);
							if(array_key_exists($currentPropertyName, $this->selectOptions)){
								$currentPropertyName = $this->selectOptions[$currentPropertyName];
							}
							$resultAssocArray[$currentPropertyName] = $currentPropertyValue;
							$resultNumArray[$i] = $currentPropertyValue;

							//$this->fieldNameArray[$i] = $currentPropertyName;
						}
				    }

					switch($returnArrayType){
						case 'ASSOC':
							$finalArray = $resultAssocArray;
							break;

						case 'NUM':
							$finalArray = $resultNumArray;
							break;

						default:	
							$finalArray = array( 'ASSOC' => $resultAssocArray, 'NUM' => $resultNumArray);	
					}
				}

				return $finalArray;

			}catch(MgException $e){
				$msg = "Exception at FSQuery->fetchArray : " . $e->GetExceptionMessage();
				$this->error['err'] = true;
				$this->error['msg'] = $msg;
				echo $keyValArray['WHERE'];
				echo $msg;
			}
		}

		function fieldName(&$queryResult, $index){
			try{
				$propertyName = false;
				$classDefiniton = $queryResult->GetClassDefinition();
				$propertyDefinitionCollection = $classDefiniton->GetProperties();
				$numProps = $propertyDefinitionCollection->GetCount();
				if( $index >= 0 && $index < $numProps){
					$propertyDefinition = $propertyDefinitionCollection->GetItem($index);
					$propertyQualifiedName = $propertyDefinition->GetQualifiedName();
					$dotPos = strrpos($propertyQualifiedName, '.');
					$propertyName = substr($propertyQualifiedName, $dotPos + 1);
					if(array_key_exists($propertyName, $this->selectOptions)){
							$propertyName = $this->selectOptions[$propertyName];
					}
				}
				return $propertyName;

				//return $this->fieldNameArray[$index];
			}catch(MgException $e){
				$msg = "Exception at FSQuery->fieldName : " . $e->GetExceptionMessage();
				$this->error['err'] = true;
				$this->error['msg'] = $msg;
				echo $msg;
			}
		}

		function closeQuery(&$queryResult){
			try{
				$queryResult->Close();
			}catch(MgException $e){
				$msg = "Exception at FSQuery->closeQuery : " . $e->GetExceptionMessage();
				$this->error['err'] = true;
				$this->error['msg'] = $msg;
				echo $msg;
			}
		}

		private function dateTimeFormat($dateTimeObj){
			//check if date, time or datetime
			$date = $dateTimeObj->IsDate();
			$time = $dateTimeObj->IsTime();
			$dateTime = $dateTimeObj->IsDateTime();

			$month = $dateTimeObj->GetMonth();
			$day = $dateTimeObj->GetDay();
			$year = $dateTimeObj->GetYear();
			$hour = $dateTimeObj->GetHour();
			$min = $dateTimeObj->GetMinute();


			switch($month){
				case 1:
					$month = 'Jan';
					break;
				case 2:
					$month = 'Feb';
					break;
				case 3:
					$month = 'Mar';
					break;
				case 4:
					$month = 'Apr';
					break;
				case 5:
					$month = 'May';
					break;
				case 6:
					$month = 'Jun';
					break;
				case 7:
					$month = 'Jul';
					break;
				case 8:
					$month = 'Aug';
					break;
				case 9:
					$month = 'Sep';
					break;
				case 10:
					$month = 'Oct';
					break;
				case 11:
					$month = 'Nov';
					break;
				case 12:
					$month = 'Dec';
					break;
				default :
					$month = 'unknown';
					break;
			}

			$ampm = $hour >= 12 ? 'PM' : 'AM';
			$hour = $hour % 12;
			if($hour == 0){$hour =  12;}
			if($min == 0){$min = '00';}
			$dateTimeString = $month . ' ' . $day . ' ' . $year . ' ' . $hour . ':' . $min . $ampm;

			return $dateTimeString;

		}

		private function getProperty($propertyName, $featureReader){
			try{
				$propertyType = $featureReader->GetPropertyType($propertyName);

				$val = null;
				if(!$featureReader->IsNull($propertyName) ){

					switch($propertyType){

						case MgPropertyType::Null :
							break;
						
						case MgPropertyType::Boolean :
							$val = $featureReader->GetBoolean($propertyName);
							break;

						case MgPropertyType::Byte :
							$val = $featureReader->GetByte($propertyName);
							break;

						case MgPropertyType::DateTime :
							$val = $featureReader->GetDateTime($propertyName);
							$val = $this->dateTimeFormat($val);
							break;
						
						case MgPropertyType::Single :
							$val = $featureReader->GetSingle($propertyName);
							break;

						case MgPropertyType::Double :
							$val = $featureReader->GetDouble($propertyName);
							break;

						case MgPropertyType::Int16 :
							$val = $featureReader->GetInt16($propertyName);
							break;

						case MgPropertyType::Int32 :
							$val = $featureReader->GetInt32($propertyName);
							break;

						case MgPropertyType::Int64 :
							$val = $featureReader->GetInt64($propertyName);
							break;

						case MgPropertyType::String :
							$val = $featureReader->GetString($propertyName);
							break;

						case MgPropertyType::Blob :
							$val = $featureReader->GetBlob($propertyName);
							break;

						case MgPropertyType::Clob :
							$val = $featureReader->GetClob($propertyName);
							break;

						case MgPropertyType::Feature :
							$val = $featureReader->GetFeature($propertyName);
							break;

						case MgPropertyType::Geometry :
							$val = $featureReader->GetGeometry($propertyName);
							break;

						case MgPropertyType::Raster :
							$val = $featureReader->GetRaster($propertyName);
							break;

						default :
							$val = 'Unknown property value';
					}
				}
					return $val;
				

			}catch(MgException $e){
				$msg = "Exception at FSQuery->getProperty : " . $e->GetExceptionMessage();
				$this->error['err'] = true;
				$this->error['msg'] = $msg;
				echo $msg;
			}

			
		}
	}


?>
