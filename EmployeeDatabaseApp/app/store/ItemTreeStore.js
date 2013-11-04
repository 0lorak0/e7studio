    /*
    file: ItemTreeStore.js
    author: Karol Sanchez
    description: Defines the nodes for the info items tree.
    */
    Ext.define('CXP.store.ItemTreeStore', {
        extend: 'Ext.data.TreeStore',
        root: {
            expanded: true,
            children: [{
                text: 'Name',
                id: 'nametree',
                leaf: true,
                checked: false
            }, {
                text: 'Birthday',
                id: 'birthdaytree',
                leaf: true,
                checked: false
            }, {
                text: 'Address',
                id: 'addresstree',
                name: 'addressfolder',
                checked: false,
                expanded: true,
                children: [{
                    text: 'Street',
                    id: 'streettree',
                    leaf: true,
                    checked: false
                }, {
                    text: 'City',
                    id: 'citytree',
                    leaf: true,
                    checked: false
                }, {
                    text: 'State',
                    id: 'statetree',
                    leaf: true,
                    checked: false
                }, {
                    text: 'Zip',
                    id: 'ziptree',
                    leaf: true,
                    checked: false
                }]
            }]
        }
    });