import { dummy } from './tabulator_esm.min.js';

import { SQueryEditor } from './SQueryEditor.js';

export class SQueryManagerUI {

    static _updatedCallback = null;

    static _showButtonRow = true;

    static initialize(div, viewer, showImportExportButtons) {
        SQueryManagerUI._table = null;
        SQueryManagerUI._viewer = viewer;
        SQueryManagerUI._uidiv = div;

        hcSQuery.SQueryManager.initialize(viewer);

        if (SQueryManagerUI._showButtonRow) {

            $("#" + SQueryManagerUI._uidiv).append('<button class="SQuerySearchButton" id="SQueryManagerAddCurrentFilter" type="button" style="left:0px;top:2px">Add</button>');
            if (showImportExportButtons) {
                $("#" + SQueryManagerUI._uidiv).append('<button class="SQuerySearchButton" id="SQueryManagerExport" type="button" style="position:absolute;right:0px;top:2px">Export</button>');
                $("#" + SQueryManagerUI._uidiv).append('<button class="SQuerySearchButton" id="SQueryManagerUpload" type="button" style="position:absolute;right:58px;top:2px">Load</button><input style="display:none" type="file" id="inputupload">');

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
                hcSQuery.SQueryManager.fromJSON(res);
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

    static async _addCurrentFilter() {
        SQueryEditor.updateFilterFromUI();
        let filter = SQueryEditor.getFilter();
        let jfilter = filter.toJSON();

        let sf = new hcSQuery.SQuery(SQueryManagerUI._viewer);

        sf.fromJSON(jfilter);
        
        sf._id =  SQueryManagerUI._generateGUID();
        sf.setName("");
        hcSQuery.SQueryManager.addSQuery(sf, false);
        

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
        let SQuery = hcSQuery.SQueryManager.getSQueryByID(id);
        return SQuery.generateString();        

    }

    static editCheck(cell){
        return SQueryManagerUI._editable;
    }
    static async refreshUI() {

        if (!SQueryManagerUI._table) {

            let rowMenu = [
                {
                    label: "<i class='fas fa-user'></i> Search",
                    action: async function (e, row) {
                        let rowdata = row.getData();
                        SQueryManagerUI._handleTableSelection(row.getData(), false, false);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Search & Select",
                    action: async function (e, row) {
                        let rowdata = row.getData();
                        SQueryManagerUI._handleTableSelection(row.getData(), true, false);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Search & Isolate",
                    action: async function (e, row) {
                        let rowdata = row.getData();
                        SQueryManagerUI._handleTableSelection(row.getData(), true,true);
                    }
                },
                {
                    separator:true,
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
                        hcSQuery.SQueryManager.removeSQuery(row.getData().id);
                        row.delete();
                        if (SQueryManagerUI._updatedCallback) {
                            SQueryManagerUI._updatedCallback();
                        }
                    }
                },
            ];

            var editCheck = function(cell){
                //cell - the cell component for the editable cell
            
                //get row data
                var data = cell.getRow().getData();
            
                return data.age > 18; // only allow the name cell to be edited if the age is over 18
            }

            SQueryManagerUI._table = new Tabulator("#" + SQueryManagerUI._uidiv + "Tabulator", {
                data: [],                             
                selectable:0,
                layout: "fitColumns",
                rowContextMenu: rowMenu,
                columns: [                                   
                    {
                        title: "Name", field: "description", formatter:"textarea", editor:"input",editable: SQueryManagerUI.editCheck,tooltip:SQueryManagerUI.formatTooltip
                    },  
                    {
                        title: "ID", field: "id", width: 20, visible: false
                    },
                    {title:"Prop", field:"prop", width:70,  hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true,
                    editorParams:{
                       
                        tristate:false,
                      
                    }},

                ],
            });

            SQueryManagerUI._table.on("rowClick", async function (e, row) {
                let data = row.getData();
                let SQuery = hcSQuery.SQueryManager.getSQueryByID(data.id);
                let filterjson = SQuery.toJSON();
        
                let editorfilter = SQueryEditor.getFilter();
                editorfilter.fromJSON(filterjson);
                SQueryEditor.clearSearchResults();                
                await SQueryEditor.refreshUI();                
            });

            SQueryManagerUI._table.on("rowDblClick", function(e, row){
                SQueryManagerUI._editable = true;                
            });
        

            SQueryManagerUI._table.on("cellEdited", function (cell) {
                if (cell.getField() == "description") {
                    SQueryManagerUI._handleSQueryNameEdit(cell.getRow());
                    SQueryManagerUI._editable = false;
                }
                else
                {
                    SQueryManagerUI._handleSQueryIsPropEdit(cell.getRow());
                }
            });
        }
        else
            await SQueryManagerUI._table.clearData();

        for (let i=0;i<hcSQuery.SQueryManager.getSQueryNum();i++) {
            let filter = hcSQuery.SQueryManager.getSQuery(i);
            
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
            prop.id =  hcSQuery.SQueryManager.getSQueryID(i);;
            prop.description = text;
            prop.prop = hcSQuery.SQueryManager.getIsProp(i);
            await SQueryManagerUI._table.addRow(prop);
        }     
    }


    static async _handleTableSelection(data, select, isolate) {

        let SQuery = hcSQuery.SQueryManager.getSQueryByID(data.id);

        let filterjson = SQuery.toJSON();

        let editorfilter = SQueryEditor.getFilter();
        editorfilter.fromJSON(filterjson);
        await SQueryEditor.refreshUI();
        await SQueryEditor.search();
        if (select) {
            if (isolate) {
                SQueryEditor.isolateAll();
            }
            else {
                SQueryEditor.selectAll();
            }
        }
    }

    static async _handleSQueryNameEdit(row) {

        let data = row.getData();
        let SQuery = hcSQuery.SQueryManager.getSQueryByID(data.id);
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
        hcSQuery.SQueryManager.updateSQueryIsProp(data.id,data.prop);
        if (SQueryManagerUI._updatedCallback) {
            SQueryManagerUI._updatedCallback();
        }
    }

    static _handleSQueryUpdate(row) {
        let data = row.getData();
        let SQuery = hcSQuery.SQueryManager.getSQueryByID(data.id);

        SQueryEditor.updateFilterFromUI();
        let filter = SQueryEditor.getFilter();
        let jfilter = filter.toJSON();

        let sf = new hcSQuery.SQuery(SQueryManagerUI._viewer);
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

        let text = JSON.stringify(hcSQuery.SQueryManager.toJSON());

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
