import { SmartFilterEditor } from './SmartFilterEditor.js';

export class SmartFilterManagerUI {

    static initialize(viewer, div) {
        SmartFilterManagerUI._table = null;
        SmartFilterManagerUI._viewer = viewer;
        SmartFilterManagerUI._uidiv = div;

        SF.SmartFilterManager.initialize(viewer);

        $("#" + SmartFilterManagerUI._uidiv).append('<button id="smartFilterManagerAddCurrentFilter" type="button" style="left:0px;top:2px">Add</button>');
        $("#" + SmartFilterManagerUI._uidiv).append('<button id="smartFilterManagerExport" type="button" style="position:absolute;right:0px;top:0px">Export</button>');
        $("#" + SmartFilterManagerUI._uidiv).append('<button id="smartFilterManagerUpload" type="button" style="position:absolute;right:58px;top:0px">Load</button><input style="display:none" type="file" id="inputupload">');



        $("#smartFilterManagerAddCurrentFilter").click(function () { SmartFilterManagerUI._addCurrentFilter(); });
        $("#smartFilterManagerExport").click(function () { SmartFilterManagerUI.exportToFile("smartfilters.json"); });

        $("#smartFilterManagerUpload").click(function(e){
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



        $("#" + this._uidiv).append('<div id="' + SmartFilterManagerUI._uidiv + 'Tabulator" style="overflow: hidden; zoom:0.7;width:100%; height:100%;"></div>');

        SmartFilterManagerUI._refreshUI();
    }

    static async load(file) {
        let reader = new FileReader();
        let _this = this;
        reader.onload = (function (theFile) {
            return async function (e) {
                // Render thumbnail.
                let res = JSON.parse(e.target.result);
                SF.SmartFilterManager.fromJSON(res);
                SmartFilterManagerUI._refreshUI();
            };
        })(file);

        // Read in the image file as a data URL.
        reader.readAsText(file);
    }

    static async _addCurrentFilter() {
        SmartFilterEditor.updateFilterFromUI();
        let filter = SmartFilterEditor.getFilter();
        let jfilter = filter.toJSON();

        let sf = new SF.SmartFilter(SmartFilterManagerUI._viewer);
        sf.fromJSON(jfilter);
        sf.setName("");
        SF.SmartFilterManager.addSmartFilter(sf, false);

        let text = filter.generateString();            

        let prop = {};
        prop.id = SF.SmartFilterManager.getSmartFilterNum() - 1;
        prop.description = text;
        await SmartFilterManagerUI._table.addRow(prop);

    }

    static _renderButtonCell(cell) {
        let _this = this;
        
        let content = "";
        let editable = cell.getValue();

        let rowdata = cell.getRow().getData();

   
        content += '<div style="height:20px">';
    
        content += '<button id="sfm-select-' + cell.getData().id + '" type="button" title="Press Shift to Isolate" style="position:relative;top:2px;height:18px"><span style="font-size:12px;top:-2px;position:relative;">Select</span></button>';
        content += '<button id="sfm-update-' + cell.getData().id + '" type="button" style="margin-left:2px; position:relative;top:2px;height:18px"><span style="font-size:12px;top:-2px;position:relative;">Update</span></button>';
        content += '<button id="sfm-delete-' + cell.getData().id + '" type="button" style="margin-left:2px; position:relative;top:2px;height:18px"><span style="font-size:12px;top:-2px;position:relative;">Del</span></button>';
    
        content += '</div>';
        $(cell.getElement()).append(content);
        $("#sfm-select-" + cell.getData().id).on("click", function (event) {             
            event.stopPropagation();
            SmartFilterManagerUI._handleTableSelection(rowdata, event.shiftKey);
        });
        $("#sfm-update-" + cell.getData().id).on("click", function (event) {             
            event.stopPropagation();
            SmartFilterManagerUI._handleSmartFilterUpdate(cell.getRow());
        });

        $("#sfm-delete-" + cell.getData().id).on("click", function (event) {             
            event.stopPropagation();
            SF.SmartFilterManager.removeSmartFilter(rowdata.id);
            cell.getRow().delete();
        });
    }

    static async _refreshUI() {

        if (!SmartFilterManagerUI._table) {
            SmartFilterManagerUI._table = new Tabulator("#" + SmartFilterManagerUI._uidiv + "Tabulator", {
                data: [],                             
                selectable:0,
                layout: "fitColumns",
                columns: [                                   
                    {
                        title: "Description", field: "description", formatter:"textarea", editor:"textarea"
                    },
                    {
                        title: "", width: 160, field: "buttons", formatter: function (cell, formatterParams, onRendered) {
                            onRendered(function () {
                                SmartFilterManagerUI._renderButtonCell(cell);
                            });
                        },
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

        for (let i=0;i<SF.SmartFilterManager.getSmartFilterNum();i++) {
            let filter = SF.SmartFilterManager.getSmartFilter(i);
            
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

            prop.id = i;
            prop.description = text;
            prop.prop = SF.SmartFilterManager.getIsProp(i);
            await SmartFilterManagerUI._table.addRow(prop);
        }     
    }


    static async _handleTableSelection(data, isolate) {

        let smartFilter = SF.SmartFilterManager.getSmartFilter(data.id);

        let filterjson = smartFilter.toJSON();

        let editorfilter = SmartFilterEditor.getFilter();
        editorfilter.fromJSON(filterjson);
        await SmartFilterEditor.refreshUI();
        await SmartFilterEditor.search();
        if (isolate)
        {
            await SmartFilterEditor.isolateAll();
        }
        else
        {
            await SmartFilterEditor.selectAll();
        }
    }

    static async _handleSmartFilterNameEdit(row) {

        let data = row.getData();
        let smartFilter = SF.SmartFilterManager.getSmartFilter(data.id);
        smartFilter.setName(data.description);
        if (data.description == "")
        {
            row.update({description:smartFilter.generateString()});
        }
    }

    static async _handleSmartFilterIsPropEdit(row) {
        let data = row.getData();
        SF.SmartFilterManager.updateSmartFilterIsProp(data.id,data.prop);
    }

    static _handleSmartFilterUpdate(row) {

        let data = row.getData();
        let smartFilter = SF.SmartFilterManager.getSmartFilter(data.id);

        SmartFilterEditor.updateFilterFromUI();
        let filter = SmartFilterEditor.getFilter();
        let jfilter = filter.toJSON();

        let sf = new SF.SmartFilter(SmartFilterManagerUI._viewer);
        sf.fromJSON(jfilter);
        sf.setName(smartFilter.getName());
        SF.SmartFilterManager.updateSmartFilter(data.id,sf);

        if (sf.getName() == "")
        {
            row.update({description:sf.generateString()});
        }

    }

    static exportToFile(filename) {

        function _makeTextFile(text) {
            let data = new Blob([text], {type: 'text/plain'});           
            let textFile = window.URL.createObjectURL(data);
        
            return textFile;
          }

        let text = JSON.stringify(SF.SmartFilterManager.toJSON());

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
