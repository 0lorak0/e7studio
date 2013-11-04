<?php

	/*
	  file: getUserIds.php
	  author: Karol Sanchez
	  description: Retrieves and echoes the employee names from userIds table in SQL Server database
	 */
	
	require_once('../../../../../constants.php');
	
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
	
	    //position in table of employees
	    $pos = $_POST['p'];
	    if (is_null($pos) === true) {
	        $pos = 0;
	    }
	
	    //number of users in Database
	    $num_users = $_POST['n'];
	
	
	    //number of employees wich will be displayed in the grid
	    $displayAmount = $_POST['d'];
	
	    if ($pos + $displayAmount > $num_users) {
	        //reached the end of the list
	        $limit = $num_users;
	    } else {
	        // haven't reached the end of the list
	        $limit = $pos + $displayAmount;
	    }
	
	    //the query statement
	    $tsql = "SELECT id_alpha, fname, lname 
	                 FROM (SELECT ROW_NUMBER() OVER( ORDER BY lname,fname) AS R, * FROM userIds) AS TempTable
	                 WHERE TempTable.R > " . (string) $pos . " AND Temptable.R <= " . (string) ($limit) . ";";
	
	    //create the query
	    $query = sqlsrv_query($conn, $tsql);
	
	    if ($query === false) {
	        //the query could not be created or executed
	        echo "Error in executing query.</br>";
	        //die(print_r(sqlsrv_errors(),true));
	    } else {
	
	        $employees = array();
	
	        while ($row = sqlsrv_fetch_array($query, SQLSRV_FETCH_ASSOC)) {
	            //loop through rows of result
	            array_push($employees, $row);
	        }
	
	        //echo the array of employee names
	        echo json_encode($employees);
	    }
	}
?>
