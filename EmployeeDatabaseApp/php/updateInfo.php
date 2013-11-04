<?php

	/*
	  file: uodateInfo.php
	  author: Karol Sanchez
	  description: Updates the database info for the selected employee.
	 */
	
	require_once('../../../../../constants.php');
	
	//array of column values to update
	$updatedInfoEmployee = json_decode($_POST['e'], true);
	//name of table to update
	$updatedInfoEmergencyContact = json_decode($_POST['ec'], true);
	//the employee alphabetic id
	$alphaId = $_POST['i'];
	
	
	$colsAndVals = '';
	$colsAndValsEC = '';
        
        //Create the string for the Employee query
	foreach ($updatedInfoEmployee as $key => $item) {	
	    $colsAndVals .= $key . " = '" . $item . "', ";
	}
	
        //Create the string for the Emergency Contact query
	foreach ($updatedInfoEmergencyContact as $key => $item) {
	    $colsAndValsEC .= $key . " = '" . $item . "', ";
	}
	
	//Employee query
	$tsql_Employee = "UPDATE idInfo SET " . substr($colsAndVals, '', -2) . " WHERE id_num = (SELECT id_num FROM otherId WHERE id_alpha = '" . $alphaId . "')";
	
        //Emergency contact query
        $tsql_EContact = "UPDATE emergencyContacts SET " . substr($colsAndValsEC, '', -2) . " WHERE id_alpha = '" . $alphaId . "'";
	
		
	//connect using SQL Server Authentication
	$serverName = "ServerName";
	$pwd = "pwd";
	$uid = "uid";
	$db = "DatabaseName";
	
	//the connection array
	$connectionInfo = array("UID" => $uid, "PWD" => $pwd, "Database" => $db);
	
	//create the connection to SQL server
	$conn = sqlsrv_connect($serverName, $connectionInfo);
	$error = sqlsrv_errors(SQLSRV_ERR_ALL);
	if ($conn === false) {
	    //the connection was not successful
	    // echo "Unable to connect.</br>";
	    //  die(print_r(sqlsrv_errors(),true));
	    echo "{success: false, errors: { reason: \"" . $error[0]['message'] . "\"}}";
	} else {
	
	    if ($updatedInfoEmployee['hasPic'] == 'true') {
	        //copy the uploaded file to the data/pictures folder
	
	        if (copy('../data/tmp/' . $alphaId . '.jpg', '../data/pictures/' . $alphaId . '.jpg')) {
	            //delete the file
	            unlink('../data/tmp/' . $alphaId . '.jpg');
	        }
	    } else {
	        //the user no longer want to update the image so delete the file
	        if (file_exists('../data/tmp/' . $alphaId . '.jpg')) {
	            unlink('../data/tmp/' . $alphaId . '.jpg');
	        }
	    }
	
	    if (count($updatedInfoEmergencyContact) > 0) {
	        //create the query to update the emergency contact
	        $queryEContact = sqlsrv_query($conn, $tsql_EContact);
	        $error2 = sqlsrv_errors(SQLSRV_ERR_ALL);
	    } else {
                //No info for emergency contact was sent for an update
	        $queryEContact = true;
	    }
	
	    if (count($updatedInfoEmployee) > 0) {
	        //create the query to update the employee info
	        $queryEmployee = sqlsrv_query($conn, $tsql_Employee);
	        $error = sqlsrv_errors(SQLSRV_ERR_ALL);
	    } else {
                //No info for employee was sent for and update
	        $queryEmployee = true;
	    }
	
            
            //Echo back the results
	    if ($queryEmployee == true && $queryEContact == true) {
	        echo "{success: true}";
	    } else if ($queryEmployee == false && $queryEContact == true) {
	        echo "{success: false, errors: { reason: 'Error in executing the query: queryEmployee." . $tsql_Employee . "'}, sql: \"" . $error[0]['message'] . "\"}";
	    } else if ($queryEmployee == true && $queryEContact == false) {
	        echo "{success: false, errors: { reason: 'Error in executing the query: queryEContact.'}, sql: \"" . $error2[0]['message'] . "\"}";
	    }
	}
?>
	