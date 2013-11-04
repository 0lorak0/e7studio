<?php
         /*
        file: addNewEmployee.php
        author: Karol Sanchez
        description: Adds the new employee information to SQL Server Database.
        */
	
        require_once('../../../../../constants.php');
	
        
	//array of new employee info
	$newInfoEmployee = json_decode($_POST['e'], true); 
	//array of new emergency contact info
	$newInfoEmergencyContact = json_decode($_POST['ec'], true); 
	
	if (count($newInfoEmployee) < 5 || count($newInfoEmergencyContact) < 3  ){
	    die("{success: false, errors :{reason:'All fields, except for the employee picture, from both the Employee Info and Emergency Contact Info are required.'}, sql: 'No SQL queries were executed.'}");
	}
		
	//returns the next alphabetic id to use for the new employee
	function getNextAlphaId($alphaId) {
	    $alphabet = range('a', 'z');
	    if (substr($alphaId, 2, 1) != 'z') {
	        $third_letter = $alphabet[array_search(substr($alphaId, 2, 1), $alphabet) + 1];
	        $nextAlphaId = substr($alphaId, 0, 2) . $third_letter;
	    } else if (substr($alphaId, 1, 1) != 'z') {
	        $second_letter = $alphabet[array_search(substr($alphaId, 1, 1), $alphabet) + 1];
	        $nextAlphaId = substr($alphaId, 0, 1) . $second_letter . 'a';
	    } else if (substr($alphaId, 0, 1) != 'z') {
	        $first_letter = $alphabet[array_search(substr($alphaId, 0, 1), $alphabet) + 1];
	        $nextAlphaId = $first_letter . substr($alphaId, 1, 2);
	    } else if (substr($alphaId, 2, 1) == 'z' && substr($alphaId, 1, 1) == 'z' && substr($alphaId, 1, 1) == 'z') {
	        $nextAlphaId = 'EndOfPossibleAlphaValues';
	    }
	
	    return $nextAlphaId;
	}
	
	$hasPic = $newInfoEmployee['hasPic'];
	
	//move and delete employee image if any was uploaded
	function handlePicture($hasPic, $allSuccess, $nextAlphaId) {
	
	    if ($hasPic == 'true' && $allSuccess = true) {
	
	        //copy the uploaded file to the data/pictures folder
	        if (copy('../data/tmp/newEmployee.jpg', '../data/pictures/' . $nextAlphaId . '.jpg')) {
	            //delete the file
	            unlink('../data/tmp/newEmployee.jpg');
	        }
	    } else {
	
	        //no picture was uploaded, or the upload was canceled
	        if (file_exists('../data/tmp/newEmployee.jpg')) {
	
	            unlink('../data/tmp/newEmployee.jpg');
	        }
	    }
	}
	
	//Define the string of columns and values to be inserted into idInfo 
	$employeeKeys = '';
	$employeeValues = '';
	foreach ($newInfoEmployee as $key => $item) {
	    if ($key != 'name') {
	        $employeeKeys .= $key . ', ';
	        $employeeValues .= "'" . $item . "', ";
	    }
	}
	
	//Define the string of columns and values to be inserted into emergencyContacts
	$emergencyContactKeys = '';
	$emergencyContactValues = '';
	foreach ($newInfoEmergencyContact as $key => $item) {
	    $emergencyContactKeys .= $key . ', ';
	    $emergencyContactValues .= "'" . $item . "', ";
	}
	
	//connect using SQL Server Authentication
	$serverName = "ServerName";
	$pwd = "pwd";
	$uid = "uid";
	$db = "DatabaseName";
	
	//the connection array
	$connectionInfo = array("UID" => $uid, "PWD" => $pwd, "Database" => $db);
	
	//create the connection to SQL server
	$conn = sqlsrv_connect($serverName, $connectionInfo);
	$connErrors = sqlsrv_errors(SQLSRV_ERR_ALL);
	
	if ($conn === false) {
	    //the connection was not successful
	    echo "{success: false, errors: { reason: \"" . $connErrors[0]['message'] . "\"}}";
	} else {
	
	    //define the query to select the last used alphabetic and numeric ids
	    $tsql_getAlphaAndNumId = 'SELECT TOP 1 * FROM otherId ORDER BY id_alpha DESC;';
	
	    //create the query to select the last used alphabetic and numeric ids
	    $queryGetAlphaAndNumId = sqlsrv_query($conn, $tsql_getAlphaAndNumId);
	    $errorGetAlphaAndNumId = sqlsrv_errors(SQLSRV_ERR_ALL);
	
	    //retrieve the results of the query.  Define next alpha and numeric ids and the employee first and last name
	    while ($row = sqlsrv_fetch_array($queryGetAlphaAndNumId, SQLSRV_FETCH_ASSOC)) {
	        //the last used alphabetic id
	        $lastAlphaId = $row['id_alpha'];
	        //the alphabetic id for the new employee
	        $nextAlphaId = getNextAlphaId($lastAlphaId);
	        if ($nextAlphaId != 'EndOfPossibleAlphaValues') {
	            //the numeric id for the new employee
	            $nextNumId = (string) ($row['id_num'] + 1);
	            if (strlen($nextNumId) == 1) {
	                $nextNumId = '00' . $nextNumId;
	            } else if (strlen($nextNumId) == 2) {
	                $nextNumId = '0' . $nextNumId;
	            }
	            //seperate the employee name into first and last name values
	            $name = explode(' ', trim($newInfoEmployee['name']));
	            if (sizeof($name) > 2) {
	                $fname = $name[0] . ' ' . $name[1];
	                $lastNames = array_slice($name, 2, sizeof($name) - 1);
	                $lname = '';
	                $i = 0;
	                $limit = 0;
	                if (sizeof($lastNames) > 1) {
	                    $limit = sizeof($lastNames) - 1;
	                } else {
	                    $limit = 2;
	                }
	                while ($i < $limit) {
	                    $lname .= $lastNames[$i];
	                    $i++;
	                }
	            } else {
	                $fname = $name[0];
	                $lname = $name[1];
	            }
	        } else {
                    //no more alpha_id values available to use
	            $allSuccess = false;
	            $nextAlphaId = '';
	            handlePicture($newInfoEmployee, $allSuccess, $nextAlphaId);
	            die("{success: false, errors :'Reached end of alpha id values.'}");
	        }
	    }
	
	
	    //define the query to insert values into userIds table
	    $tsqlInsert_userIds = "INSERT INTO userIds (id_alpha, fname, lname) VALUES ('" . $nextAlphaId . "', '" . $fname . "', '" . $lname . "')";
	  
            //create the query to insert values into userIds table
	    $queryInsert_userIds = sqlsrv_query($conn, $tsqlInsert_userIds);
	    $errorInsert_userIds = sqlsrv_errors(SQLSRV_ERR_ALL);
	
	    if ($queryInsert_userIds == true) {
                //The query to insert into userIds table was successful
	
	        //define the query to insert values into otherId table
	        $tsqlInsert_otherId = "INSERT INTO otherId (id_num, id_alpha) VALUES ('" . $nextNumId . "', '" . $nextAlphaId . "')";
	        //create the query to insert values into otherId table
	        $queryInsert_otherId = sqlsrv_query($conn, $tsqlInsert_otherId);
	        $errorInsert_otherId = sqlsrv_errors(SQLSRV_ERR_ALL);
	
	        if ($queryInsert_otherId == true) {
                    //The query to insert into otherId table was successful
                    //
	            //define the query to insert values into idInfo table
	            $tsqlInsert_idInfo = "INSERT INTO idInfo ( id_num, " . substr($employeeKeys, '', -2) . " ) VALUES ('" . $nextNumId . "', " . substr($employeeValues, '', -2) . " )";
	            //create the query to insert values into idInfo 
	            $queryInsert_idInfo = sqlsrv_query($conn, $tsqlInsert_idInfo);
	            $errorInsert_idInfo = sqlsrv_errors(SQLSRV_ERR_ALL);
	
	            if ($queryInsert_idInfo == true) {
                        //The query to insert into idInfo table was successful
	
	                //define the query to insert values into emergencyContacts table
	                $tsqlInsert_emergencyContacts = "INSERT INTO emergencyContacts ( id_alpha, " . substr($emergencyContactKeys, '', -2) . " ) VALUES ('" . $nextAlphaId . "', " . substr($emergencyContactValues, '', -2) . " )";
	                //create the query to update the emergency contact
	                $queryInsert_emergencyContacts = sqlsrv_query($conn, $tsqlInsert_emergencyContacts);
	                $errorInsert_emergencyContacts = sqlsrv_errors(SQLSRV_ERR_ALL);
	
	                if ($queryInsert_emergencyContacts == true) {
                            //The query to insert into emergencyContacts table was successful
	
	                    handlePicture($hasPic, true, $nextAlphaId);
                            
                            //DONE INSERTING INTO ALL TABLES SUCCESSFULLY!
	                    echo "{success: true, tempId: '" . $nextAlphaId . "'}";
                            
	                } else {
                            //The info could not be inserted into the emergencyContacts table
                           
                            //Delete the row from the idInfo table
	                    $tsqlDelete_idInfo = "DELETE FROM idInfo WHERE id_num = '" . $nextNumId . "'";
	                    $queryDelete_idInfo = sqlsrv_query($conn, $tsqlDelete_idInfo);
                            
                            //Delete the row from the otherId table
	                    $tsqlDelete_otherId = "DELETE FROM otherId WHERE id_alpha = '" . $nextAlphaId . "'";
	                    $queryDelete_otherId = sqlsrv_query($conn, $tsqlDelete_otherId);
                            
                            //Delete the row from the userIds table
	                    $tsqlDelete_userIds = "DELETE FROM userIds WHERE id_alpha = '" . $nextAlphaId . "'";
	                    $queryDelete_userIds = sqlsrv_query($conn, $tsqlDelete_userIds);
	
	                    handlePicture($hasPic, false, $nextAlphaId);
	                    echo "{success: false, errors: { reason: 'Error in executing the query: queryInsert_emergencyContacts'}, sql: \"" . $errorInsert_emergencyContacts[0]['message'] . "\" }";
	                }
	            } else {
                        //The info could not be inserted into idInfo table
                        
                        //Delete the row from the otherId table
	                $tsqlDelete_otherId = "DELETE FROM otherId WHERE id_alpha = '" . $nextAlphaId . "'";
	                $queryDelete_otherId = sqlsrv_query($conn, $tsqlDelete_otherId);
                        
                        //Delete the row from the userIds table
	                $tsqlDelete_userIds = "DELETE FROM userIds WHERE id_alpha = '" . $nextAlphaId . "'";
	                $queryDelete_userIds = sqlsrv_query($conn, $tsqlDelete_userIds);
	
	                handlePicture($hasPic, false, $nextAlphaId);
	                echo "{success: false, errors: { reason: 'Error in executing the query: queryInsert_idInfo'}, sql: \"" . $errorInsert_idInfo[0]['message'] . "\" }";
	            }
	        } else {
                    //The info could not be inserted into the otherId table
                    
                    //Delete the values inserted into userIds table
	            $tsqlDelete_userIds = "DELETE FROM userIds WHERE id_alpha = '" . $nextAlphaId . "'";
	            $queryDelete_userIds = sqlsrv_query($conn, $tsqlDelete_userIds);
	
	            handlePicture($hasPic, false, $nextAlphaId);
	            echo "{success: false, errors: { reason: 'Error in executing the query: queryInsert_otherId'}, sql: \"" . $errorInsert_otherId[0]['message'] . "\" }";
	        }
	    } else {
                //The info could not be inserted into the userIds table
	        handlePicture($hasPic, false, $nextAlphaId);
	        echo "{success: false, errors: { reason: 'Error in executing the query: queryInsert_userIs'}, sql: \"" . $errorInsert_userIds[0]['message'] . "\" }";
	    }
	}
?>
	
