export class SmartSearchPropertiesUI {

    static initialize(div, manager) {
        SmartSearchPropertiesUI._table = null;
        SmartSearchPropertiesUI._manager = manager;
        SmartSearchPropertiesUI._viewer =  manager._viewer;
        SmartSearchPropertiesUI._uidiv = div;

        SmartSearchPropertiesUI._viewer.setCallbacks({
            selectionArray: function (selarray, removed) {
                SmartSearchPropertiesUI._itemSelected();
            },
        });

        $("#" + this._uidiv).append('<div id="' + SmartSearchPropertiesUI._uidiv + 'Tabulator" class="SmartSearchPropertiesTabulator"></div>');
        SmartSearchPropertiesUI._refreshUI();
    }



    static async _refreshUI() {

        if (!SmartSearchPropertiesUI._table) {
            SmartSearchPropertiesUI._table = new Tabulator("#" + SmartSearchPropertiesUI._uidiv + "Tabulator", {
                data: [],                 
                dataTree: true,
                dataTreeStartExpanded: true,            
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
            await SmartSearchPropertiesUI._table.clearData();

    }

    static async _itemSelected()
    {

        let selarray = SmartSearchPropertiesUI._viewer.selectionManager.getResults();
        
        await SmartSearchPropertiesUI._table.clearData();

        if (selarray.length > 0) {
            let nodeid = selarray[0].getNodeId();

            let foundProperties = await SmartSearchPropertiesUI._manager.evaluateProperties(nodeid);
            let ii=0;
            for (let i = 0; i < foundProperties.length; i++) {
                let propsOnNode = foundProperties[i].properties;
                if (propsOnNode.length==0)
                {
                    let prop = {};
                    prop.id = ii++;
                    prop.name = foundProperties[i].name;
                    prop.value = "true";
                    await SmartSearchPropertiesUI._table.addRow(prop);
                }
                else if (propsOnNode.length==1)
                {
                    let prop = {};
                    prop.id = ii++;
                    prop.name = foundProperties[i].name;
                    prop.value = propsOnNode[0].name + ":" + propsOnNode[0].value;
                    await SmartSearchPropertiesUI._table.addRow(prop);
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
                    await SmartSearchPropertiesUI._table.addRow(prop);
                }
            }

        }
    }

}
