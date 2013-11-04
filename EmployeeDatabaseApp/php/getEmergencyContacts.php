<?php

	/*
	  file: getEmergencyContacts.php
	  author: Karol Sanchez
	  description: Parses and echoes emergency contact info for selected employee. Retrieved from SQL Server database table emergencyContacts.
	 */
	
	require_once('../../../../../constants.php');
	
	
	include 'contactInfoClass.php';
	
	//id for selected employee
	$requestedId = $_POST['rid'];
	
	//connect using SQL Server Authentication
	$serverName = "ServerName";
	$pwd = "pwd";
	$uid = "uid";
	$db = "DatabaseName";
	
	//the connection array
	$connectionInfo = array("UID" => $uid, "PWD" => $pwd, "Database" => $db);
	
	//create the connection to SQL server
	$conn = sqlsrv_connect($serverName, $connectionInfo);
	
	if ($conn === false) {
	    //the connection was not successful
	    echo "{success: false, errors: { reason: 'Unable to connect.' }}";
	    //die(print_r(sqlsrv_errors(),true));
	} else {
	
	    $tsql = "SELECT * 
	                FROM emergencyContacts
	                WHERE id_alpha = '" . $requestedId . "'";
	
	    //create the query
	    $query = sqlsrv_query($conn, $tsql);
	    $errors = sqlsrv_errors(SQLSRV_ERR_ALL);
	
	    if ($query === false) {
	        //the query could not be created or executed
	        echo "{success: false, errors: { reason: \"" . $errors[0]['message'] . "\" }}";
	        // die(print_r(sqlsrv_errors(), true));
	    } else {
	
	        //fetch the resulting row and grab its values 
	        $result = sqlsrv_fetch_array($query, SQLSRV_FETCH_ASSOC);
	
	        if (is_null($result) != true) {
	            //contact info found
	            $fname = $result['fname'];
	            $lname = $result['lname'];
	            $housePhone = $result['housePhone'];
	            $relation = $result['relation'];
	
	            //save the contact info into contactInfoClass object
	            $contact_info_object = new contactInfo($fname, $lname, $housePhone, $relation);
	
	            //echo the info
	            echo json_encode($contact_info_object);
	        } else {
	            //selected contact info not found!
	            echo json_encode(null);
	        }
	    }
	}
?>
