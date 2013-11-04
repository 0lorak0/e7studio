    /*
    file: UserLoginController.js
    author: Karol Sanchez
    description: Listens for events associated with the user login window.
    */
    Ext.define('CXP.controller.UserLoginController', {
        extend: 'Ext.app.Controller',
        views: 'UserLoginView',
        refs: [{
            ref: 'employeeList',
            selector: 'gridpanel'
        }, {
            ref: 'treeTree',
            selector: 'treepanel'
        }],

        init: function () {
            this.control({
                'loginwindow button[action=verify]': {
                    click: this.loginUser
                },

                'loginwindow [name=passwordTextfield]': {
                    specialkey: this.pressEnter
                },

                'loginwindow [name=nameTextfield]': {
                    specialkey: this.pressEnter
                }
            })
        },

        //makes AJAX request to verify the login information
        loginUser: function () {
            var w = Ext.getCmp('loginForm')
            w.submit({
                method: 'POST',
                waitTitle: 'Connecting...',
                waitMsg: 'Authorizing. Please wait...',
                success: function (form, action) {
                    //user authorized successfully                                  
                    //close login window
                    Ext.getCmp('loginuser').close();

                    //set numUsers count
                    var obj = Ext.JSON.decode(action.response.responseText);
                    data.SharedData.numUsers = obj.count;

                    //remove the image from the main panel
                    Ext.getCmp('mainPanel').body.applyStyles('background-image:none');

                    // load the list of employee names
                    Ext.getCmp('nameGrid').getStore('EmployeeListStore').load({
                        //post the number of users in database
                        params: {
                            n: data.SharedData.numUsers,
                            d: data.SharedData.displayAmount
                        }
                    });

                    //show the tree and grid panels         
                    Ext.getCmp('treeId').setVisible(true);
                    Ext.getCmp('nameGrid').setVisible(true);

                    //Detect whether user has admin priveleges
                    if (obj.isAdmin == 1) {
                        data.SharedData.isAdmin = 1;
                        //user is administrator, enable editing priveleges by showing Edit option
                        Ext.getCmp('editCheck').show();
                        Ext.getCmp('addNewEmployeeButton').setVisible(true);
                        Ext.getCmp('addNewEmployeeButton').enable();
                    }

                   //grab the logout button
                   var logoutButton = Ext.getCmp('mainPanel').getDockedItems()[0].items.items[2];     
                   
                   //update the button text with user name
                   logoutButton.update('Logout ' + form.getFieldValues()['nameTextfield']);
                   
                   //adjust the position of the button
                   //grab the panel's right-side pixel position
                   var panelRight = Ext.getCmp('mainPanel').getEl().getRight();
                   
                   //grab the button's right-side pixel position
                   var buttonRight = logoutButton.getEl().getRight();
                   
                   //the margin to move the button by
                   var buttonMargin = buttonRight - panelRight;
                   
                   //apply the margin
                   logoutButton.getEl().applyStyles('text-align:center;font-size:10px;margin-left:-' + buttonMargin + 'px;');
                   
                   //show the button
                   logoutButton.show();
                   
                },

                //authorization failed!
                failure: function (form, action) {
                    if (action.response != undefined) {
                        var obj = Ext.JSON.decode(action.response.responseText);
                        Ext.Msg.alert('Login Failed', obj.errors.reason);
                        form.reset();
                    }
                }
            });
        },

        //on ENTER key press, submit the form
        pressEnter: function (f, e) {
            if (e.getKey() == e.ENTER) {
                this.loginUser();
            }
        }
    });