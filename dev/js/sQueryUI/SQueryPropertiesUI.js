import { dummy } from './tabulator_esm.min.js';

export class SQueryPropertiesUI {

    static initialize(div, manager) {
        SQueryPropertiesUI._table = null;
        SQueryPropertiesUI._manager = manager;
        SQueryPropertiesUI._viewer =  manager._viewer;
        SQueryPropertiesUI._uidiv = div;

        SQueryPropertiesUI._viewer.setCallbacks({
            selectionArray: function (selarray, removed) {
                SQueryPropertiesUI._itemSelected();
            },
        });

        $("#" + this._uidiv).append('<div id="' + SQueryPropertiesUI._uidiv + 'Tabulator" class="squeryPropertiesTabulator"></div>');
        SQueryPropertiesUI._refreshUI();
    }



    static async _refreshUI() {

        if (!SQueryPropertiesUI._table) {
            SQueryPropertiesUI._table = new Tabulator("#" + SQueryPropertiesUI._uidiv + "Tabulator", {
                data: [],                 
                dataTree: true,
                dataTreeStartExpanded: false,            
                selectable:1,
                layout: "fitColumns",
                columns: [                                   
                    {
                        title: "Name", field: "name"
                    },
                    {
                        title: "Value", field: "value"
                    },
                    {
                        title: "ID", field: "id", width: 20, visible: false
                    },

                ],
            });


        }
        else
            await SQueryPropertiesUI._table.clearData();

    }

    static async _itemSelected()
    {

        let selarray = SQueryPropertiesUI._viewer.selectionManager.getResults();
        
        await SQueryPropertiesUI._table.clearData();

        if (selarray.length > 0) {
            let nodeid = selarray[0].getNodeId();

            let foundProperties = await SQueryPropertiesUI._manager.evaluateProperties(nodeid);
            let ii=0;
            for (let i = 0; i < foundProperties.length; i++) {
                let propsOnNode = foundProperties[i].properties;
                if (propsOnNode.length==0)
                {
                    let prop = {};
                    prop.id = ii++;
                    prop.name = foundProperties[i].name;
                    prop.value = "true";
                    await SQueryPropertiesUI._table.addRow(prop);
                }
                else if (propsOnNode.length==1)
                {
                    let prop = {};
                    prop.id = ii++;
                    prop.name = foundProperties[i].name;
                    prop.value = propsOnNode[0].name + ":" + propsOnNode[0].value;
                    await SQueryPropertiesUI._table.addRow(prop);
                }
                else
                {
                    let prop = {};
                    prop.id = ii++;
                    prop.name = foundProperties[i].name;

                    let props = [];

                    for (let j=0;j<propsOnNode.length;j++)
                    {
                        let prop = {};
                        prop.id = ii++;
                        prop.name = propsOnNode[j].name;
                        prop.value = propsOnNode[j].value;
                        props.push(prop);
                    }                
                    prop._children = props;
                    await SQueryPropertiesUI._table.addRow(prop);
                }
            }

        }
    }

}
