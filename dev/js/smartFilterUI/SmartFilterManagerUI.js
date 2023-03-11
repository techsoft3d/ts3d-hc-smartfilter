import { dummy } from './tabulator_esm.min.js';

import { SmartFilterEditor } from './SmartFilterEditor.js';

export class SmartFilterManagerUI {

    static _updatedCallback = null;

    static _showButtonRow = true;

    static initialize(div, viewer, showImportExportButtons) {
        SmartFilterManagerUI._table = null;
        SmartFilterManagerUI._viewer = viewer;
        SmartFilterManagerUI._uidiv = div;

        hcSmartFilter.SmartFilterManager.initialize(viewer);

        if (SmartFilterManagerUI._showButtonRow) {

            $("#" + SmartFilterManagerUI._uidiv).append('<button class="smartFilterSearchButton" id="smartFilterManagerAddCurrentFilter" type="button" style="left:0px;top:2px">Add</button>');
            if (showImportExportButtons) {
                $("#" + SmartFilterManagerUI._uidiv).append('<button class="smartFilterSearchButton" id="smartFilterManagerExport" type="button" style="position:absolute;right:0px;top:2px">Export</button>');
                $("#" + SmartFilterManagerUI._uidiv).append('<button class="smartFilterSearchButton" id="smartFilterManagerUpload" type="button" style="position:absolute;right:58px;top:2px">Load</button><input style="display:none" type="file" id="inputupload">');

                $("#smartFilterManagerExport").click(function () { SmartFilterManagerUI.exportToFile("smartfilters.json"); });

                $("#smartFilterManagerUpload").click(function (e) {
                    e.preventDefault();
                    $("#inputupload").trigger('click');
                });

                $("#inputupload").change(function () {

                    let files = $('#inputupload')[0].files;
                    // Check file selected or not
                    if (files.length > 0) {
                        SmartFilterManagerUI.load(files[0]);
                    }
                });
            }

            $("#smartFilterManagerAddCurrentFilter").click(function () { SmartFilterManagerUI._addCurrentFilter(); });
        }

        $("#" + this._uidiv).append('<div id="' + SmartFilterManagerUI._uidiv + 'Tabulator" class = "smartFilterManagerTabulator"></div>');

        SmartFilterManagerUI.refreshUI();
    }

    static setUpdatedCallback(callback) {
        SmartFilterManagerUI._updatedCallback = callback;
    }

