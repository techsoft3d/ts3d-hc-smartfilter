import { dummy } from './tabulator_esm.min.js';

import { SQueryEditor } from './SQueryEditor.js';

export class SQueryManagerUI {

    static _updatedCallback = null;

    static _showButtonRow = true;

    static initialize(div, manager, showImportExportButtons) {
        SQueryManagerUI._manager =  manager;
        SQueryManagerUI._viewer = manager._viewer;

        SQueryManagerUI._table = null;
        SQueryManagerUI._uidiv = div;

        if (SQueryManagerUI._showButtonRow) {

            $("#" + SQueryManagerUI._uidiv).append('<button class="SQuerySearchButton" id="SQueryManagerAddCurrentFilter" type="button" style="top:2px">Add</button>');
            $("#" + SQueryManagerUI._uidiv).append('<button class="SQuerySearchButton" id="SQueryManagerExecute" type="button" style="top:2px;margin-left:2px;">Execute</button>');
            if (showImportExportButtons) {
                $("#" + SQueryManagerUI._uidiv).append('<button class="SQuerySearchButton" id="SQueryManagerExport" type="button" style="position:absolute;right:0px;top:2px">Export</button>');
                $("#" + SQueryManagerUI._uidiv).append('<button class="SQuerySearchButton" id="SQueryManagerUpload" type="button" style="position:absolute;right:52px;top:2px">Load</button><input style="display:none" type="file" id="inputupload">');

                $("#SQueryManagerExport").click(function () { SQueryManagerUI.exportToFile("squeryfilters.json"); });

                $("#SQueryManagerUpload").click(function (e) {
                    e.preventDefault();
                    $("#inputupload").trigger('click');
                });

                $("#inputupload").change(function () {

                    let files = $('#inputupload')[0].files;
                    // Check file selected or not
                    if (files.length > 0) {
                        SQueryManagerUI.load(files[0]);
                    }
                });
            }

            $("#SQueryManagerAddCurrentFilter").click(function () { SQueryManagerUI._addCurrentFilter(); });
            $("#SQueryManagerExecute").click(function () { SQueryManagerUI._executeAllFilters(); });
        }

        $("#" + this._uidiv).append('<div id="' + SQueryManagerUI._uidiv + 'Tabulator" class = "SQueryManagerTabulator"></div>');

        SQueryManagerUI.refreshUI();
    }

    static setUpdatedCallback(callback) {
        SQueryManagerUI._updatedCallback = callback;
    }

    static async load(file) {
        let reader = new FileReader();
        let _this = this;
        reader.onload = (function (theFile) {
            return async function (e) {
                // Render thumbnail.
                let res = JSON.parse(e.target.result);
                SQueryManagerUI._manager.fromJSON(res);
                SQueryManagerUI.refreshUI();
            };
        })(file);

        // Read in the image file as a data URL.
        reader.readAsText(file);
    }
    
    static _generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static async _executeAllFilters() {
        SQueryManagerUI._manager.executeSQueries();
    }

    static async _addCurrentFilter() {
        SQueryEditor.updateFilterFromUI();
        let filter = SQueryEditor.getFilter();
        let jfilter = filter.toJSON();

        let sf = new hcSQuery.SQuery(SQueryManagerUI._manager);

        sf.fromJSON(jfilter);
        
        sf._id =  SQueryManagerUI._generateGUID();
        sf.setName("");
        SQueryManagerUI._manager.addSQuery(sf, false);
        

        let prop = {};
        prop.id = sf._id;
        prop.description = sf.getName();
        await SQueryManagerUI._table.addRow(prop);

        if (SQueryManagerUI._updatedCallback) {
            SQueryManagerUI._updatedCallback();
        }
    }

    static formatTooltip(e,cell) {
        let id = cell.getData().id
        let SQuery = SQueryManagerUI._manager.getSQueryByID(id);
        return SQuery.generateString();        

    }

