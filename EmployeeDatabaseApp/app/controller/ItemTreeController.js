    /*
    file: ItemTreeController.js
    author: Karol Sanchez
    description: Define the functions associated with the info item tree events.
    */
    Ext.require('data.SharedData')
    Ext.define('CXP.controller.ItemTreeController', {
        extend: 'Ext.app.Controller',
        stores: 'ItemTreeStore',
        views: 'ItemTreeView',
        refs: [{
            ref: 'loadedView',
            selector: 'treepanel'
        }],

        init: function () {
            this.control({
                //executes every time and item is checked
                'viewport > panel > container > itemtree': {
                    checkchange: this.makeChildrenChecked
                },

                //button to check or uncheck all info items at once
                'itemtree [name="toggleButton"]': {
                    toggle: this.toggleAllItems
                }
            });
        },

        //check the children of Address root node or check/uncheck Address node
        makeChildrenChecked: function (node, checked) {

            //last item selected
            var item_checked = this.getLoadedView().getSelectionModel().lastSelected;

            if (item_checked.childNodes.length > 0) {

                //the node is a parent node(Address) so check all its children
                this.getLoadedView().getStore().getNodeById(item_checked.internalId).cascadeBy(function (n) {
                    n.set('checked', checked);
                });
            } else if (item_checked.getDepth() == 2) {

                //the node is a child of Address node
                //number of Address nodes children that are checked
                var numItems = 0;
                Ext.each(this.getLoadedView().getStore().getNodeById('addresstree').childNodes, function (obj) {

                    //loop through Address children nodes
                    if (obj.data.checked == true) {

                        //the child node is checked
                        numItems += 1;
                    }
                });
                if (this.getLoadedView().getStore().getNodeById('addresstree').data.checked == false && numItems == 1) {

                    //Address box is not checked so check it
                    this.getLoadedView().getStore().getNodeById('addresstree').set('checked', checked);
                } else if (this.getLoadedView().getStore().getNodeById('addresstree').data.checked == true && numItems == 0) {

                    //Address box is checked and no more children are checked so uncheck it
                    this.getLoadedView().getStore().getNodeById('addresstree').set('checked', checked);
                }
            }
        },

        //toggle all the checkboxes for all the info items at once
        toggleAllItems: function (node, checked) {

            //cascade check/uncheck property
            this.getLoadedView().getStore().getRootNode().cascadeBy(function (n) {
                n.set('checked', checked)

            })

            //modify text of toggle button
            if (this.getLoadedView().getChecked().length == 8) {
                this.getLoadedView().down('toolbar').down('button').setText('Uncheck All Items')
            } else {
                this.getLoadedView().down('toolbar').down('button').setText('Check All Items')
            }
        }
    });