    static async load(file) {
        let reader = new FileReader();
        let _this = this;
        reader.onload = (function (theFile) {
            return async function (e) {
                // Render thumbnail.
                let res = JSON.parse(e.target.result);
                hcSmartFilter.SmartFilterManager.fromJSON(res);
                SmartFilterManagerUI.refreshUI();
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
        SmartFilterEditor.updateFilterFromUI();
        let filter = SmartFilterEditor.getFilter();
        let jfilter = filter.toJSON();

        let sf = new hcSmartFilter.SmartFilter(SmartFilterManagerUI._viewer);

        sf.fromJSON(jfilter);
        
        sf._id =  SmartFilterManagerUI._generateGUID();
        sf.setName("");
        hcSmartFilter.SmartFilterManager.addSmartFilter(sf, false);
        

        let prop = {};
        prop.id = sf._id;
        prop.description = sf.getName();
        await SmartFilterManagerUI._table.addRow(prop);

        if (SmartFilterManagerUI._updatedCallback) {
            SmartFilterManagerUI._updatedCallback();
        }
    }

    static formatTooltip(e,cell) {
        let id = cell.getData().id
        let smartFilter = hcSmartFilter.SmartFilterManager.getSmartFilterByID(id);
        return smartFilter.generateString();        

    }
    static async refreshUI() {

        if (!SmartFilterManagerUI._table) {

            let rowMenu = [
                {
                    label: "<i class='fas fa-user'></i> Show",
                    action: async function (e, row) {
                        let rowdata = row.getData();
                        SmartFilterManagerUI._handleTableSelection(row.getData(), false, false);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Select",
                    action: async function (e, row) {
                        let rowdata = row.getData();
                        SmartFilterManagerUI._handleTableSelection(row.getData(), true, false);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Isolate",
                    action: async function (e, row) {
                        let rowdata = row.getData();
                        SmartFilterManagerUI._handleTableSelection(row.getData(), true,true);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Update",
                    action: async function (e, row) {
                        SmartFilterManagerUI._handleSmartFilterUpdate(row);
                    }
                },
                {
                    label: "<i class='fas fa-user'></i> Delete",
                    action: async function (e, row) {
                        hcSmartFilter.SmartFilterManager.removeSmartFilter(row.getData().id);
                        row.delete();
                        if (SmartFilterManagerUI._updatedCallback) {
                            SmartFilterManagerUI._updatedCallback();
                        }
                    }
                },
            ];


            SmartFilterManagerUI._table = new Tabulator("#" + SmartFilterManagerUI._uidiv + "Tabulator", {
                data: [],                             
                selectable:0,
                layout: "fitColumns",
                rowContextMenu: rowMenu,
                columns: [                                   
                    {
                        title: "Description", field: "description", formatter:"textarea", editor:"textarea",tooltip: SmartFilterManagerUI.formatTooltip
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

        

            SmartFilterManagerUI._table.on("cellEdited", function (cell) {
                if (cell.getField() == "description") {
                    SmartFilterManagerUI._handleSmartFilterNameEdit(cell.getRow());
                }
                else
                {
                    SmartFilterManagerUI._handleSmartFilterIsPropEdit(cell.getRow());
                }
            });


        }
        else
            await SmartFilterManagerUI._table.clearData();

        for (let i=0;i<hcSmartFilter.SmartFilterManager.getSmartFilterNum();i++) {
            let filter = hcSmartFilter.SmartFilterManager.getSmartFilter(i);
            
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
            prop.id =  hcSmartFilter.SmartFilterManager.getSmartFilterID(i);;
            prop.description = text;
            prop.prop = hcSmartFilter.SmartFilterManager.getIsProp(i);
            await SmartFilterManagerUI._table.addRow(prop);
        }     
    }


    static async _handleTableSelection(data, select, isolate) {

        let smartFilter = hcSmartFilter.SmartFilterManager.getSmartFilterByID(data.id);

        let filterjson = smartFilter.toJSON();

        let editorfilter = SmartFilterEditor.getFilter();
        editorfilter.fromJSON(filterjson);
        await SmartFilterEditor.refreshUI();
        await SmartFilterEditor.search();
        if (select) {
            if (isolate) {
                SmartFilterEditor.isolateAll();
            }
            else {
                SmartFilterEditor.selectAll();
            }
        }
    }

    static async _handleSmartFilterNameEdit(row) {

        let data = row.getData();
        let smartFilter = hcSmartFilter.SmartFilterManager.getSmartFilterByID(data.id);
        smartFilter.setName(data.description);
        if (data.description == "")
        {
            row.update({description:smartFilter.getName()});
        }
        if (SmartFilterManagerUI._updatedCallback) {
            SmartFilterManagerUI._updatedCallback();
        }

    }

    static async _handleSmartFilterIsPropEdit(row) {
        let data = row.getData();
        hcSmartFilter.SmartFilterManager.updateSmartFilterIsProp(data.id,data.prop);
        if (SmartFilterManagerUI._updatedCallback) {
            SmartFilterManagerUI._updatedCallback();
        }
    }

    static _handleSmartFilterUpdate(row) {
        let data = row.getData();
        let smartFilter = hcSmartFilter.SmartFilterManager.getSmartFilterByID(data.id);

        SmartFilterEditor.updateFilterFromUI();
        let filter = SmartFilterEditor.getFilter();
        let jfilter = filter.toJSON();

        let sf = new hcSmartFilter.SmartFilter(SmartFilterManagerUI._viewer);
        sf.fromJSON(jfilter);
        smartFilter.updateConditions(sf._conditions);
        smartFilter.setName("");
       
        row.update({description:smartFilter.getName()});
        
        if (SmartFilterManagerUI._updatedCallback) {
            SmartFilterManagerUI._updatedCallback();
        }
    }

    static exportToFile(filename) {

        function _makeTextFile(text) {
            let data = new Blob([text], {type: 'text/plain'});           
            let textFile = window.URL.createObjectURL(data);
        
            return textFile;
          }

        let text = JSON.stringify(hcSmartFilter.SmartFilterManager.toJSON());

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
