    /*
    file: EmployeeListStore.js
    author: Karol Sanchez
    description: Makes AJAX request to getUserIds.php which reads the file guserIDs.xml; it contains 
                all of the employee names and translation IDs. 
    */

Ext.define('CXP.store.EmployeeListStore',{
    extend:'Ext.data.Store',
    model:'CXP.model.EmployeeListModel',
    autoLoad:false,
    proxy:{
        type:'ajax',
        actionMethods:'POST',
        params:{
            //current position in employee list
            p:'0', 
            n:'0', 
            d:'0'
        },
        url:'../CensusSQL/php/getUserIds.php',
        reader:{
            type:'json'
        }
    }
});