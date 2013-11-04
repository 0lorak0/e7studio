/*
    file: EmployeeFormModel.js
    author: Karol Sanchez
    description: Defines the model for the selected employees personal information.
    */
Ext.define('CXP.model.EmployeeFormModel', {
    extend: 'Ext.data.Model',
    fields: ['name', 'bday', 'street', 'city', 'statestate', 'zip']
});