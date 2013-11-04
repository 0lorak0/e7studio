<?php
	
	/*
	  file: verifyUser.php
	  author: Karol Sanchez
	  description: Verifies login information.  Reads unameAndPsswd table in SQL Server database.
	 */
	
	require_once('../../../../../constants.php');
	
	
	//the login info submitted
	$submittedUname = $_POST['nameTextfield'];
	$submittedPsswd = $_POST['passwordTextfield'];
	
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
	    echo "{success: false, errors: { reason: \"" . $error[0]['message'] . "\"}}";
	} else {
            //Connection good.  Get number of employees in database.
	    $tsqlGetCount = "Select COUNT(*) FROM userIds";
	    $queryGetCount = sqlsrv_query($conn, $tsqlGetCount);
	    $errorqueryCount = sqlsrv_errors(SQLSRV_ERR_ALL);
	
	    if ($queryGetCount === false) {
                //Query to get number of employees in database failed
	        echo "{success: false, errors: { reason: \"" . $errorqueryCount[0]['message'] . "\"}}";
	    } else {
	
	        $rowCount = sqlsrv_fetch_array($queryGetCount, SQLSRV_FETCH_NUMERIC);
                
                //Define the query to grab the username and password values
	        $tsql = "SELECT pass, isAdmin
	                 FROM unameAndPsswd
	                 WHERE name = '" . $submittedUname . "'";
	
                //create the query
	        $query = sqlsrv_query($conn, $tsql);
	        $queryError = sqlsrv_errors(SQLSRV_ERR_ALL);
	
	        if ($query === false) {
	            //the query could not be created or executed
	            echo "{success: false, errors: { reason: \"" . $queryError[0]['message'] . "\"}}";
	        } else {
	
                    //fetch the resulting row and grab its values 
	            $result = sqlsrv_fetch_array($query, SQLSRV_FETCH_ASSOC);
	
	            if (gettype($result) != NULL) {
                        //Username found in database, grab password value
	                $passRecord = $result['pass'];
	                if (md5($submittedPsswd) == $passRecord) {
                            //The passwords match!
	                    echo "{success: true, isAdmin: " . $result['isAdmin'] . ", count: " . (string) $rowCount[0] . "}";
	                } else {
                            //The passwords do not match!
	                    echo "{success: false, errors: { reason: 'Username and/or Password is incorrect. Try again.' }}";
	                }
	            } else {
                        //The username was not found in the database
	                echo "{success: false, errors: { reason: 'Username and/or Password is incorrect. Try again.' }}";
	            }
	        }
	    }
	}
?>
