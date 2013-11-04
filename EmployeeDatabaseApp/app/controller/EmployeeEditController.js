/*
    file: EmployeeEditController.js
    author: Karol Sanchez
    description: Defines the functions used to edit the employee's personal and emergency contact information.
 */
//Contains variables to be used for employee selection, grid navigation, and employee info editing.
Ext.require('data.SharedData');

Ext.define('CXP.controller.EmployeeEditController', {
    id: 'EditController',
    extend: 'Ext.app.Controller',
    stores: ['EmployeeFormStore', 'StateStore'],
    models: ['EmployeeFormModel', 'StateModel'],
    views: ['EmployeeFormView'],
    refs: [{
        ref: 'employeeTabPanel',
        selector: 'tabpanel'
    }, {
        ref: 'infoItemTreePanel',
        selector: 'treepanel'
    }, {
        ref: 'employeeListGridPanel',
        selector: 'gridpanel'
    }],

    init: function () {
        me = this;
        me.activeInfoTab = ''; //The active tab
        me.info = {}; //Array of the form fields
        me.updatedValuesEmployeeInfo = {}; //Array of the updated fields for the Employee Tab
        me.updatedValuesEmergencyContact = {}; //Array of the updated fields for the Emergency Contact
        me.empName = '' //Name of currently loaded employee

        this.control({

            //Fires when a different tab is selected
            'infopanel': {
                tabchange: this.editInfo
            },

            //Fires when the 'Edit' checkbox is checked or unchecked
            'infopanel tabbar field': {
                change: this.editInfo
            },

            //Fires when 'Save' button clicked
            'infopanel button[action=save]': {
                click: this.saveInfoAndPic
            },

            //Fires when 'Cancel' button clicked
            'infopanel button[action=cancel]': {
                click: this.cancelEdit
            },

            //Fires when a change is detected in the picture upload textfield
            'infopanel filefield': {
                change: this.uploadPicChange
            },

            'infopanel button[action=cancelImageSave]': {
                click: data.SharedData.resetPicUpload
            },

            //Add new employee
            'namelist button[action=addnew]': {
                toggle: this.addNewEmployee
            }

        });
    },

    //Enables and disbales and resets various components in order to add a new employee
    addNewEmployee: function (a) {

        var addNewEmployeeButton = a

        //Reference the tab panel
        var employeeTabPanel = me.getEmployeeTabPanel();

        //Reference the tree panel
        var infoItemTreePanel = me.getInfoItemTreePanel();

        //Reference the grid panel
        var employeeListGridPanel = me.getEmployeeListGridPanel();

        if (addNewEmployeeButton.pressed != false) {
            //The button has been toggled on; new employee will be added
            //
                     
            //The employee doesn't have a tempId(alphaId) yet
            data.SharedData.tempId = 'newEmployee';

            //Used to let various components know a new employee is being added
            data.SharedData.addNewEmployee = 1;

            //Change the button text to display option to cancel adding new employee
            addNewEmployeeButton.setText('Cancel Add New Employee')

            //Disable and mask the information tree and employee list grid components 
            infoItemTreePanel.body.mask();
            infoItemTreePanel.getDockedItems('toolbar')[0].child('button').disable();
            employeeListGridPanel.body.mask();
            employeeListGridPanel.down('toolbar button[action = backward]').disable();
            employeeListGridPanel.down('toolbar button[action = forward]').disable();

            //Enable the cancel button to reset text fields
            employeeTabPanel.down('toolbar button[action = cancel]').enable();

            //Show tab panel
            employeeTabPanel.setVisible(true);

            //Make Employee Info tab active
            employeeTabPanel.setActiveTab(0);
            
            //Remove the background image if there is one
            if (employeeTabPanel.isVisible()) {
                Ext.getCmp('userInfoForm').body.applyStyles('background-image:none;')
            }
            
            //Reset and show the textfields for the employee info tab             
            Ext.each(employeeTabPanel.down('#employeeInfoForm').items.items, function () {
                if (this.id != 'picContainer') {
                    this.reset()
                    this.show()
                }else{
                    this.show()
                }
            })
            
            //Set the submit values to the emergency contact forms back to false
            Ext.each(employeeTabPanel.down('#contactInfoForm').items.items, function () {
                this.submitValue = true;
                this.reset()
                this.show()
            })

            //Reset the layout for the tab panel 
            employeeTabPanel.doLayout();

            //Set the value of the checkbox to true in order to use this.editInfo()
            employeeTabPanel.down('tabbar field').setValue(true)

            //Hide the checkbox
            employeeTabPanel.down('tabbar field').hide();

            //Run this.editInfo
            this.editInfo();

        } else {
            //The toggle button is no longer pressed.  Add New Employee Cancelled!

            //Set to 0 to indicate addNewEmployee functionality disabled
            data.SharedData.addNewEmployee = 0;

            //Reset the text on the toggle button
            addNewEmployeeButton.setText('Add New Employee')

            //Enable and unmask information tree and employee name list components        
            infoItemTreePanel.body.unmask();
            infoItemTreePanel.getDockedItems('toolbar')[0].child('button').enable();
            employeeListGridPanel.body.unmask();
            employeeListGridPanel.down('toolbar button[action = backward]').enable();
            employeeListGridPanel.down('toolbar button[action = forward]').enable();

            //Disable the cancel button to reset text fields
            employeeTabPanel.down('toolbar button[action = cancel]').disable();

          
            //Set the submit values to the emergency contact forms back to false
            Ext.each(employeeTabPanel.down('#contactInfoForm').items.items, function () {
                this.submitValue = false;
                if (data.SharedData.addNewEmployeeSuccess == 0){
                    this.reset();
                    this.hide();
                }
            })
                        
            //Reset and hide the textfields for the employee info tab             
            Ext.each(employeeTabPanel.down('#employeeInfoForm').items.items, function () {
                if (this.id != 'picContainer') {
                    if (data.SharedData.addNewEmployeeSuccess == 0){
                        this.reset();
                        this.hide();
                    }
                }else{
                    if (data.SharedData.addNewEmployeeSuccess == 0){
                        this.hide();
                    }
                }
            })
            
            if (data.SharedData.addNewEmployeeSuccess == 0){
                //Add the background image 
                if (employeeTabPanel.isVisible()) {
                    Ext.getCmp('userInfoForm').body.applyStyles('background-image:url(data/pictures/e7logo.png);background-repeat:no-repeat;background-position:center;')
                }
            }
            
            //Reset to 0 
            data.SharedData.addNewEmployeeSuccess = 0;
                           

            //Set checkbox value to false
            employeeTabPanel.down('tabbar field').setValue(false);

            //Show the checkbox
            employeeTabPanel.down('tabbar field').show();

            //Launch the this.editInfo function
            me.editInfo();

        }
    },

    //Enables editing of employee info and emergency contact fields
    editInfo: function () {

        if (Ext.getCmp('editCheck').value === true) {
            //The checkbox is CHECKED;
            
            //Grab the active tab
            me.activeInfoTab = this.getEmployeeTabPanel().getActiveTab();

            //Disable Reset Field button until a textfield changes
            Ext.getCmp('cancelButton').disable()

            //Resize the employee picture to make room for Save and Reset button bar
            Ext.getCmp('picPanel').setSize(300, 140);
            Ext.getCmp('picPanel').center();

            //Show the Save and Reset button bar
            this.getEmployeeTabPanel().getDockedComponent('editButtonBar').show();
            this.getEmployeeTabPanel().doComponentLayout();

            
            //If adding new employee, make name field editable, otherwise mask it           
            if(data.SharedData.addNewEmployee == 1){
                Ext.getCmp('nametextfield').setReadOnly(false);
                Ext.getCmp('nametextfield').getEl().unmask();             
            }else{
                Ext.getCmp('nametextfield').getEl().mask();
            }


            //Make the rest of the fields editable
            Ext.getCmp('birthdaytextfield').setReadOnly(false);
            Ext.getCmp('streettextfield').setReadOnly(false);
            Ext.getCmp('citytextfield').setReadOnly(false);
            Ext.getCmp('statetextfield').setReadOnly(false);
            Ext.getCmp('ziptextfield').setReadOnly(false);
            Ext.getCmp('contactfirstnametextfield').setReadOnly(false);
            Ext.getCmp('contactlastnametextfield').setReadOnly(false);
            Ext.getCmp('housephonetextfield').setReadOnly(false);
            Ext.getCmp('relationtextfield').setReadOnly(false);

            //Modify employee picture fieldset to enable new picture upload
            Ext.getCmp('picPanel').setVisible(false); //hide the current image
            Ext.getCmp('uploadPicForm').setVisible(true); //show the uploadPic form
            Ext.getCmp('picContainer').setTitle('Upload New Employee Picture');


        } else {
            //The checkbox is UNchecked.

            //Make name field read only and unmask it
            Ext.getCmp('nametextfield').setReadOnly(true);
            Ext.getCmp('nametextfield').getEl().unmask();

            //Set the rest of the fields for both tabs as read only
            Ext.getCmp('birthdaytextfield').setReadOnly(true);
            Ext.getCmp('streettextfield').setReadOnly(true);
            Ext.getCmp('citytextfield').setReadOnly(true);
            Ext.getCmp('statetextfield').setReadOnly(true);
            Ext.getCmp('ziptextfield').setReadOnly(true);
            Ext.getCmp('contactfirstnametextfield').setReadOnly(true);
            Ext.getCmp('contactlastnametextfield').setReadOnly(true);
            Ext.getCmp('housephonetextfield').setReadOnly(true);
            Ext.getCmp('relationtextfield').setReadOnly(true);

            //Restore the picture's original size
            Ext.getCmp('picPanel').setSize(300, 170);
            Ext.getCmp('picPanel').center();

            //Hide the Save and Reset button bar
            this.getEmployeeTabPanel().getDockedComponent('editButtonBar').hide();
            this.getEmployeeTabPanel().doComponentLayout();

            //Hide the picture upload field
            Ext.getCmp('picPanel').setVisible(true);
            Ext.getCmp('uploadPicForm').setVisible(false);
            Ext.getCmp('picContainer').setTitle('Employee Picture');
        }
    },

    //Determine whether to upload a picture file; fires the saveEdit() function
    saveInfoAndPic: function () {

        //The employee picture form    
        var form = Ext.getCmp('uploadPicForm').getForm();

        if (form.isValid() && Ext.getCmp('uploadPicForm').items.items[0].items.items[0].submitValue === true) {

            //The picture form is valid and ready to submit; upload and submit the file.
            form.submit({
                params: {
                    i: data.SharedData.tempId //Defines the current employee whose picture is being uploaded
                },
                url: '../CensusSQL/php/uploadEmployeePicture.php',
                waitMsg: 'Uploading your photo...',
                submitEmptyText: true,
                success: function () {
                    //Add information about the employee picture to the array of values which will be updated
                    me.updatedValuesEmployeeInfo['hasPic'] = 'true';

                    //Launch saveEdit()
                    me.saveEdit();
                },
                failure: function (fp, o) {
                    //The file was not uploaded or saved successfully
                    var obj = Ext.JSON.decode(o.response.responseText);

                    //Reset the picture upload file field
                    data.SharedData.resetPicUpload()

                    //Display alert with reason for failure
                    Ext.Msg.alert('Failure', 'The image file was not uploaded successfully. The rest of form will not be submitted. \n Please make sure you have filled out all the necessary fields accordingly.\n  Error: ' + obj.errors);
                }
            });
        } else if (form.isValid() === false && Ext.getCmp('uploadPicForm').items.items[0].items.items[0].submitValue === true) {
            //The image is supposed to the uploaded but the file name is not valid. Display alert with error.
            Ext.Msg.alert('Failure', 'The image file name or extension is not valid.\n The file extension must be a JPEG or GIF, and the file name may contain the following characters:\n A-Z, a-z, 0-9, -, _ and whitespace.');

        } else if (Ext.getCmp('uploadPicForm').items.items[0].items.items[0].submitValue === false && form.isValid() === false) {
            //The form is INvalid and is not supposed to be submitted, so launch savedEdit() to save employee and emergency contact info           
            me.saveEdit()

        } else if (Ext.getCmp('uploadPicForm').items.items[0].items.items[0].submitValue === false && form.isValid() === true) {
            //The picture form is valid but not supposed to be submitted, so launch saveEdit() to save employee and emergency contact info    
            me.saveEdit()

            //Reset the picture upload file field
            data.SharedData.resetPicUpload()
        }
    },

    //Post the updates to the server-side SQL database and handle the response
    saveEdit: function () {

        //Keep track of the validity of the employee and emergency contact forms
        var isDirtyEmployeeForm = false;
        var isDirtyEmergencyContactForm = false;
        var validValsEmployee = false;
        var validValsContact = false;

        if (Ext.getCmp('userInfoForm').getForm().isDirty() && Ext.getCmp('userInfoForm').getForm().isValid()) {
            //The employee form has change and is valid
            //Launch the editEmployee function
            me.editEmployee();
            validValsEmployee = true;
            isDirtyEmployeeForm = true;

        } else if (Ext.getCmp('userInfoForm').getForm().isDirty() && Ext.getCmp('userInfoForm').getForm().isValid() == false) {
            //The employee form has changed but at least one of the fields is not valid
            validValsEmployee = false;
            isDirtyEmployeeForm = true;

        } else if (Ext.getCmp('userInfoForm').getForm().isDirty() == false && Ext.getCmp('userInfoForm').getForm().isValid()) {
            //The employee form has changed but at least one of the fields is not valid
            validValsEmployee = true;
            isDirtyEmployeeForm = false;

        } else if (Ext.getCmp('userInfoForm').getForm().isDirty() == false && Ext.getCmp('userInfoForm').getForm().isValid() == false) {
            //The employee form has changed but at least one of the fields is not valid
            validValsEmployee = false;
            isDirtyEmployeeForm = false;
        }

        if (Ext.getCmp('contactInfoForm').getForm().isDirty() && Ext.getCmp('contactInfoForm').getForm().isValid()) {
            //The emergency contact form has changed and is valid
            //Launch the editEmergencyContact function
            me.editEmergencyContact()
            validValsContact = true;
            isDirtyEmergencyContactForm = true;

        } else if (Ext.getCmp('contactInfoForm').getForm().isDirty() && Ext.getCmp('contactInfoForm').getForm().isValid() == false) {
            //The emergency contact form has changed but is not valid
            validValsContact = false;
            isDirtyEmergencyContactForm = true;

        } else if (Ext.getCmp('contactInfoForm').getForm().isDirty() == false && Ext.getCmp('contactInfoForm').getForm().isValid()) {
            //The emergency contact form has changed but is not valid
            validValsContact = true;
            isDirtyEmergencyContactForm = false;

        } else if (Ext.getCmp('contactInfoForm').getForm().isDirty() == false && Ext.getCmp('contactInfoForm').getForm().isValid() == false) {
            //The emergency contact form has changed but is not valid
            validValsContact = false;
            isDirtyEmergencyContactForm = false;
        }

        //Get the field values for the Employee and Emergency Contact tabs         
        if ((isDirtyEmployeeForm == true && validValsEmployee == true && isDirtyEmergencyContactForm == true && validValsContact == true) || (isDirtyEmployeeForm == false && (validValsEmployee == true || validValsEmployee == false) && isDirtyEmergencyContactForm == true && validValsContact == true) || (isDirtyEmployeeForm == true && validValsEmployee == true && isDirtyEmergencyContactForm == false && (validValsContact == true || validValsContact == false))) {

            //To define which php script the variables will be posted to.  
            var whichUrl = '';
            if (data.SharedData.addNewEmployee == 0) {
                //Update a current employee
                whichUrl = '../CensusSQL/php/updateInfo.php';
            } else {
                //Add a new employee
                whichUrl = '../CensusSQL/php/addNewEmployee.php';
            }

            //Make ajax request to post the updated fields
            Ext.Ajax.request({
                actionMethods: 'POST',
                params: {

                    //Array of new values for the employee
                    e: Ext.JSON.encode(me.updatedValuesEmployeeInfo),

                    //Array of the new values for the emergency contact
                    ec: Ext.JSON.encode(me.updatedValuesEmergencyContact),

                    //The alphabetic Id of employee which will be updated
                    i: data.SharedData.tempId
                },
                url: whichUrl,
                reader: {
                    type: 'json'
                },
                submitEmptyText: false,
                success: function (response) {
                    //The Ajax request was successful
                    //Grab the request's response                                      
                    var obj = Ext.JSON.decode(response.responseText);

                    if (obj.success == true) {
                        console.log(Ext.getCmp('statetextfield'))
                console.log(Ext.getCmp("userInfoForm").items.items[4])
                        
                        //The edits were successfully saved to the database
                        
                        //Redefine the original values!!
                        data.SharedData.originalValuesEmployee = Ext.getCmp('userInfoForm').getForm().getFieldValues();
                        data.SharedData.originalValuesEmployee['bday'] = Ext.getCmp('userInfoForm').items.items[1].rawValue
                        data.SharedData.originalValuesEmployee['hasPic'] = me.updatedValuesEmployeeInfo['hasPic'];

                        //Redefine the original values for the emergency contact
                        data.SharedData.originalValuesEmergencyContact = Ext.getCmp('contactInfoForm').items.extractValues('value');
                        
                        //Load the employee into the form
                        var formStore = me.getStore('EmployeeFormStore');
                        

                        if (data.SharedData.addNewEmployee == 1) {
                           
                           //Set the tempId for the new employee
                            data.SharedData.tempId = obj.tempId
                            
                            //A new employee was added so reload the grid
                            Ext.getCmp('nameGrid').getStore('EmployeeListStore').load({
                                params: {
                                    n: data.SharedData.numUsers + 1, //The number of users in the database
                                    d: data.SharedData.displayAmount
                                }
                            });
                            
                            
                            //load the Employee form store
                            formStore.load({
                                params: {
                                    //set the translation Id for the selected employee
                                    cid: data.SharedData.tempId
                                }
                            });
                            
                            //load the employees info into the form
                            formStore.on('load', function () {
                                //grab the info for the selected employee from the store response
                                var info = formStore.data.items[0];
                                if (formStore.proxy.reader.rawData[0] != 'null') {
                                    //found info for selected user

                                    //set the name, bday and state
                                    info.set('name', me.empName);
                                    info.set('bday', formStore.proxy.reader.rawData['bday']);
                                    info.set('statestate', formStore.proxy.reader.rawData['statestate']);

                                    //load the employee info into the form k
                                    Ext.getCmp('userInfoForm').loadRecord(info);
                                    info.commit();
                                    
                                }
                            },this,{
                                single:true
                            } )

                            //Update the employee pic in the form
                            if (Ext.getCmp('uploadPicForm').items.items[0].items.items[0].submitValue == true) {
                                Ext.getCmp('picPanel').setSrc('../CensusSQL/data/pictures/' + data.SharedData.tempId + '.jpg');
                                
                            } else {
                                Ext.getCmp('picPanel').setSrc('../CensusSQL/data/pictures/noPicture.jpg');                               
                            }
                                                      
                            //Set the addNewEmployeeSuccess = 1 so fields will not be hidden
                            data.SharedData.addNewEmployeeSuccess = 1;
                            
                            //Untoggle the add new employee button
                            Ext.getCmp('addNewEmployeeButton').toggle(false);
                            
                            //Reset the text for add new employee button
                            Ext.getCmp('addNewEmployeeButton').setText('Add New Employee');
                            
                            //Done adding new employee so set the value to 0
                            data.SharedData.addNewEmployee = 0;
                                                    
                        }else{
                            //Update the employee pic in the form for older employee
                            //check if employee has picture on file
                            if (me.updatedValuesEmployeeInfo['hasPic'] == 'true' || data.SharedData.originalValuesEmployee['hasPic'] == 'true') {
                                //the employee has a picture 
                                Ext.getCmp('picPanel').setSrc('../CensusSQL/data/pictures/' + data.SharedData.tempId + '.jpg');
                            } else {
                                //picture of employee not found, update with general image
                                Ext.getCmp('picPanel').setSrc('../CensusSQL/data/pictures/noPicture.jpg');
                            }
                        }

                        //Reset the submit value of the picture field
                        data.SharedData.resetPicUpload()

                        //Reference the tree panel
                        var infoItemTreePanel = me.getInfoItemTreePanel();

                        //Reference the grid panel
                        var employeeListGridPanel = me.getEmployeeListGridPanel();

                        //Unmask the grid and tree id body and buttons
                        infoItemTreePanel.body.unmask();
                        infoItemTreePanel.getDockedItems('toolbar')[0].child('button').enable();
                        employeeListGridPanel.body.unmask();
                        employeeListGridPanel.down('toolbar button[action = backward]').enable();
                        employeeListGridPanel.down('toolbar button[action = forward]').enable();

                        //Disable the Reset Fields button
                        Ext.getCmp('cancelButton').disable();

                        //Reset the submit value for all the fields in employee info form
                        Ext.each(Ext.getCmp('userInfoForm').items.items, function () {
                            this.submitValue = false;
                        })

                        //Reset the submit value for all the fields in emergency contact form
                        Ext.each(Ext.getCmp('contactInfoForm').items.items, function () {
                            this.submitValue = false;
                        })

                        //Reset the upadated values arrays
                        me.updatedValuesEmployeeInfo = {}
                        me.updatedValuesEmergencyContact = {}

                        //Grab the tabpanel
                        var employeeTabPanel = me.getEmployeeTabPanel();

                        //Make Employee Info tab active
                        employeeTabPanel.setActiveTab(0);

                        //Show the edit checkbox
                        Ext.getCmp('editCheck').show();

                        //Reset the check value
                        Ext.getCmp('editCheck').setValue(false);

                        //Launch editInfo
                        me.editInfo();

                        if (data.SharedData.stopAlert === false) {
                            //The user wants to display the 'Save successful' message

                            //Define and show the message
                            Ext.MessageBox.show({
                                title: 'Success',
                                msg: 'The changes were saved successfully.<br/><br/><input type="checkbox" id="stop_alert" /> Do not show this message for the remainder of this session.',
                                buttons: Ext.MessageBox.OK,
                                fn: function (btn) {
                                    if (btn == 'ok') {
                                        if (Ext.select('#stop_alert').elements[0].checked == true) {
                                            //The user does not want to display the message again
                                            data.SharedData.stopAlert = true;
                                        }
                                    }
                                }
                            });
                        }
                    } else {
                        //Set the addNewEmployeeSuccess = 0 so fields will  be hidden
                        data.SharedData.addNewEmployeeSuccess = 0;
                            
                        //The edit was not successfully saved.  Show the error response
                        Ext.Msg.alert('Status: \n Reason:', obj.errors.reason + '\n SQL:' + obj.sql);
                    }
                },
                failure: function (response) {
                    
                    //The Ajax request failed. Show error message
                    Ext.Msg.alert('Failure', 'Server-side failure with status code ' + response.responseText);
                }
            });
        } else {
            //At least one of the fields in one of the forms is not valid

            //To set the message for the error alert
            var errorMsg = '';

            if (validValsEmployee == false && validValsContact == true) {
                //The employee form has errors
                errorMsg = 'You have entered invalid values in the Employee Info form! Double check for errors!';

            } else if (validValsEmployee == true && validValsContact == false) {
                //The emergency contact form has errrors
                errorMsg = 'You have entered invalid values in the Emergency Contact form! Double check for errors!';
            } else if (validValsEmployee == false && validValsContact == false) {
                //Both forms have errors
                errorMsg = 'You have entered invalid values in both forms! Double check for errors!';
            }

            if (Ext.getCmp("uploadPicForm").items.items[0].items.items[0].submitValue == true) {
                data.SharedData.resetPicUpload();
                errorMsg += 'You will have to select an image again.'

            }


            //There are invalid values in at least one of the two forms!
            Ext.MessageBox.show({
                title: 'Error',
                msg: errorMsg,
                buttons: Ext.MessageBox.OK
            });
        }
    },

    //Grab edits to Empoyee Info tab
    editEmployee: function () {

        //Grab the values for each textfield      
        var values_ = Ext.getCmp('userInfoForm').getForm().getFieldValues();
        
        
        me.empName = values_['name'];

        //Grab the properly formatted bday field value
        values_['bday'] = Ext.getCmp('userInfoForm').items.items[1].rawValue

        if (data.SharedData.addNewEmployee == 0) {
            //Editing a current employee

            //The store for the Employee Info tab
            var formStore = me.getStore('EmployeeFormStore');

            //Array of textfield objects
            me.info = formStore.data.items[0];
            
            //Set the fields to the values, marks the fields as modified if they are different
            me.info.set(values_);

            if (formStore.getUpdatedRecords()[0] !== undefined) {
                //Grab the modified fields only
                me.updatedValuesEmployeeInfo = formStore.getUpdatedRecords()[0].modified;

                for (var key in me.updatedValuesEmployeeInfo) {
                    //Loop through the updated fields and save the key-value pair in an array
                    me.updatedValuesEmployeeInfo[key] = formStore.getUpdatedRecords()[0].data[key];
                }

                //Commit the changes
                me.info.commit();
            }
        } else {
            //Adding a new employee so ALL of the values will be sent to the database
            me.updatedValuesEmployeeInfo = values_
            console.log(values_)
            if (Ext.getCmp("uploadPicForm").items.items[0].items.items[0].submitValue == true) {
                me.updatedValuesEmployeeInfo['hasPic'] = 'true'
            }
        }
    },

    //Grab the edits to the Emergency Contact
    editEmergencyContact: function () {

        //Loop through the fields in Emergency Conctact tab
        Ext.each(Ext.getCmp('contactInfoForm').items.items, function () {
            if (this.submitValue === true) {

                //If the submitValue for the field is true, save the key-value pair in an array. 
                me.updatedValuesEmergencyContact[this.name] = this.value;

                //Set the submitValue back to false
                this.submitValue = false;
            }
        })
    },

    //Reset the fields to original value
    cancelEdit: function () {

        if (me.activeInfoTab.id == 'userInfoForm' && data.SharedData.addNewEmployee == 0) {
            //The Emplopyee Info tab is active

            //Grab the Employee Info store
            var formStore = me.getStore('EmployeeFormStore');

            //Array of textfield objects
            me.info = formStore.data.items[0];

            //temporarily remvoe the hasPic key-value pair
            var tempKeyValPair =  data.SharedData.originalValuesEmployee['hasPic'];
            delete data.SharedData.originalValuesEmployee['hasPic'];
            
            //Set the fields to the old values
            me.info.set(data.SharedData.originalValuesEmployee);
            
            //re-add the hasPic keyValue pair
            data.SharedData.originalValuesEmployee['hasPic'] = tempKeyValPair;
            

            //Load the original values to the form
            me.activeInfoTab.loadRecord(me.info);

            //Commit the changes
            me.info.commit();
 
        } else if (me.activeInfoTab.id == 'contactInfoForm') {
            //The Emergency Contact tab is active

            for (var i = 0; i < 4; i++) {
                //Loop through the fields and set the original value
                Ext.getCmp('contactInfoForm').items.items[i].setValue(data.SharedData.originalValuesEmergencyContact[i]);
                Ext.getCmp('contactInfoForm').items.items[i].submitValue = false;
            }
            
        } else if (me.activeInfoTab.id == 'userInfoForm' && data.SharedData.addNewEmployee == 1) {
            //Currently adding new employee, so resetting the fields means blanking them all out
            Ext.getCmp('userInfoForm').getForm().reset()
            
        }

        //Disable the cancel button until field change detected again
        Ext.getCmp('cancelButton').disable();

        //Reset the employee picture form
        data.SharedData.resetPicUpload()
    },

    //Change the submit value of the employee picture form when a file is chosen
    uploadPicChange: function (a) {
        a.submitValue = true
        Ext.getCmp('cancelButton').enable();
    }
});