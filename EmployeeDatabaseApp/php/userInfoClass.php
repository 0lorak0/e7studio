<?php

	/*
	file: userInfoClass.php
	author: Karol Sanchez
	description: class userInfo, stores id, birthday, address and pay preference for the selected employee.
	*/
	
	class UserInfo {
	
	    public $id;
	    public $bday;
	    public $payPref;
	    public $street;
	    public $city;
	    public $statestate;
	    public $zip;
            public $hasPic;
	
	    function __construct($id, $bday, $payPref, $street, $city, $state, $zip, $hasPic) {
	        $this->id = $id;
	        $this->bday = $bday;
	        $this->payPref = $payPref;
	        $this->street = $street;
	        $this->city = $city;
	        $this->statestate = $state;
	        $this->zip = $zip;
                $this->hasPic = $hasPic;
	    }
	
	}
	
	require_once('../../../../../constants.php');
	

?>
