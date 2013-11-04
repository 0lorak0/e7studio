/*
    file: EmployeeFormStore.js
    author: Karol Sanchez
    description: Makes AJAX request to getUserIdInfo.php which queries SQL Server idInfo database; it contains the personal information
                 for the selected employee.
    */
Ext.define('CXP.store.EmployeeFormStore', {
    extend: 'Ext.data.Store',
    model: 'CXP.model.EmployeeFormModel',
    autoLoad: false,
    proxy: {
        type: 'ajax',
        actionMethods: 'POST',
        url: '../CensusSQL/php/getUserIdInfo.php',
        reader: {
            type: 'json'
        }
    }
});