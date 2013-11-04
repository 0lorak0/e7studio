    /*
    file: ItemTreeView.js
    author: Karol Sanchez
    description: Defines the tree used to select which employee information to display.
    */

Ext.define('CXP.view.ItemTreeView',{
    extend: 'Ext.tree.Panel',
    id:'treeId',
    name:'infotree',
    alias:'widget.itemtree',
    title:'Information Tree',
    store: 'ItemTreeStore',
    hidden:true,
    bodyPadding:'2px',
    dockedItems:[{
        //define button used to toggle all of the info items
        xtype:'toolbar',
        dock: 'bottom',
        items:{
            text:'Check All Items',
            id:'toggleButton',
            name:'toggleButton',
            enableToggle:true
        }
    }]
});

