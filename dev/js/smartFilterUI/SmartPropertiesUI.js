import { dummy } from './tabulator_esm.min.js';



export class SmartPropertiesUI {

    static initialize(div, viewer) {
        SmartPropertiesUI._table = null;
        SmartPropertiesUI._viewer = viewer;
        SmartPropertiesUI._uidiv = div;

        viewer.setCallbacks({
            selectionArray: function (selarray, removed) {
                SmartPropertiesUI._itemSelected();
            },
        });

        $("#" + this._uidiv).append('<div id="' + SmartPropertiesUI._uidiv + 'Tabulator" class="smartPropertiesTabulator"></div>');
        SmartPropertiesUI._refreshUI();
    }



    static async _refreshUI() {

        if (!SmartPropertiesUI._table) {
            SmartPropertiesUI._table = new Tabulator("#" + SmartPropertiesUI._uidiv + "Tabulator", {
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
            await SmartPropertiesUI._table.clearData();

    }

    static async _itemSelected()
    {

        let selarray = SmartPropertiesUI._viewer.selectionManager.getResults();
        
        await SmartPropertiesUI._table.clearData();

        if (selarray.length > 0) {
            let nodeid = selarray[0].getNodeId();

            let foundProperties = await hcSmartFilter.SmartFilterManager.evaluateProperties(nodeid);
            let ii=0;
            for (let i = 0; i < foundProperties.length; i++) {
                let propsOnNode = foundProperties[i].properties;
                if (propsOnNode.length==0)
                {
                    let prop = {};
                    prop.id = ii++;
                    prop.name = foundProperties[i].name;
                    prop.value = "true";
                    await SmartPropertiesUI._table.addRow(prop);
                }
                else if (propsOnNode.length==1)
                {
                    let prop = {};
                    prop.id = ii++;
                    prop.name = foundProperties[i].name;
                    prop.value = propsOnNode[0].name + ":" + propsOnNode[0].value;
                    await SmartPropertiesUI._table.addRow(prop);
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
                    await SmartPropertiesUI._table.addRow(prop);
                }
            }

        }
    }

}
