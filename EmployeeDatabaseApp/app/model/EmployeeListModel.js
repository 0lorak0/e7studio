    /*
    file: EmployeeListModel.js
    author: Karol Sanchez
    description: Defines the model employee list grid.
    */
    Ext.define('CXP.model.EmployeeListModel', {
        extend: 'Ext.data.Model',
        fields: ['lname', 'fname', 'id_alpha']
    });