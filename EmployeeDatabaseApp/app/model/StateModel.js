    /*
    file: EmployeeListModel.js
    author: Karol Sanchez
    description: Defines the model employee list grid.
    */
    Ext.define('CXP.model.StateModel', {
        extend: 'Ext.data.Model',
        fields: [{
            type: 'string',
            name: 'abbr'
        }, {
            type: 'string',
            name: 'name'
        }]
    });