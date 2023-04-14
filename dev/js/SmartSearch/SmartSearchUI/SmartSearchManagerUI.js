import { SmartSearchEditorUI } from './SmartSearchEditorUI.js';

export class SmartSearchManagerUI {

    static _updatedCallback = null;

    static _showButtonRow = true;

    static initialize(div, manager, showImportExportButtons) {
        SmartSearchManagerUI._manager =  manager;
        SmartSearchManagerUI._viewer = manager._viewer;

        SmartSearchManagerUI._table = null;
        SmartSearchManagerUI._uidiv = div;

        if (SmartSearchManagerUI._showButtonRow) {

            $("#" + SmartSearchManagerUI._uidiv).append('<button title = "Add search to SmartSearch Manager" class="SmartSearchSearchButton" id="SmartSearchManagerAddCurrentFilter" type="button" style="top:2px">Add</button>');
            $("#" + SmartSearchManagerUI._uidiv).append('<button title = "Execute all queries" class="SmartSearchSearchButton" id="SmartSearchManagerExecute" type="button" style="top:2px;margin-left:2px;">Execute</button>');
            if (showImportExportButtons) {
                $("#" + SmartSearchManagerUI._uidiv).append('<button class="SmartSearchSearchButton" id="SmartSearchManagerExport" type="button" style="position:absolute;right:0px;top:2px">Export</button>');
                $("#" + SmartSearchManagerUI._uidiv).append('<button class="SmartSearchSearchButton" id="SmartSearchManagerUpload" type="button" style="position:absolute;right:52px;top:2px">Load</button><input style="display:none" type="file" id="inputupload">');

                $("#SmartSearchManagerExport").click(function () { SmartSearchManagerUI.exportToFile("SmartSearchfilters.json"); });

                $("#SmartSearchManagerUpload").click(function (e) {
                    e.preventDefault();
                    $("#inputupload").trigger('click');
                });

                $("#inputupload").change(function () {

                    let files = $('#inputupload')[0].files;
                    // Check file selected or not
                    if (files.length > 0) {
                        SmartSearchManagerUI.load(files[0]);
                    }
                });
            }

            $("#SmartSearchManagerAddCurrentFilter").click(function () { SmartSearchManagerUI._addCurrentFilter(); });
            $("#SmartSearchManagerExecute").click(function () { SmartSearchManagerUI._executeAllFilters(); });
        }

        $("#" + this._uidiv).append('<div id="' + SmartSearchManagerUI._uidiv + 'Tabulator" class = "SmartSearchManagerTabulator"></div>');

        SmartSearchManagerUI.refreshUI();
    }

    static setUpdatedCallback(callback) {
        SmartSearchManagerUI._updatedCallback = callback;
    }

    static async load(file) {
        let reader = new FileReader();
        let _this = this;
        reader.onload = (function (theFile) {
            return async function (e) {
                // Render thumbnail.
                let res = JSON.parse(e.target.result);
                SmartSearchManagerUI._manager.fromJSON(res);
                SmartSearchManagerUI.refreshUI();
            };
        })(file);

        // Read in the image file as a data URL.
        reader.readAsText(file);
    }
    
    static async _executeAllFilters() {
        SmartSearchManagerUI._manager.executeSQueries();
    }

    static async _addCurrentFilter() {
        SmartSearchEditorUI.updateFilterFromUI();
        let filter = SmartSearchEditorUI.getFilter();
        let jfilter = filter.toJSON();

        let sf = new hcSmartSearch.SmartSearch(SmartSearchManagerUI._manager);

        sf.fromJSON(jfilter);
        
        sf._id =  SmartSearchManagerUI._manager.generateGUID();
        sf.setName("");
        SmartSearchManagerUI._manager.addSmartSearch(sf, false);
        

        let prop = {};
        prop.id = sf._id;
        prop.description = sf.getName();
        await SmartSearchManagerUI._table.addRow(prop);

        if (SmartSearchManagerUI._updatedCallback) {
            SmartSearchManagerUI._updatedCallback();
        }
    }

    static formatTooltip(e,cell) {
        let id = cell.getData().id
        let SmartSearch = SmartSearchManagerUI._manager.getSmartSearchByID(id);
        return SmartSearch.generateString();        

    }

