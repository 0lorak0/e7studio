<?php

	/*
	  file: getUserInfo.php
	  author: Karol Sanchez
	  description: Retrieves the information for the selected employee from idInfo table and creates an object in UserInfo class.
	 */
	
	require_once('../../../../../constants.php');

	
	//include userInfo class
	include 'userInfoClass.php';
	
	//the id for the requested employee
	$requestedId = $_POST['cid'];
	
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
	
	    //the query statement
	    $tsql = "SELECT *
		             FROM idInfo 
		             WHERE id_num = (SELECT id_num FROM otherId WHERE id_alpha = '" . $requestedId . "')";
	
	    //create the query
	    $query = sqlsrv_query($conn, $tsql);
	
	    if ($query === false) {
	        //the query could not be created or executed
	        echo "Error in executing the query.</br>";
	    } else {
	
	        //fetch the resulting row and grab its values 
	        $result = sqlsrv_fetch_array($query, SQLSRV_FETCH_ASSOC);
	        if (is_null($result) != true) {
	            //employee info found.
	            $id = $result['id_num'];
	            $bday = $result['bday'];
	            $payPref = $result['payPref'];
	            $street = $result['street'];
	            $city = $result['city'];
	            $state = $result['statestate'];
	            $zip = $result['zip'];
	            $hasPic = $result['hasPic'];
	
	            //create an object of the employees info
	            $user_info_object = new UserInfo($id, $bday, $payPref, $street, $city, $state, $zip, $hasPic);
	            //echo info
	            echo json_encode($user_info_object);
	        } else {
	            //selected employee info not found.  employee not in database!
	            echo json_encode(array('null'));
	        }
	    }
	}
?>