    static editCheck(cell){
        return SQueryManagerUI._editable;
    }
    static async refreshUI() {

        if (!SQueryManagerUI._table) {

            let rowMenu = [               
                {
                    label: "<i class='fas fa-user'></i> Select",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.selectAll();
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Isolate",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.isolateAll();
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Show",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.makeVisible(true);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Hide",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.makeVisible(false);
                    }
                },
                {
                    separator:true,
                },
                {
                    label: "<i class='fas fa-user'></i> Red",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.colorize(new Communicator.Color(255,0,0));
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Green",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.colorize(new Communicator.Color(0,255,0));
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Blue",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.colorize(new Communicator.Color(0,0,255));
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Yellow",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.colorize(new Communicator.Color(255,255,0));
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Grey",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.colorize(new Communicator.Color(128,128,128));
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Transparent",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.setOpacity(0.7);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Opaque",
                    action: async function (e, row) {
                        await SQueryManagerUI._updateEditor(row.getData().id);
                        await SQueryEditor.search();
                        SQueryEditor.setOpacity(1.0);
                    }
                },
                {
                    separator:true,
                },
                {
                    label: "<i class='fas fa-user'></i> View",
                    action: async function (e, row) {

                        let data = row.getData();
                        let SQuery = SQueryManagerUI._manager.getSQueryByID(data.id);
                        let filterjson = SQuery.toJSON();
                
                        let editorfilter = SQueryEditor.getFilter();
                        editorfilter.fromJSON(filterjson);                
                        SQueryEditor.clearSearchResults();                
                        await SQueryEditor.refreshUI();               
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Edit Name",
                    action: async function (e, row) {
                        SQueryManagerUI._editable = true;
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Update",
                    action: async function (e, row) {
                        SQueryManagerUI._handleSQueryUpdate(row);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Delete",
                    action: async function (e, row) {
                        SQueryManagerUI._manager.removeSQuery(row.getData().id);
                        row.delete();
                        if (SQueryManagerUI._updatedCallback) {
                            SQueryManagerUI._updatedCallback();
                        }
                    }
                },
            ];
           

            SQueryManagerUI._table = new Tabulator("#" + SQueryManagerUI._uidiv + "Tabulator", {
                data: [],                             
                selectable:0,
                movableRows: true,
                layout: "fitColumns",
                rowContextMenu: rowMenu,
                columns: [                                   
                    {
                        title: "Name", field: "description", formatter:"textarea", editor:"input",editable: SQueryManagerUI.editCheck,tooltip:SQueryManagerUI.formatTooltip
                    },  
                    {
                        title: "ID", field: "id", width: 20, visible: false
                    },
                    {title:"Action", field:"action", editor:"list", width:70,formatter:function(cell, formatterParams, onRendered){
                        //cell - the cell component
                        //formatterParams - parameters set for the column
                        //onRendered - function to call when the formatter has been rendered
                        
                        if (cell.getValue() == undefined) {
                            return cell.getValue();
                        }
                        else {
                            switch(cell.getValue()) {
                                case "red":
                                    return '<div style="background:red;color:red;width:100%;height:calc(100% - 4px);margin-bottom:3px"></div>';
                                break;
                                case "green":
                                    return '<div style="background:green;color:green;width:100%;height:calc(100% - 4px);margin-bottom:3px"></div>';
                                break;
                                case "blue":
                                    return '<div style="background:blue;color:blue;width:100%;height:calc(100% - 4px);margin-bottom:3px"></div>';
                                break;
                                case "yellow":
                                    return '<div style="background:yellow;color:yellow;width:100%;height:calc(100% - 4px);margin-bottom:3px"></div>';
                                break;
                                case "grey":
                                    return '<div style="background:grey;color:grey;width:100%;height:calc(100% - 4px);margin-bottom:3px"></div>';
                                break;
                                default:
                                    return cell.getValue();
                            }
                        }
                    },
                     editorParams:{values:["","Isolate","Hide","Select","red", "green", "blue", "yellow", "grey", "Transparent"],
                
                    itemFormatter:function (label, value, item, element){
                        //label - the text lable for the item
                        //value - the value for the item
                        //item - the original value object for the item
                        //element - the DOM element for the item
                
                        //return the initial label as a bold line and then second line in regular font weight containing the value of the custom "subtitle" prop set on the value item object.
                        switch(value) {
                            case "red":
                                return '<span style="background:red;color:red">XXXXXXXXX</span>';
                            break;
                            case "green":
                                return '<span style="background:green;color:green">XXXXXXXXX</span>';
                            break;
                            case "blue":
                                return '<span style="background:blue;color:blue">XXXXXXXXX</span>';
                            break;
                            case "yellow":
                                return '<span style="background:yellow;color:yellow">XXXXXXXXX</span>';
                            break;
                            case "grey":
                                return '<span style="background:grey;color:grey">XXXXXXXXX</span>';
                            break;
                            case "":
                                return 'None';
                            break;
                            default:
                                return value;
                        };
                    }
                    }},

                    {title:"Prop", field:"prop", width:70,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true,
                    editorParams:{
                       
                        tristate:false,
                      
                    }},


                ],
            });

            SQueryManagerUI._table.on("rowClick", async function (e, row) {
                let data = row.getData();
                let SQuery = SQueryManagerUI._manager.getSQueryByID(data.id);

                let filterjson = SQuery.toJSON();
                let editorfilter = SQueryEditor.getFilter();
                editorfilter.fromJSON(filterjson);
                SQueryEditor.clearSearchResults();                
                await SQueryEditor.refreshUI();                
                if (SQuery.getAction() == "") {
                    await SQueryEditor.search();
                }       
                else {
                    await SQueryEditor.search(true);
                }         
            });

            SQueryManagerUI._table.on("rowDblClick", function(e, row){
                SQueryManagerUI._editable = true;                
            });

            SQueryManagerUI._table.on("rowMoved", function(row){

                let rows = SQueryManagerUI._table.getRows();
                let neworder = [];
                for (let i=0;i<rows.length;i++) {
                    let data = rows[i].getData();
                    neworder.push(SQueryManagerUI._manager.getSQueryByID(data.id));
                }
                SQueryManagerUI._manager.setSQueries(neworder);
            });
        

            SQueryManagerUI._table.on("cellEdited", function (cell) {
                if (cell.getField() == "description") {
                    SQueryManagerUI._handleSQueryNameEdit(cell.getRow());
                    SQueryManagerUI._editable = false;
                }
                else if (cell.getField() == "prop") {                
                    SQueryManagerUI._handleSQueryIsPropEdit(cell.getRow());
                }
                else {
                    SQueryManagerUI._handleSQueryIsActionEdit(cell.getRow());

                }
                SQueryManagerUI._table.redraw();
            });
        }
        else {
            await SQueryManagerUI._table.clearData();
        }

        for (let i=0;i<SQueryManagerUI._manager.getSQueryNum();i++) {
            let filter = SQueryManagerUI._manager.getSQuery(i);
            
            let text;
            if (filter.getName() == "")
            {
                text = filter.generateString();
            }
            else
            {
                text = filter.getName();
            }
            
            let prop = {};
            text = text.replace(/&quot;/g, '"');
            prop.id =  SQueryManagerUI._manager.getSQueryID(i);;
            prop.description = text;
            prop.action = filter.getAction();
            prop.prop = SQueryManagerUI._manager.getSQuery(i).getProp();
            await SQueryManagerUI._table.addRow(prop);
        }     
    }

    static async _updateEditor(id) {
        
        let SQuery = SQueryManagerUI._manager.getSQueryByID(id);
        let filterjson = SQuery.toJSON();
        let editorfilter = SQueryEditor.getFilter();
        editorfilter.fromJSON(filterjson);
        await SQueryEditor.refreshUI();

    }

    static async _handleSQueryNameEdit(row) {

        let data = row.getData();
        let SQuery = SQueryManagerUI._manager.getSQueryByID(data.id);
        SQuery.setName(data.description);
        if (data.description == "")
        {
            row.update({description:SQuery.getName()});
        }
        if (SQueryManagerUI._updatedCallback) {
            SQueryManagerUI._updatedCallback();
        }

    }

    static async _handleSQueryIsPropEdit(row) {
        let data = row.getData();
        SQueryManagerUI._manager.updateSQueryIsProp(data.id,data.prop);
        if (SQueryManagerUI._updatedCallback) {
            SQueryManagerUI._updatedCallback();
        }
    }


    static async _handleSQueryIsActionEdit(row) {
        let data = row.getData();
        let SQuery = SQueryManagerUI._manager.getSQueryByID(data.id);
        SQuery.setAction(data.action);
        if (SQueryManagerUI._updatedCallback) {
            SQueryManagerUI._updatedCallback();
        }
    }

    static _handleSQueryUpdate(row) {
        let data = row.getData();
        let SQuery = SQueryManagerUI._manager.getSQueryByID(data.id);

        SQueryEditor.updateFilterFromUI();
        let filter = SQueryEditor.getFilter();
        let jfilter = filter.toJSON();

        let sf = new hcSQuery.SQuery(SQueryManagerUI._manager);
        sf.fromJSON(jfilter);
        SQuery.updateConditions(sf._conditions);
        SQuery.setName("");
       
        row.update({description:SQuery.getName()});
        
        if (SQueryManagerUI._updatedCallback) {
            SQueryManagerUI._updatedCallback();
        }
    }

    static exportToFile(filename) {

        function _makeTextFile(text) {
            let data = new Blob([text], {type: 'text/plain'});           
            let textFile = window.URL.createObjectURL(data);
        
            return textFile;
          }

        let text = JSON.stringify(SQueryManagerUI._manager.toJSON());

        let link = document.createElement('a');
        link.setAttribute('download', filename);
        link.href = _makeTextFile(text);
        document.body.appendChild(link);

        window.requestAnimationFrame(function () {
            let event = new MouseEvent('click');
            link.dispatchEvent(event);
            document.body.removeChild(link);
        });
    }              
}
