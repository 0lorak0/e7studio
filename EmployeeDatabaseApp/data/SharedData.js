    /*
     file: SharedData.js
     author: Karol Sanchez
     description: Defines variables to be used globally
    */
    Ext.define('data.SharedData', {
        singleton: true, //to restrict the instantiation of the class to one object 
        pos: 0, //position in list of employees
        displayAmount: 7, //number of employees to display in the grid at once
        numUsers: 0, //total number of employees in list, 
        tempId: '', //the alphabetic translation id for the selected employee
        tempIdCheck: '', //Keep track of the employee being viewed so as not to reload emergency contact tab multiple times for same employee
        stopAlert: false, //used to determine whether or not to show the 'Save Successful' alert
        originalValuesEmployee: {}, //used to store original uploaded field values for employee info
        originalValuesEmergencyContact: {}, //used to store original uploaded field values for emergency contact info
        addNewEmployee: 0, //true when in proces sof adding new employee
        addNewEmployeeSuccess: 0, //true when new employee added successfully
        isAdmin: 0, //set to 1 when user logging in has admin priveleges. Activates editing functionality
        stateStore: {},
        resetPicUpload: function () {
            //function to reset the field value for the employee picture upload form

            //reset the submitValue
            Ext.getCmp("uploadPicForm").items.items[0].items.items[0].submitValue = false;
            Ext.getCmp("uploadPicForm").items.items[0].items.items[0].value = '';
            
            var fileField = document.getElementById('uploadPicForm');
            // get the file upload parent element
            var parentNod = fileField.parentNode;
            // create new element
            var tmpForm = document.createElement("form");
            parentNod.replaceChild(tmpForm, fileField);
            tmpForm.appendChild(fileField);
            tmpForm.reset();
            parentNod.replaceChild(fileField, tmpForm);

            Ext.getCmp("uploadPicForm").items.items[0].items.items[0].reset();
        }
    });