/*
    file: EmployeeListController.js
    author: Karol Sanchez
    description: Defines functions for the events associated with the employee list grid.
    */
//contains variables to be used for employee seletion and grid navigation.
Ext.require('data.SharedData');

Ext.define('CXP.controller.EmployeeListController', {
    extend: 'Ext.app.Controller',
    stores: ['EmployeeListStore', 'EmployeeFormStore','StateStore'],
    models: ['EmployeeListModel', 'EmployeeFormModel','StateModel'],
    views: ['EmployeeListView', 'EmployeeFormView'],
    refs: [{
        ref: 'employeeTabPanel',
        selector: 'tabpanel'
    }, {
        ref: 'treeTree',
        selector: 'treepanel'
    }],

    init: function () {
        me=this;
        data.SharedData.stateStore= me.getStore('StateStore');
        console.log(data.SharedData.stateStore)
        this.control({
            //fire this function when an employee name is clicked
            'viewport > panel > container > namelist': {
                itemclick: this.showMess
            },

            //button to move list of users forward
            'namelist button[action=forward]': {
                click: this.updateListF
            },

            //button to move list of users backward
            'namelist button[action=backward]': {
                click: this.updateListB
            }
        });
    },

    //DISPLAY the textfields for the selected info items.   
    showMess: function (grid, record) {
        //Grab the tab panel
        var infopanel = this.getEmployeeTabPanel();

        //Unhide tab panel
        infopanel.setVisible(true);

        //hide any displayed images and textfields
        this.clearAll();
        Ext.getCmp('userInfoForm').body.applyStyles('background-image:none;')

        //Unhide the picture Panel
        Ext.getCmp('picContainer').setVisible(true);


        //make Employee Info tab active
        infopanel.setActiveTab(0);

        //array of user info items that were checked
        var infoToDisplay = this.getTreeTree().getView().getChecked();

        var numItems = 0;

        //loop through checked items and display its textfield
        Ext.each(infoToDisplay, function (obj) {
            

            if (obj.internalId !== 'addresstree' && obj.internalId !== "ext-record-1" && obj.internalId != "Root") {

                //checked item is not a root node
   
                var checkedItem = obj.get('text').toLowerCase() + 'textfield';

                if (Ext.getCmp(checkedItem) !== undefined){ 
                    Ext.getCmp(checkedItem).show();
                }
            }
            numItems += 1;
        });

        if (infoToDisplay.length > 0 && numItems == infoToDisplay.length) {

            //at least one info item was selected and the loop is done
            data.SharedData.firstLoad = 1;
            this.retrieveInfo(grid, record);
        } else {

            //setting tempId to 999 to clear emergency contact info; used in EmployeeFormView.
            data.SharedData.tempId = 999;

            //hide the picture and textfields
            this.clearAll();

            //display message explaining no info items were selected
            Ext.getCmp('formTabPanel').setActiveTab(0);
            this.infoMessages('Missing Information', 'Please select at least one item from the Information Tree before selecting an Employee.');
        }
    },

    //RETRIEVE info for selected employee and LOAD it into the form
    retrieveInfo: function (grid, record) {

        //alphabetic Id for selected employee
        data.SharedData.tempId = record.get('id_alpha');

        //name of selected employee
        var name = record.get('fname') + ' ' + record.get('lname');

        var formStore = this.getStore('EmployeeFormStore');

        //load the Employee form store
        formStore.load({
            params: {
                //set the translation Id for the selected employee
                cid: data.SharedData.tempId
            },
            callback: function () {
                //Add listeners to detect changes in employee info textfield
                Ext.each(Ext.getCmp('userInfoForm').items.items, function () {
                    if (this.id != 'picContainer') {
                        //Don't add listner to picture container
                        this.addListener('change', function () {
                            //If a change in field detected, enable the Reset Fields button
                            Ext.getCmp('cancelButton').enable();
                        })
                    }
                });
                //Disable the Reset Fields button fr every different employee load
                Ext.getCmp('cancelButton').disable();

            }
        });
        


        formStore.on('load', function () {
            //grab the info for the selected employee from the store response
            var info = formStore.data.items[0];
            if (formStore.proxy.reader.rawData[0] != 'null') {
                //found info for selected user
                
                info.set('name', name);
                info.set('bday', formStore.proxy.reader.rawData['bday']);
                //info.set('statestate', formStore.proxy.reader.rawData['statestate']);
                // Ext.getCmp('statetextfield').select
                //load the employee info into the form 
                Ext.getCmp('userInfoForm').loadRecord(info);
                console.log(Ext.getCmp('statetextfield'))
                console.log(Ext.getCmp("userInfoForm").items.items[4].getValue())
              /* var v= Ext.getCmp("userInfoForm").items.items[4].getValue();
                var record = Ext.getCmp("userInfoForm").items.items[4].findRecord(Ext.getCmp("userInfoForm").items.items[4].valueField || Ext.getCmp("userInfoForm").items.items[4].displayField,v)
                if (record === false){
                    var stateValueModel = Ext.getCmp("userInfoForm").items.items[4].store.data.items[0];
                    Ext.getCmp("userInfoForm").items.items[4].select(stateValueModel);                                       
                }*/
                                
                info.commit();

                //check if employee has picture on file
                if (formStore.proxy.reader.rawData.hasPic == 'true') {
                    //the employee has a picture
                    Ext.getCmp('picPanel').setSrc('../CensusSQL/data/pictures/' + data.SharedData.tempId + '.jpg');
                } else {
                    //picture of employee not found, update with general image
                    Ext.getCmp('picPanel').setSrc('../CensusSQL/data/pictures/noPicture.jpg');
                }

                //manage the size of the employee picture based on whether edit button bar visible
                if (Ext.getCmp('editCheck').value === true) {
                    //The edit bar is displayed, minimize the size of the employee pic
                    Ext.getCmp('picPanel').setSize(300, 140);
                } else {
                    //The edit bar is not displayed, maximize the size of the employee pic
                    Ext.getCmp('picPanel').setSize(300, 170);
                }
                Ext.getCmp('picPanel').center();

                //save the uploaded field values
                data.SharedData.originalValuesEmployee = info.data;
                data.SharedData.originalValuesEmployee['hasPic'] = formStore.proxy.reader.rawData['hasPic'];

            } else {
                //the info for the selected employee was not found
                //hide all of the textfields
                this.clearAll();
                //show error message
                this.infoMessages('Missing Information', name + ' is not in the database! Please contact database administrator.')
            }
        }, this, {
            single: true
        });


    },

    //load next seven employee names
    updateListF: function () {
        //update the position in list of names
        data.SharedData.pos += data.SharedData.displayAmount;
        this.getStore('EmployeeListStore').load({
            //post the updated postion in list of names
            params: {
                p: data.SharedData.pos,
                n: data.SharedData.numUsers,
                d: data.SharedData.displayAmount
            }
        });

        //enable or disable forward button
        this.enableDisable();

        //hide all textfields and images
        this.clearAll();

        //setting tempId to 999 to clear emergency contact info.  used in EmployeeFormView
        data.SharedData.tempId = 999;
        Ext.getCmp('formTabPanel').setActiveTab(0);
        //apply background image to employee info tab
        Ext.getCmp('userInfoForm').body.applyStyles('background-image:url(data/pictures/e7logo.png);background-repeat:no-repeat;background-position:center;');
    },

    //load previous seven employees
    updateListB: function () {
        //update the position in list of names
        data.SharedData.pos -= data.SharedData.displayAmount;
        this.getStore('EmployeeListStore').load({
            params: {
                //post the updated postion in list of names
                p: data.SharedData.pos,
                n: data.SharedData.numUsers,
                d: data.SharedData.displayAmount
            }
        });

        //enable or disbale backward button
        this.enableDisable();

        //hide all textfields and images
        this.clearAll();

        //setting tempId to 999 to clear emergency contact info.  used in EmployeeFormView
        data.SharedData.tempId = 999;
        Ext.getCmp('formTabPanel').setActiveTab(0)
        //apply background image to employee info tab
        Ext.getCmp('userInfoForm').body.applyStyles('background-image:url(data/pictures/e7logo.png);background-repeat:no-repeat;background-position:center;');

    },

    //enable or disable back/forward buttons based on position in list of names
    enableDisable: function () {

        if (data.SharedData.pos < data.SharedData.displayAmount) {
            //beginning of list; disbable back button
            Ext.getCmp('backButton').disable();
        } else if (data.SharedData.displayAmount <= data.SharedData.pos && data.SharedData.pos < (data.SharedData.numUsers - data.SharedData.displayAmount)) {
            //middle of list; both buttons enabled.
            Ext.getCmp('forwardButton').enable();
            Ext.getCmp('backButton').enable();
        } else if (data.SharedData.pos >= (data.SharedData.numUsers - data.SharedData.displayAmount)) {
            //end of list; disable forward button
            Ext.getCmp('forwardButton').disable();
        }
    },

    //hide all textfields and images
    clearAll: function () {
        Ext.getCmp('nametextfield').hide();
        Ext.getCmp('birthdaytextfield').hide();
        Ext.getCmp('streettextfield').hide();
        Ext.getCmp('citytextfield').hide();
        Ext.getCmp('statetextfield').hide();
        Ext.getCmp('ziptextfield').hide();
        Ext.getCmp('contactfirstnametextfield').hide();
        Ext.getCmp('contactlastnametextfield').hide();
        Ext.getCmp('housephonetextfield').hide();
        Ext.getCmp('relationtextfield').hide();
        Ext.getCmp('picContainer').hide();
        Ext.getCmp('cancelButton').disable();
        //Reset the empty value of the file field; Ext.ComponentQuery.query('filefield[name=picUpload]')[0].reset() doesn't work!
        // get the file upload element

        var infopanel = this.getEmployeeTabPanel();
        if (Ext.getCmp('uploadPicForm').isVisible() == true && data.SharedData.isAdmin == 1) {
            data.SharedData.resetPicUpload()

            //Reset the check value
            Ext.getCmp('editCheck').setValue(false);

            //Launch editInfo
            me.editInfo();
        }

    },

    //control background image to employee info tab and display messages
    infoMessages: function (mainTitle, mess) {
        Ext.getCmp('userInfoForm').body.applyStyles('background-image:url(data/pictures/e7logo.png);background-repeat:no-repeat;background-position:center;');
        Ext.MessageBox.show({
            title: mainTitle,
            msg: mess,
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox.INFO
        });
    }
});