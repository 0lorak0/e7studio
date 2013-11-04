<?php
	/*
	  file: uploadEmployeePicture.php
	  author: Karol Sanchez
	  description: upoads the employee picture, renames it and saves it to data/tmp
	 */
	
	
	require_once('../../../../../constants.php');
	
	
	if (isset($_FILES)) {
              $temp_file_name = $_FILES['picUpload']['tmp_name'];
              $original_file_name = $_FILES['picUpload']['name'];
	
	      //Find file extention
	      $ext = explode ('.', $original_file_name);
	      $ext = $ext [count ($ext) - 1];
	
              //Give the file a new name based on the employees alpha Id/ tempid
	      $new_name = $_POST['i'].'.'.strtolower($ext);
              
              //Path to temporary folder for pictures
	      $path = '../data/tmp/';
              
	      if (move_uploaded_file ($temp_file_name, $path.$new_name)) {     
                    //The file was moved successfully
                    echo "{success: true, r:'".$new_name."', rr:'".$original_file_name."'}";
	      } else {
                    //The file was not moved
                     echo "{success: false, errors: 'The file was not moved.'}";
	      } 
	}else {
            //No file was uploaded
            echo "{success:false, errors: 'The file was not uploaded.'}";
            
        }
?>
