<?php
	/*
	 * file: index.php
	 * author: Karol Sanchez
	 * description: Entry point HTML document for CensusSQL. CensusSQl displays a list of employee names and allows the user to select 
         * the information that they would like to see about the chosen employee.  It also allows editing of employee info and adding a new 
         * employee by users with administrator priveleges. 
	 */
        
	require_once('../../../../constants.php');
	
	?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
    
    <head>
        <style type="text/css">
            body {
                background-color:#444444
            }
            #mainPanel .x-panel-header {
                background-image: none
            }
            .addFile {
                background-image: url('data/pictures/addFile.png') !important;
                background-repeat:no-repeat;
                background-position:center;
            }
            .removeFile {
                background-image: url('data/pictures/removeFile.png') !important;
                background-repeat:no-repeat;
                background-position:center;
            }
        </style>
        <title>e7 Employee Database</title>
        <!--contains all styling information needed
        for whole framework-->
        <link rel="stylesheet" type="text/css" href="/mapguide2009/ext-4.0.1/resources/css/ext-all.css">
        <!--contains minimal set of ExtJs core library classes-->
        <script type="text/javascript" src="/mapguide2009/ext-4.0.1/ext-all-debug.js"></script>
        <!--contains the application's logic-->
        <script type="text/javascript" src="app.js"></script>
    </head>
    
    <body></body>

</html>