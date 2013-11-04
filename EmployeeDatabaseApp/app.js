/* 
    file: app.js
    author: Karol Sanchez
    description: Contains the global settings for the application and maintains references to all models, views and controllers.
    */

Ext.Loader.setConfig({
    enabled:true
});

//load these files before the app starts running
Ext.require(['Ext.container.Viewport'])

//Create new instance of Application class
Ext.application({
    name:'CXP', 
    appFolder:'app', 
    controllers:['EmployeeListController','ItemTreeController', 'UserLoginController', 'EmployeeEditController'],
    models:['EmployeeListModel','EmployeeFormModel', 'StateModel'],
    views:['EmployeeListView','ItemTreeView','EmployeeFormView','UserLoginView'],
    
    //launch this function at load
    launch: function(){       
        
        //Initializing the viewport
        Ext.create('Ext.container.Viewport',{
            layout: {
                type:'vbox',
                align:'center', 
                autoSize:true
            },
            autoScroll:true,
            items: [{
                width:590,
                height:513,
                margin:'60px 0 30px 0',
                xtype:'panel', 
                id:'mainPanel',  
                html: '<font style="font-size: 12px;">Welcome to the e7 Employee Database! Please select at least one item from the Information Tree and one name from the Employee List to view the selected employee\'s personal information.</font><hr style="border-style:solid" />',
                bodyStyle:'background:#edf4fd;background-image:url(data/pictures/e7logo_50percentTrans.png);background-repeat:no-repeat;background-position:center;',
                bodyPadding:'5px',
                title:'<font style="font-size: 14px;">e7 Employee Database</font>',
                tools:[{
                        //logout button
                        xtype: 'button',
                        id:'logoutButton',
                        text: 'Logout',
                        hidden:true,
                        handler:function(){
                            window.location.href = window.location.href
                        }
                }],
                layout:{
                    type:'column'
                },
                items:[{
                    xtype:'container',
                    id:'infoChoose',
                    align:'center',
                    width:578,
                    autoHeight: true,
                    columnWidth: 1,
                    items:[{
                        //tree panel with info items   
                        xtype:'itemtree',
                        rootVisible:false,
                        height: 200,
                        margin:'0 0 7px 0',
                        autoWidth:true
                    },{
                        //selected employee information panel
                        xtype:'namelist',
                        height: 225,
                        autoWidth:true
                    }]
                },{
                    //employee list grid
                    xtype:'infopanel',  
                    width:310,
                    height: 432
                }]
            }]
        });
               
        //create and show the login window
        this.getView('UserLoginView').create();
    }
    
});