    static editCheck(cell){
        return SmartSearchManagerUI._editable;
    }
    static async refreshUI() {

        if (!SmartSearchManagerUI._table) {

            let rowMenu = [               
                {
                    label: "<i class='fas fa-user'></i> Select",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.selectAll();
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Isolate",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.getFoundItems().isolateAll();
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Show",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.getFoundItems().makeVisible(true);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Hide",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.getFoundItems().makeVisible(false);
                    }
                },
                {
                    separator:true,
                },
                {
                    label: "<i class='fas fa-user'></i> Red",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(255,0,0));
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Green",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(0,255,0));
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Blue",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(0,0,255));
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Yellow",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(255,255,0));
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Grey",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(128,128,128));
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Transparent",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.getFoundItems().setOpacity(0.25);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Opaque",
                    action: async function (e, row) {
                        await SmartSearchManagerUI._updateEditor(row.getData().id);
                        await SmartSearchEditorUI.search();
                        SmartSearchEditorUI.getFoundItems().setOpacity(1.0);
                    }
                },
                {
                    separator:true,
                },
                {
                    label: "<i class='fas fa-user'></i> View",
                    action: async function (e, row) {

                        let data = row.getData();
                        let SmartSearch = SmartSearchManagerUI._manager.getSmartSearchByID(data.id);
                        let filterjson = SmartSearch.toJSON();
                
                        let editorfilter = SmartSearchEditorUI.getFilter();
                        editorfilter.fromJSON(filterjson);                
                        SmartSearchEditorUI.clearSearchResults();                
                        await SmartSearchEditorUI.refreshUI();               
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Edit Name",
                    action: async function (e, row) {
                        SmartSearchManagerUI._editable = true;
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Update",
                    action: async function (e, row) {
                        SmartSearchManagerUI._handleSmartSearchUpdate(row);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Delete",
                    action: async function (e, row) {
                        SmartSearchManagerUI._manager.removeSmartSearch(row.getData().id);
                        row.delete();
                        if (SmartSearchManagerUI._updatedCallback) {
                            SmartSearchManagerUI._updatedCallback();
                        }
                    }
                },
            ];

            let actionFormatter = function(cell, formatterParams, onRendered){
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
            };

            let actionItemFormatter = function (label, value, item, element){
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
            };

            let actionValues = ["", "Isolate", "Show", "Hide", "Select", "Auto Color", "red", "green", "blue", "yellow", "grey", "Transparent", "Opaque", "Not Selectable", "Selectable"];
           

            SmartSearchManagerUI._table = new Tabulator("#" + SmartSearchManagerUI._uidiv + "Tabulator", {
                data: [],
                selectable: 0,
                movableRows: true,
                layout: "fitColumns",
                rowContextMenu: rowMenu,
                columns: [
                    {
                        title: "Name", headerSort: false, field: "description", formatter: "textarea", editor: "input", editable: SmartSearchManagerUI.editCheck, tooltip: SmartSearchManagerUI.formatTooltip
                    },
                    {
                        title: "ID", field: "id", width: 20, visible: false
                    },
                    {
                        title: "Action1", headerSort: false, field: "action0", editor: "list", width: 50, formatter: actionFormatter,
                        editorParams: {
                            values: actionValues,
                            itemFormatter: actionItemFormatter
                        }
                    },
                    {
                        title: "Action2", headerSort: false, field: "action1", editor: "list", width: 50, formatter: actionFormatter,
                        editorParams: {
                            values: actionValues,
                            itemFormatter: actionItemFormatter
                        }
                    },
                    {
                        title: "Prop", headerSort: false, field: "prop", width: 50, hozAlign: "center", formatter: "tickCross", sorter: "boolean", editor: true,
                        editorParams: {

                            tristate: false,

                        }
                    }
                ],
            });

            SmartSearchManagerUI._table.on("rowClick", async function (e, row) {
                let data = row.getData();
                let SmartSearch = SmartSearchManagerUI._manager.getSmartSearchByID(data.id);

                let filterjson = SmartSearch.toJSON();
                let editorfilter = SmartSearchEditorUI.getFilter();
                editorfilter.fromJSON(filterjson);
                SmartSearchEditorUI.clearSearchResults();                
                await SmartSearchEditorUI.refreshUI();                
                if (!SmartSearch.hasAction()) {
                    await SmartSearchEditorUI.search();
                }       
                else {
                    await SmartSearchEditorUI.search(true);
                }         
            });

            SmartSearchManagerUI._table.on("rowDblClick", function(e, row){
                SmartSearchManagerUI._editable = true;                
            });

            SmartSearchManagerUI._table.on("rowMoved", function(row){

                let rows = SmartSearchManagerUI._table.getRows();
                let neworder = [];
                for (let i=0;i<rows.length;i++) {
                    let data = rows[i].getData();
                    neworder.push(SmartSearchManagerUI._manager.getSmartSearchByID(data.id));
                }
                SmartSearchManagerUI._manager.setSQueries(neworder);
            });
        

            SmartSearchManagerUI._table.on("cellEdited", function (cell) {
                if (cell.getField() == "description") {
                    SmartSearchManagerUI._handleSmartSearchNameEdit(cell.getRow());
                    SmartSearchManagerUI._editable = false;
                }
                else if (cell.getField() == "prop") {                
                    SmartSearchManagerUI._handleSmartSearchIsPropEdit(cell.getRow());
                }
                else if (cell.getField() == "action0") {           
                    SmartSearchManagerUI._handleSmartSearchIsActionEdit(cell.getRow(),0);
                }
                else if (cell.getField() == "action1") {           
                    SmartSearchManagerUI._handleSmartSearchIsActionEdit(cell.getRow(),1);
                }
                SmartSearchManagerUI._table.redraw();
            });
        }
        else {
            await SmartSearchManagerUI._table.clearData();
        }

        for (let i=0;i<SmartSearchManagerUI._manager.getSmartSearchNum();i++) {
            let filter = SmartSearchManagerUI._manager.getSmartSearch(i);
            
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
            prop.id =  SmartSearchManagerUI._manager.getSmartSearchID(i);;
            prop.description = text;
            prop.action0 = filter.getAction(0);
            prop.action1 = filter.getAction(1);         
            prop.prop = SmartSearchManagerUI._manager.getSmartSearch(i).getProp();
            await SmartSearchManagerUI._table.addRow(prop);
        }     
    }

    static async _updateEditor(id) {
        
        let SmartSearch = SmartSearchManagerUI._manager.getSmartSearchByID(id);
        let filterjson = SmartSearch.toJSON();
        let editorfilter = SmartSearchEditorUI.getFilter();
        editorfilter.fromJSON(filterjson);
        await SmartSearchEditorUI.refreshUI();

    }

    static async _handleSmartSearchNameEdit(row) {

        let data = row.getData();
        let SmartSearch = SmartSearchManagerUI._manager.getSmartSearchByID(data.id);
        SmartSearch.setName(data.description);
        if (data.description == "")
        {
            row.update({description:SmartSearch.getName()});
        }
        if (SmartSearchManagerUI._updatedCallback) {
            SmartSearchManagerUI._updatedCallback();
        }

    }

    static async _handleSmartSearchIsPropEdit(row) {
        let data = row.getData();
        SmartSearchManagerUI._manager.updateSmartSearchIsProp(data.id,data.prop);
        if (SmartSearchManagerUI._updatedCallback) {
            SmartSearchManagerUI._updatedCallback();
        }
    }


    static async _handleSmartSearchIsActionEdit(row, actionnum) {
        let data = row.getData();
        let SmartSearch = SmartSearchManagerUI._manager.getSmartSearchByID(data.id);
        if (actionnum == 0) {
            SmartSearch.setAction(data.action0,0);
        }
        else {
            SmartSearch.setAction(data.action1,1);
        }
        if (SmartSearchManagerUI._updatedCallback) {
            SmartSearchManagerUI._updatedCallback();
        }
    }

    static _handleSmartSearchUpdate(row) {
        let data = row.getData();
        let SmartSearch = SmartSearchManagerUI._manager.getSmartSearchByID(data.id);

        SmartSearchEditorUI.updateFilterFromUI();
        let filter = SmartSearchEditorUI.getFilter();
        let jfilter = filter.toJSON();

        let sf = new hcSmartSearch.SmartSearch(SmartSearchManagerUI._manager);
        sf.fromJSON(jfilter);
        SmartSearch.updateConditions(sf._conditions);
        SmartSearch.setAutoColors(sf.getAutoColors(), sf.getAutoColorProperty());

        SmartSearch.setName("");
       
        row.update({description:SmartSearch.getName()});
        
        if (SmartSearchManagerUI._updatedCallback) {
            SmartSearchManagerUI._updatedCallback();
        }
    }

    static exportToFile(filename) {

        function _makeTextFile(text) {
            let data = new Blob([text], {type: 'text/plain'});           
            let textFile = window.URL.createObjectURL(data);
        
            return textFile;
          }

        let text = JSON.stringify(SmartSearchManagerUI._manager.toJSON());

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
