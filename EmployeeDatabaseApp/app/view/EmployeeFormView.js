/*
    file: EmployeeFormView.js
    author: Karol Sanchez
    description: Defines the tab panel used to display the selected employees personal and emergency contact information.  Also
                 makes AJAX request to getEmergencyContacts.php to retrieve emergency contact information.
 */
Ext.require('data.SharedData');
Ext.define('CXP.view.EmployeeFormView', {
    test: 'ok',
    extend: 'Ext.tab.Panel',
    id: 'formTabPanel',
    alias: 'widget.infopanel',
    frame: false,
    hidden: true,
    activeTab: 0,
    style: {
        border: 'outset 7px #8c8c8c',
        margin: '0 0 0 7px'
    },
    tabBar: {
        items: [{
            xtype: 'tbfill'
        }, {
            xtype: 'checkbox',
            id: 'editCheck',
            name: 'checkboxEdit',
            boxLabel: 'Edit',
            boxLabelAlign: 'before',
            margin: '0 3px 0 0',
            hidden: true,
            listeners: {
                afterrender: function () {
                    //Add tooltips
                    Ext.create('Ext.tip.ToolTip', {
                        target: 'editCheck',
                        html: 'Check/Uncheck to enable/disable editing of information.',
                        anchor: 'bottom',
                        style: 'background-color:#FCF8DC'
                    });
                }
            }
        }]
    },
    //Define buttons used to save or cancel information edits
    bbar: {
        hidden: true,
        autoRender: true,
        id: 'editButtonBar',
        layout: {
            pack: 'end'
        },
        items: [{
            xtype: 'button',
            text: 'Save',
            id: 'saveButton',
            action: 'save',
            listeners: {
                afterrender: function () {
                    //Add tooltip
                    Ext.create('Ext.tip.ToolTip', {
                        target: 'saveButton',
                        html: 'Click to save edits to both tabs.',
                        anchor: 'bottom',
                        style: 'background-color:#FCF8DC'
                    });
                }
            }
        }, {
            xtype: 'button',
            text: 'Reset Fields',
            id: 'cancelButton',
            action: 'cancel',
            disabled: true,
            listeners: {
                afterrender: function () {
                    //Add tooltip
                    Ext.create('Ext.tip.ToolTip', {
                        target: 'cancelButton',
                        html: 'Click to reset fields for the current tab.',
                        anchor: 'bottom',
                        style: 'background-color:#FCF8DC'
                    });
                }
            }
        }]
    },
    items: [{
        //Employee Info tab
        title: 'Employee Info',
        store: 'EmployeeFormStore',
        html: '',
        itemId: 'employeeInfoForm',
        id: 'userInfoForm',
        xtype: 'form',
        // trackResetOnLoad:true,
        bodyStyle: {
            padding: '10px',
            background: '#eeeeee'
        },
        items: [{
            fieldLabel: 'Name',
            id: 'nametextfield',
            xtype: 'textfield',
            readOnly: true,
            name: 'name',
            hidden: true,
            emptyText: 'First Last',
            regex: /([a-zA-z\-]+\s+)([a-zA-Z\-]+\s*)/,
            regexText: 'You must enter a first and last name at least.',
            maskRe: /[a-zA-z\-\s]/,
            validator: function (values) {
                if (this.regex.test(values)) {
                    return true
                } else {
                    return 'Valid characters: A-Z,a-z,-'
                }
            }
        }, {
            fieldLabel: 'Birthday',
            id: 'birthdaytextfield',
            xtype: 'datefield',
            readOnly: true,
            name: 'bday',
            hidden: true,
            format: 'm/d/Y',
            maxValue: new Date(),
            minValue: '01/01/1900',
            allowBlank: false,
            minLength: 10,
            maxLength: 10,
            showToday: false,
            emptyText: '01/01/1900',
            invalidText: 'Valid Format: MM/DD/YYYY'
        }, {
            fieldLabel: 'Street',
            id: 'streettextfield',
            xtype: 'textfield',
            readOnly: true,
            name: 'street',
            hidden: true,
            maxLength: 80,
            allowBlank: false,
            emptyText: '123 Main St. Apt. 123'

        }, {
            fieldLabel: 'City',
            id: 'citytextfield',
            xtype: 'textfield',
            readOnly: true,
            name: 'city',
            hidden: true,
            maxLength: 50,
            allowBlank: false,
            emptyText: 'City'
        }, {
            fieldLabel: 'State',
            id: 'statetextfield',
            name: 'statestate',
            xtype: 'combobox',
            readOnly: true,
            typeAhead: true,
            hidden: true,
            maxLength: 2,
            forceSelection: true,
            emptyText: 'Please select...',
            store: 'StateStore',
            displayField: 'abbr',
            valueField: 'abbr',
            queryMode: 'local',
            listConfig: {
                getInnerTpl: function () {
                    return '<div>{name} ({abbr})</div>';
                }
            }
        }, {
            fieldLabel: 'Zip',
            id: 'ziptextfield',
            xtype: 'textfield',
            readOnly: true,
            name: 'zip',
            hidden: true,
            minLength: 5,
            maxLength: 5,
            enforceMaxLength: true,
            allowBlank: false,
            emptyText: '*****',
            regex: /[0-9]{5}/,
            maskRe: /[0-9]/
        }, {
            xtype: 'fieldset',
            id: 'picContainer',
            collapsible: true,
            title: 'Employee Picture',
            items: [{
                xtype: 'image',
                id: 'picPanel',
                src: Ext.BLANK_IMAGE_URL,
                height: 200,
                hidden: false
            }, {
                xtype: 'form',
                id: 'uploadPicForm',
                trackResetOnLoad: true,
                frame: false,
                border: false,
                bodyStyle: 'background:transparent',
                hidden: true,
                items: [{
                    xtype: 'container',
                    width: 280,
                    layout: 'hbox',
                    items: [{
                        xtype: 'filefield',
                        value: '',
                        id: 'picUpload',
                        name: 'picUpload',
                        emptyText: 'Select an image',
                        width: 225,
                        submitValue: false,
                        submitEmptyText: false,
                        buttonText: '',
                        buttonConfig: {
                            iconCls: 'addFile'
                        },
                        regex: /([_a-zA-Z0-9\-\s]*).(jpg|JPG|jpeg|JPEG|gif|GIF)/,
                        regexText: 'The image file type must be JPEG or GIF.',
                        validator: function (values) {
                            if (this.regex.test(values)) {
                                return true
                            } else if (values == "") {
                                return true
                            } else {
                                return 'Valid characters for filename: A-Z,a-z,0-9,-,_ and whitespace.'

                            }
                        },
                        listeners: {
                            afterrender: function () {
                                //Add tooltip
                                Ext.create('Ext.tip.ToolTip', {
                                    target: 'picUpload',
                                    html: 'Browse for an image.',
                                    anchor: 'left',
                                    style: 'background-color:#FCF8DC'
                                });
                            }
                        }
                    }, {
                        xtype: 'tbspacer',
                        width: 5
                    }, {
                        xtype: 'button',
                        id: 'cancelImage',
                        iconCls: 'removeFile',
                        action: 'cancelImageSave',
                        listeners: {
                            afterrender: function () {
                                //Add tooltip
                                Ext.create('Ext.tip.ToolTip', {
                                    target: 'cancelImage',
                                    html: 'Cancel image submit.',
                                    anchor: 'left',
                                    style: 'background-color:#FCF8DC'
                                });
                            }
                        }
                    }]
                }]
            }]
        }]

    }, {
        //Emergency contact form tab
        title: 'Emergency Contact',
        xtype: 'form',
        // trackResetOnLoad:true,
        itemId: 'contactInfoForm',
        layout: 'anchor',
        bodyStyle: {
            padding: '10px',
            background: '#eeeeee'
        },
        html: '',
        id: 'contactInfoForm',
        items: [{
            fieldLabel: 'First Name',
            id: 'contactfirstnametextfield',
            xtype: 'textfield',
            readOnly: true,
            name: 'fname',
            hidden: true,
            allowBlank: false,
            emptyText: 'First',
            maxLength: 80,
            submitValue: false
        }, {
            fieldLabel: 'Last Name',
            id: 'contactlastnametextfield',
            xtype: 'textfield',
            readOnly: true,
            name: 'lname',
            hidden: true,
            allowBlank: false,
            emptyText: 'Last',
            maxLength: 80,
            submitValue: false
        }, {
            fieldLabel: 'House Phone',
            id: 'housephonetextfield',
            xtype: 'textfield',
            readOnly: true,
            name: 'housePhone',
            hidden: true,
            emptyText: '***-***-***',
            minLength: 12,
            maxLength: 12,
            enforceMaxLength: true,
            allowBlank: false,
            submitValue: false,
            regex: /^([0-9]{3})(\-{1})([0-9]{3})(\-{1})([0-9]{4})$/,
            maskRe: /[0-9\-]/,
            regexText: 'Must be in the format: 123-456-7890',
            validator: function (values) {
                if (this.regex.test(values)) {
                    return true
                } else {
                    return 'Invalid input!'
                }
            }
        }, {
            fieldLabel: 'Relation',
            id: 'relationtextfield',
            xtype: 'textfield',
            readOnly: true,
            name: 'relation',
            hidden: true,
            allowBlank: false,
            emptyText: 'Relation',
            maxLength: 15,
            submitValue: false
        }],

        //Make Ajax request for emergency contact info
        loader: {
            url: 'php/getEmergencyContacts.php',
            loadMask: true,

            //Specify type of content to be loaded in the form
            renderer: function (loader, response, active) {
                var info = response.responseText;
                if (info != 'null') {
                    //Contact info found 
                    //Remove employee tab background image
                    loader.getTarget().body.applyStyles('background-image:none');

                    //Show the fields
                    Ext.getCmp('contactfirstnametextfield').show();
                    Ext.getCmp('contactlastnametextfield').show();
                    Ext.getCmp('housephonetextfield').show();
                    Ext.getCmp('relationtextfield').show();

                    //Convert the json response string to an object
                    var infoObject = Ext.JSON.decode(info); //eval('('+info+')');

                    //Set the textfield values
                    loader.getTarget().form.setValues([{
                        id: 'contactfirstnametextfield',
                        value: infoObject['fname']
                    }, {
                        id: 'contactlastnametextfield',
                        value: infoObject['lname']
                    }, {
                        id: 'housephonetextfield',
                        value: infoObject['housePhone']
                    }, {
                        id: 'relationtextfield',
                        value: infoObject['relation']
                    }])
                } else {

                    if (data.SharedData.tempId == 999) {
                        //999 used to indicate grid navigation buttons have been used, so clear the contact info.
                        //This prevents the previous selected employee's info from being displayed when navigating through employee list.
                        loader.getTarget().body.applyStyles('background-image:url(data/pictures/e7logo.png);background-repeat:no-repeat;background-position:center;');
                    } else {
                        //Contact not found
                        loader.getTarget().body.applyStyles('background-image:url(data/pictures/e7logo.png);background-repeat:no-repeat;background-position:center;');
                        Ext.MessageBox.alert('Missing Information', 'Emergency contact is not in the database.  Please contact database administrator.');

                    }
                }
            },

            //Add listener to textfields to detect changes in textfield values
            callback: function () {
                //Loop through the textfield items
                Ext.each(this.getTarget().items.items, function (item, index) {                  
                    data.SharedData.originalValuesEmergencyContact[index] = item.getValue()
                    //Add listener
                    item.addListener('change', function () {
                        //Set the submitValue to true if a change detected in textfield
                        item.submitValue = true;
                        Ext.getCmp('cancelButton').enable();
                    })
                })

            },

            failure: function (loader, response) {
                //Ajax request failed
                if (response.status != 200) {
                    Ext.Msg.alert('Failure', response.statusText);
                }
            }
        },

        listeners: {
            //When the Emergency Contact tab is selected set the tempId of selected employee and make request for emergency contact info
            activate: function (tab) {
                if (data.SharedData.addNewEmployee != 1 && data.SharedData.tempId != '' && data.SharedData.tempIdCheck != data.SharedData.tempId) {
                    data.SharedData.tempIdCheck = data.SharedData.tempId
                    tab.loader.load({
                        params: {
                            //The alphabetic Id of selected employee
                            rid: data.SharedData.tempId
                        }
                    });
                }
            }
        }
    }]
});