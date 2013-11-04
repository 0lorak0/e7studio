    /*
    file: UserLoginView.js
    author: Karol Sanchez
    description: Defines the user login window.
    */
    Ext.define('CXP.view.UserLoginView', {
        extend: 'Ext.window.Window',
        alias: 'widget.loginwindow',
        id: 'loginuser',
        title: 'User Login',
        modal: true,
        closable: false,
        maximizable: false,
        minimizable: false,
        resizable: false,
        width: 285,
        height: 135,
        autoShow: true,
        items: [{
            xtype: 'form',
            frame: true,
            id: 'loginForm',
            bodyStyle: 'padding:5px',
            url: 'php/verifyUser.php',
            items: [{
                fieldLabel: 'Username',
                xtype: 'textfield',
                name: 'nameTextfield',
                allowBlank: false,
                listeners: {
                    afterrender: function () {
                        this.focus(false, true)
                    }
                }
            }, {
                fieldLabel: 'Password',
                xtype: 'textfield',
                inputType: 'password',
                name: 'passwordTextfield',
                allowBlank: false
            }],
            buttons: [{
                text: 'Login',
                id: 'loginButton',
                action: 'verify'
            }]
        }]
    });