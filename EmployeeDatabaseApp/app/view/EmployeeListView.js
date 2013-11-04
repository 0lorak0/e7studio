/*
    file: EmployeeListView.js
    author: Karol Sanchez
    description: Defines the grid used to display the names of all of the employees.
    */
//contains variables to be used for employee seletion and grid navigation.   
Ext.require('data.SharedData')

Ext.define('CXP.view.EmployeeListView', {
    extend: 'Ext.grid.Panel',
    id: 'nameGrid',
    alias: 'widget.namelist',
    title: 'Employee List',
    store: 'EmployeeListStore',
    hidden: true,
    columns: [{
        text: 'First',
        dataIndex: 'fname',
        flex: 1
    }, {
        text: 'Last',
        dataIndex: 'lname',
        flex: 1
    }],
    //define buttons used to step through employee list
    bbar: {
        items: [{
            xtype: 'button',
            text: 'Add New Employee',
            id: 'addNewEmployeeButton',
            disabled: true,
            hidden: true,
            action: 'addnew',
            enableToggle: true
        }, {
            xtype: 'tbfill'
        }, {
            xtype: 'button',
            text: '<',
            id: 'backButton',
            disabled: true,
            action: 'backward'
        }, {
            xtype: 'button',
            text: '>',
            id: 'forwardButton',
            action: 'forward'
        }]
    }
});