<?php

    /*
    file: contactInfoClass.php
    author: Karol Sanchez
    description: stores the Emergency Contact name, phone and relation to employee.
    */

	require_once('../../../../../constants.php');
	
	class contactInfo {
	    public $fname;
            public $lname;
	    public $housePhone;
	    public $relation;
	    
	    function __construct($fname,$lname,$housePhone,$relation)
	    {
	        $this->fname = $fname;
                $this->lname = $lname;
	        $this->housePhone = $housePhone;
	        $this->relation = $relation;       
	     }            
	}

?>
