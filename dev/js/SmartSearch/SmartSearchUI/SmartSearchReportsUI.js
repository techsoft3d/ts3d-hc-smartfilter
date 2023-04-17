import { SmartSearchEditorUI } from './SmartSearchEditorUI.js';

export class SmartSearchReportsUI {

    static initialize(maindiv, manager) {
        SmartSearchReportsUI._maindiv = maindiv;
        SmartSearchReportsUI._manager = manager;
        SmartSearchReportsUI._viewer = manager._viewer;
        SmartSearchReportsUI._isPropertyView = false;
        SmartSearchReportsUI._tablePropertyAMT = "--EMPTY--";
        SmartSearchReportsUI._aggType = "sum";
        SmartSearchReportsUI._tablePropertyExpanded1 = "--EMPTY--";
        SmartSearchReportsUI._tablePropertyExpanded2 = "--EMPTY--";
        SmartSearchReportsUI.display();
    }

    static async display() {     
        let html = "";
        html += '<div id = "SmartSearchReportsUIMain" style="position:absolute;width:100%;height:100%;font-size:12px">';
        html += '<div id = "SmartSearchReportsUIOptions" style="background:white;position:absolute;width:325px;height:100%"></div>';
        html += '<div id = "SmartSearchReportsUITabulator" style="position:absolute;left:325px;width:calc(100% - 325px);height:100%"></div>';
        html += '</div>';

        $("#" + SmartSearchReportsUI._maindiv).empty();
        $("#" + SmartSearchReportsUI._maindiv).append(html);
    }
    
    static getAmountStrings(items) {

        let amountStrings = [];
        amountStrings.push("--EMPTY--");
        for (let i = 0; i < items.length; i++) {
            let ltext = items[i].toLowerCase();
            if (ltext.indexOf("version") != -1 || ltext.indexOf("globalid") != -1 || ltext.indexOf("name") != -1 || ltext.indexOf("date") != -1 || ltext.indexOf("persistentid") != -1) {
                continue;
            }
            let prop = SmartSearchReportsUI._manager._allPropertiesHash[items[i]];
            if (prop != undefined) {
                for (let j in prop) {
                    if (!isNaN(parseFloat(j))) {
                        amountStrings.push(items[i]);
                    }
                    break;
                }
            }
        }
        return amountStrings;
    }

    static _orgPropertySelected() {
        SmartSearchReportsUI._report._orgProperties.push($("#SmartSearchOrgPropSelect")[0].value);
        SmartSearchReportsUI._generateSettingsWindow();
    }

    static _tablePropertySelected() {
        SmartSearchReportsUI._report._tableParams.push({prop:$("#SmartSearchTablePropSelect")[0].value});
        SmartSearchReportsUI._generateSettingsWindow();
    }

    static _propertySelected() {
        SmartSearchReportsUI._results.setTableProperty($("#SmartSearchPropSelect")[0].value);
        SmartSearchEditorUI._mainFilter.setAutoColors(null, null);
        SmartSearchReportsUI._generatePropertyView();

    }

    static _propertyExpandedSelected(num) {
        if (num == 0) {
            SmartSearchReportsUI._tablePropertyExpanded0 = $("#SmartSearchPropExpandedSelect0")[0].value;
        }
        else if (num == 1) {
            SmartSearchReportsUI._tablePropertyExpanded1 = $("#SmartSearchPropExpandedSelect1")[0].value;
        }
        SmartSearchReportsUI.generateExpandedResults();

    }

    static _propertyAggTypeSelected() {
        SmartSearchReportsUI._aggType = $("#SmartSearchPropAggType")[0].value;
        SmartSearchReportsUI._generatePropertyView();

    }

    static _propertyAMTSelected() {
        SmartSearchReportsUI._tablePropertyAMT = $("#SmartSearchPropSelectAMT")[0].value;
        SmartSearchReportsUI._generatePropertyView();

    }

    static applyColors() {        
        for (let i in SmartSearchReportsUI._report.getCategoryHash()) {
            if (SmartSearchReportsUI._report.getCategoryHash()[i].color) {
                SmartSearchEditorUI._viewer.model.setNodesFaceColor(SmartSearchReportsUI._report.getCategoryHash()[i].ids, SmartSearchReportsUI._report.getCategoryHash()[i].color);
            }
        }
    }

    static _assignColorsMainGradient() {    

        let rows = SmartSearchReportsUI._table.getRows();
        let delta = 256/rows.length;
        for (let i=0;i<rows.length;i++) {
            let m = delta * rows[i].getPosition();
            SmartSearchReportsUI._results.getCategoryHash()[rows[i].getData().id].color = new Communicator.Color(m,m,m);
        }

        let autoColors = [];
        for (let i in SmartSearchReportsUI._results.getCategoryHash()) {
            autoColors[i] = SmartSearchReportsUI._results.getCategoryHash()[i].color;
        }
        SmartSearchEditorUI._mainFilter.setAutoColors(autoColors, SmartSearchReportsUI._results.getTableProperty());
        SmartSearchReportsUI._updateColorsInTable();
    }

    static _updateColorsInTable() {
        let tdata = [];
        for (let i in SmartSearchReportsUI._report.getCategoryHash()) {
            let color = SmartSearchReportsUI._report.getCategoryHash()[i].color;
            let data;
            if (color) {
                data = { color: 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',1)',id: i };
            }
            else {
                data = { color:null,id: i };
            }
            tdata.push(data);
        }
        SmartSearchReportsUI._table.updateData(tdata);
    }

    static _assignExpandedColorsGradient(column) {

        let tdata = SmartSearchReportsUI._results.caculateExpandedColorsGradient(column,this._expandedNodeIds,this._tablePropertyExpanded0,this._tablePropertyExpanded1);
       
        SmartSearchReportsUI._table.updateData(tdata);
    }

    static applyExpandedColors() {
        let rows = SmartSearchReportsUI._table.getRows();
        for (let i = 0; i < rows.length; i++) {
            let m = rows[i].getData().colorsav;
            SmartSearchEditorUI._viewer.model.setNodesFaceColor([rows[i].getData().id], new Communicator.Color(m, m, m));
        }
    }

    static _assignColorsGradient(column) {
     
        let pname = column;
        if (column == "name") {
            if (!SmartSearchReportsUI._results.isNumberProp(SmartSearchReportsUI._results.getTableProperty())) {
                SmartSearchReportsUI._assignColorsMainGradient();
                return;
            }
            pname = SmartSearchReportsUI._results.getTableProperty();
        }
        SmartSearchReportsUI._results.calculateGradientData(pname,SmartSearchReportsUI._tablePropertyAMT,SmartSearchReportsUI._aggType);
      
        SmartSearchReportsUI._updateColorsInTable();
    }


    static assignColorsRandom() {
        for (let i in SmartSearchReportsUI._report.getCategoryHash()) {
            let color = new Communicator.Color(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
            SmartSearchReportsUI._report.getCategoryHash()[i].color = color;
        }

        SmartSearchReportsUI._updateColorsInTable();

    }

    static _clearColors() {
        let tdata = [];
        for (let i in SmartSearchReportsUI._report.getCategoryHash()) {
            SmartSearchReportsUI._report.getCategoryHash()[i].color = undefined;
            let data = { color: null,id: i };
            tdata.push(data);
        }
        SmartSearchReportsUI._table.updateData(tdata);
    }

    static generateReport(report) {
        SmartSearchReportsUI._report = report;
        SmartSearchReportsUI._generateSettingsWindow();
    }

    static _deleteFromButton(c,type) {
        let propname = $(c).prev()[0].innerHTML;
        if (type == 0) {
            SmartSearchReportsUI._report.deleteOrgProperty(propname);
        }
        else {
            SmartSearchReportsUI._report.deleteTableParams(propname);
        }
        SmartSearchReportsUI._generateSettingsWindow();
    
    }

    static _setColumnAggregator(propname,aggtype) {

        if (propname.indexOf("tableParams") != -1) {
            let tableParamIndex = parseInt(propname.split("tableParams")[1]);
            let tableParam =  SmartSearchReportsUI._report.getTableParams()[tableParamIndex];
            tableParam.aggtype = aggtype;
            SmartSearchReportsUI._generateTable(false);
        }
    }

    static _generateOrgButton(text,type) {
        let html = "";
        html += '<button class="rectangular-button">';
        html += '<span>' + text + '</span><span onclick = "hcSmartSearch.SmartSearchReportsUI._deleteFromButton(this,' + type + ')" class="x">&times;</span>';
        html += '</button>';
        return html;
    }

    static _generateTable(regenerateTable = true) {
        if (regenerateTable) {
            SmartSearchReportsUI._report.generateTableHash();
        }
        let columnMenu = [ 
            {
                label: "<i class='fas fa-user'></i> Single",
                action: async function (e, column) {
                    SmartSearchReportsUI._setColumnAggregator(column.getDefinition().field,"single");
                }
            },
            {
                label: "<i class='fas fa-user'></i> Sum",
                action: async function (e, column) {
                    SmartSearchReportsUI._setColumnAggregator(column.getDefinition().field,"sum");
                }
            },
            {
                separator:true,
            },       
            {
                label: "<i class='fas fa-user'></i> Assign Random Colors",
                action: async function (e, column) {
                    SmartSearchReportsUI.assignColorsRandom();
                }
            },
            {
                label: "<i class='fas fa-user'></i> Assign Gradient",
                action: async function (e, column) {
                    SmartSearchReportsUI._assignColorsGradient(column.getDefinition().field);
                }
            },
            {
                label: "<i class='fas fa-user'></i> Clear Colors",
                action: async function (e, column) {
                    SmartSearchReportsUI._clearColors();
                }
            },
            
        ];


        $("#SmartSearchReportsUITabulator").empty();
        $("#SmartSearchReportsUITabulator").css("overflow", "inherit");

        $("#SmartSearchReportsUITabulator").append('<div class = "SmartSearchReportsUITabulator" id = "SmartSearchReportsUITabulator"></div>');
        let tabulatorColumnes = [];
        
        tabulatorColumnes.push({ title: SmartSearchReportsUI._report.getOrgString(), field: "org", sorter: "string", headerMenu: columnMenu });
        tabulatorColumnes.push({title: "#", field: "num", width: 65,bottomCalc:"sum",headerMenu:columnMenu});        

        let columnTypes = SmartSearchReportsUI._report.determineColumnTypes();
        for (let i = 0;i< SmartSearchReportsUI._report._tableParams.length;i++) {
            let title =  SmartSearchReportsUI._report._tableParams[i].prop;
            if (columnTypes[i].isNumber) {
                title  += "(" + columnTypes[i].unit + ") Σ";
            }

            let colum = { title: title, field: "tableParams" + i, headerMenu: columnMenu };
            if (columnTypes[i].isNumber) {
                colum.bottomCalc = "sum";
            }

            tabulatorColumnes.push(colum);
        }      
        tabulatorColumnes.push({title: "Color", field: "color", headerSort: false, field: "color", editor: "list", width: 45,
            formatter: "color", editorParams: { values: ["empty","red", "green", "blue", "yellow", "brown", "orange", "grey", "black", "white"] }
        });

        tabulatorColumnes.push({title: "ID", field: "id", width: 20, visible: false});

        SmartSearchReportsUI._table = new Tabulator("#SmartSearchReportsUITabulator", {
            rowHeight: 15,
            selectable: 0,
            layout: "fitColumns",
            columns: tabulatorColumnes,
        });

        SmartSearchReportsUI._table.on("tableBuilt", function () {
            let tdata = SmartSearchReportsUI._report.getTableData();
            SmartSearchReportsUI._table.setData(tdata);
        });

        SmartSearchReportsUI._table.on("rowClick", async function (e, row) {
            let data = row.getData();

            let ids = SmartSearchReportsUI._report.getCategoryHash()[data.id].ids;
            SmartSearchReportsUI._viewer.selectionManager.clear();
            if (ids.length == 1) {
                SmartSearchReportsUI._viewer.selectionManager.selectNode(ids[0], Communicator.SelectionMode.Set);
            }
            else {
                let selections = [];
                for (let i = 0; i < ids.length; i++) {
                    selections.push(new Communicator.Selection.SelectionItem(ids[i]));
                }
                SmartSearchReportsUI._viewer.selectionManager.add(selections);
            }

        });

        SmartSearchReportsUI._table.on("cellEdited", function (cell) {
            if (cell.getField() == "color") {
                let data = cell.getRow().getData();
                if (data.color != "empty") {
                    SmartSearchReportsUI._report.getCategoryHash()[data.id].color = SmartSearchReportsUI._report.convertColor(data.color);
                }
                else {
                    SmartSearchReportsUI._report.getCategoryHash()[data.id].color = null;
                }
                SmartSearchReportsUI._updateColorsInTable();
            }
        });      
    }

    static _generateSettingsWindow() {
        let sortedStrings = SmartSearchReportsUI._report.getAllProperties();
        sortedStrings.unshift("Choose Property");
        $("#SmartSearchReportsUIOptions").empty();

        let html = '<div style="height:55px;">';
        html += '<span style="top:0px;position:relative"><span style="font-family:courier">Organize by:</span><select id="SmartSearchOrgPropSelect" onchange=\'hcSmartSearch.SmartSearchReportsUI._orgPropertySelected();\' class="SmartSearchPropertyResultsSelect" value="">';

        for (let i = 0; i < sortedStrings.length; i++) {
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';

        for (let i=0;i<SmartSearchReportsUI._report._orgProperties.length;i++) {
            html += SmartSearchReportsUI._generateOrgButton(SmartSearchReportsUI._report._orgProperties[i],0);
        }

        html += '<br><br><span style="top:0px;position:relative"><span style="font-family:courier">Params:</span><select id="SmartSearchTablePropSelect" onchange=\'hcSmartSearch.SmartSearchReportsUI._tablePropertySelected();\' class="SmartSearchPropertyResultsSelect" value="">';

        for (let i = 0; i < sortedStrings.length; i++) {
            html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        
        for (let i=0;i<SmartSearchReportsUI._report._tableParams.length;i++) {
            html += SmartSearchReportsUI._generateOrgButton(SmartSearchReportsUI._report._tableParams[i].prop,1);
        }
        html += '<button class="SmartSearchSearchButton" type="button" style="right:5px;bottom:3px;position:absolute;" onclick="hcSmartSearch.SmartSearchReportsUI._generateTable()">Generate</button>';
        html += '<button class="SmartSearchSearchButton" type="button" style="right:70px;bottom:3px;position:absolute;" onclick="hcSmartSearch.SmartSearchReportsUI.applyColors()">Apply Colors</button>';

        html += '</div>';
        $("#SmartSearchReportsUIOptions").append(html);
    }

    static _generatePropertyView(redrawOnly = false) {

        if (SmartSearchEditorUI._mainFilter.getAutoColorProperty()) {
            SmartSearchReportsUI._report.setTableProperty(SmartSearchEditorUI._mainFilter.getAutoColorProperty());
        }

        let sortedStrings = SmartSearchReportsUI._report.getAllProperties();

        if (!redrawOnly) {
            let found = false;
            if (SmartSearchReportsUI._report.getTableProperty()) {
                for (let i = 0; i < sortedStrings.length; i++) {
                    if (sortedStrings[i] == SmartSearchReportsUI._report.getTableProperty()) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                SmartSearchReportsUI._report.setTableProperty(null);
            }

            SmartSearchReportsUI._report.findCategoryFromSearch();
        }
    

        $("#SmartSearchReportsUIOptions").empty();

        let amountStrings = SmartSearchReportsUI.getAmountStrings(sortedStrings);

        let html = '<div style="height:55px;"><span style="top:0px;position:relative"><span style="font-family:courier">Prop:</span><select id="SmartSearchPropSelect" onchange=\'hcSmartSearch.SmartSearchReportsUI._propertySelected();\' class="SmartSearchPropertyResultsSelect" value="">';

        for (let i = 0; i < sortedStrings.length; i++) {
            if (SmartSearchReportsUI._report.getTableProperty() == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:24px;left:0px;position:absolute"><span style="font-family:courier">AMT :</span><select id="SmartSearchPropSelectAMT" onchange=\'hcSmartSearch.SmartSearchReportsUI._propertyAMTSelected();\' class="SmartSearchPropertyResultsSelect" value="">';
        for (let i = 0; i < amountStrings.length; i++) {
            if (SmartSearchReportsUI._tablePropertyAMT == amountStrings[i])
                html += '<option value="' + amountStrings[i] + '" selected>' + amountStrings[i] + '</option>\n';
            else
                html += '<option value="' + amountStrings[i] + '">' + amountStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:24px;left:186px;position:absolute"><span style="font-family:courier"></span><select id="SmartSearchPropAggType" onchange=\'hcSmartSearch.SmartSearchReportsUI._propertyAggTypeSelected();\' class="SmartSearchPropertyAggTypeSelect" value="">';
        let choices = ["sum", "avg", "max", "min", "med"];
        for (let i = 0; i < choices.length; i++) {
            if (SmartSearchReportsUI._aggType == choices[i])
                html += '<option value="' + choices[i] + '" selected>' + choices[i] + '</option>\n';
            else
                html += '<option value="' + choices[i] + '">' + choices[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<button class="SmartSearchSearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick="hcSmartSearch.SmartSearchReportsUI.applyColors()">Apply Colors</button>';
        html += '</div>';

        $("#SmartSearchReportsUIOptions").append(html);


        $("#SmartSearchReportsUITabulator").empty();
        $("#SmartSearchReportsUITabulator").css("overflow", "inherit");

        $("#SmartSearchReportsUITabulator").append('<div class = "SmartSearchReportsUITabulator" id = "SmartSearchReportsUITabulator"></div>');


        let sorter = undefined;
        if (SmartSearchReportsUI._report.getTableProperty().indexOf("Date") != -1) {
            sorter = function(a, b, aRow, bRow, column, dir, sorterParams) {
                let aDate = new Date(a);
                let bDate = new Date(b);

                if (aDate > bDate) return 1;
                if (aDate < bDate) return -1;
                
                return 0;
            }
        }

        let columnMenu = [        
            {
                label: "<i class='fas fa-user'></i> Assign Random Colors",
                action: async function (e, column) {
                    SmartSearchReportsUI.assignColorsRandom();
                }
            },
            {
                label: "<i class='fas fa-user'></i> Assign Gradient",
                action: async function (e, column) {
                    SmartSearchReportsUI._assignColorsGradient(column.getDefinition().field);
                }
            },
            {
                label: "<i class='fas fa-user'></i> Clear Colors",
                action: async function (e, column) {
                    SmartSearchReportsUI._clearColors();
                }
            },
            
        ];

        let firstColumnTitle = SmartSearchReportsUI._report.getTableProperty();
        if (SmartSearchReportsUI._report.isNumberProp(SmartSearchReportsUI._report.getTableProperty())) {

            let unit = SmartSearchReportsUI._report.getAMTUnit(SmartSearchReportsUI._report.getTableProperty());
            if (unit) {
                firstColumnTitle = "(" + unit + ")";
            }            
        }

        let tabulatorColumes = [{
            title: firstColumnTitle, field: "name", sorter:sorter,headerMenu:columnMenu
        },
        {
            title: "#", field: "num", width: 65,bottomCalc:"sum",headerMenu:columnMenu
        },
        {
            title: "Color", field: "color", headerSort: false, field: "color", editor: "list", width: 45,
            formatter: "color", editorParams: { values: ["red", "green", "blue", "yellow", "brown", "orange", "grey", "black", "white"] }
        },
        {
            title: "ID", field: "id", width: 20, visible: false
        }];

        if (SmartSearchReportsUI._tablePropertyAMT != "--EMPTY--") {

            let unit = SmartSearchReportsUI._report.getAMTUnit(SmartSearchReportsUI._tablePropertyAMT);
            let unitTitle = "";
            if (unit) {
                unitTitle = SmartSearchReportsUI._aggType + "(" + unit + ")";
            }
            else {
                unitTitle = SmartSearchReportsUI._aggType;
            }
            tabulatorColumes.splice(1, 0, {
                headerMenu:columnMenu,title: unitTitle, field: "amt", width: 120,bottomCalc:SmartSearchReportsUI._aggType != "med" ? SmartSearchReportsUI._aggType: undefined
            });
        }

        let rowMenu = [
            {
                label: "<i class='fas fa-user'></i> View Category",
                action: async function (e, row) {
                    let ids = SmartSearchReportsUI._report.getCategoryHash()[row.getData().id].ids;
                    if  (SmartSearchReportsUI._report.getTableProperty().slice(-2) == "/*") { 
                        let rd = row.getData().id.split("/");
                        SmartSearchReportsUI._tablePropertyExpanded0 = SmartSearchReportsUI._report.getTableProperty().slice(0, -2) + "/" + rd[0];
                    }
                    else {
                        SmartSearchReportsUI._tablePropertyExpanded0 = SmartSearchReportsUI._report.getTableProperty();
                    }
                    SmartSearchReportsUI._tablePropertyExpanded1 = SmartSearchReportsUI._tablePropertyAMT;
                    SmartSearchReportsUI.generateExpandedResults(ids);
                }
            },
            {
                label: "<i class='fas fa-user'></i> View All",
                action: async function (e, row) {
                    let searchresults = SmartSearchEditorUI._founditems.getItems();
                    let ids = [];
                    for (let i = 0; i < searchresults.length; i++) {
                        ids.push(searchresults[i].id);
                    }
                    SmartSearchReportsUI._tablePropertyExpanded0 = SmartSearchReportsUI._report.getTableProperty();
                    SmartSearchReportsUI._tablePropertyExpanded1 = SmartSearchReportsUI._tablePropertyAMT;
                    SmartSearchReportsUI.generateExpandedResults(ids);
                }
            },          
            
        ];

        SmartSearchReportsUI._table = new Tabulator("#SmartSearchReportsUITabulator", {
            rowHeight: 15,
            selectable: 0,
            layout: "fitColumns",
            columns: tabulatorColumes,
            rowContextMenu: rowMenu
        });

        SmartSearchReportsUI._table.on("rowClick", async function (e, row) {
            let data = row.getData();

            let ids = SmartSearchReportsUI._report.getCategoryHash()[data.id].ids;
            SmartSearchReportsUI._viewer.selectionManager.clear();
            if (ids.length == 1) {
                SmartSearchReportsUI._viewer.selectionManager.selectNode(ids[0], Communicator.SelectionMode.Set);
            }
            else {
                let selections = [];
                for (let i = 0; i < ids.length; i++) {
                    selections.push(new Communicator.Selection.SelectionItem(ids[i]));
                }
                SmartSearchReportsUI._viewer.selectionManager.add(selections);
            }

        });

        SmartSearchReportsUI._table.on("tableBuilt", function () {
            let tdata = SmartSearchReportsUI._report.getCategoryTableData(SmartSearchReportsUI._tablePropertyAMT,SmartSearchReportsUI._aggType);
            SmartSearchReportsUI._table.setData(tdata);
        });

        SmartSearchReportsUI._table.on("cellEdited", function (cell) {
            if (cell.getField() == "color") {
                let autoColors = SmartSearchEditorUI._mainFilter.getAutoColors();
                if (!autoColors) {
                    autoColors = [];
                    SmartSearchEditorUI._mainFilter.setAutoColors(autoColors, SmartSearchReportsUI._report.getTableProperty());
                }
                let data = cell.getRow().getData();
                autoColors[data.id] = SmartSearchReportsUI._report.convertColor(data.color);
            }
            SmartSearchReportsUI._table.redraw();
        });      
    }

    static generateExpandedResults(nodeids_in = null) {

        let nodeids;
        if (nodeids_in) {
            SmartSearchReportsUI._expandedNodeIds = nodeids_in;
            nodeids = nodeids_in;
        }
        else {
            nodeids = SmartSearchReportsUI._expandedNodeIds;
        }

        this._expandedNodeIds = nodeids;

        if (SmartSearchReportsUI._tablePropertyExpanded0.indexOf("Node Name") != -1) {
            SmartSearchReportsUI._tablePropertyExpanded0 = "Node Type";
        }

        $("#" + SmartSearchReportsUI._maindiv + "_searchitems").empty();
        $("#" + SmartSearchReportsUI._maindiv + "_searchitems").css("overflow", "inherit");
        $("#" + SmartSearchReportsUI._maindiv + "_found").empty();
        $("#SmartSearchReportsUIFirstRow").css("display", "none");

        let sortedStrings = SmartSearchReportsUI._results.getAllProperties();
        sortedStrings.shift();
        sortedStrings.shift();

        let html = '<div style="height:35px;">';
        html += '<button class="SmartSearchSearchButton" type="button" style="right:5px;top:-5px;position:absolute;" onclick=\'hcSmartSearch.SmartSearchReportsUI._generatePropertyView(true)\'>Property View</button>';
        html += '<button class="SmartSearchSearchButton" type="button" style="right:5px;top:17px;position:absolute;" onclick="hcSmartSearch.SmartSearchReportsUI.applyExpandedColors()">Apply Colors</button>';
        html += '<div style="height:25px;"><span style="top:-5px;position:relative"><span style="font-family:courier">Prop1:</span><select id="SmartSearchPropExpandedSelect0" onchange=\'hcSmartSearch.SmartSearchReportsUI._propertyExpandedSelected(0);\' class="SmartSearchPropertyResultsSelect" value="">';
        
        for (let i = 0; i < sortedStrings.length; i++) {
            if (SmartSearchReportsUI._tablePropertyExpanded0 == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:15px;left:0px;position:absolute"><span style="font-family:courier">Prop2:</span><select id="SmartSearchPropExpandedSelect1" onchange=\'hcSmartSearch.SmartSearchReportsUI._propertyExpandedSelected(1);\' class="SmartSearchPropertyResultsSelect" value="">';
        sortedStrings.unshift("--EMPTY--");

        for (let i = 0; i < sortedStrings.length; i++) {
            if (SmartSearchReportsUI._tablePropertyExpanded1 == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
         
        html += '</div>';
        $("#" + SmartSearchReportsUI._maindiv + "_searchitems").append(html);
        $("#" + SmartSearchReportsUI._maindiv + "_searchitems").append('<div class = "SmartSearchReportsUITabulator" id = "SmartSearchReportsUITabulator"></div>');

        let title1 = SmartSearchReportsUI._tablePropertyExpanded0;

        let sorter = function(a, b, aRow, bRow, column, dir, sorterParams) {
            let aDate = new Date(a);
            let bDate = new Date(b);
            if (aDate == "Invalid Date") return -1;
            if (bDate == "Invalid Date") return -1;
            
            if (aDate > bDate) return 1;
            if (aDate < bDate) return -1;
            
            return 0;
        }

        let columnMenu = [        
            {
                label: "<i class='fas fa-user'></i> Assign Gradient",
                action: async function (e, column) {
                    SmartSearchReportsUI._assignExpandedColorsGradient(column.getDefinition().field);
                }
            },
        ];
    
        let tabulatorColumes = [{
            title: "Name", field: "name"
        },
        {
            title: "ID", field: "id", visible: false
        },
        {
            title: "Color", field: "color", headerSort: false, field: "color", width: 45,
            formatter: "color"
        }];

        let unitTitle = "";
        let bcalc = undefined;
        if (SmartSearchReportsUI._results.isNumberProp(SmartSearchReportsUI._tablePropertyExpanded0)) {
            let unit = SmartSearchReportsUI._results.getAMTUnit(SmartSearchReportsUI._tablePropertyExpanded0);
            if (unit) {
                unitTitle = "(" + unit + ")";
                bcalc = "sum";
            }
            else {
                unitTitle = SmartSearchReportsUI._tablePropertyExpanded0;
            }
        }
        else {
            unitTitle = SmartSearchReportsUI._tablePropertyExpanded0;
        }
        tabulatorColumes.splice(1, 0, {
            headerMenu:columnMenu, title: unitTitle, field: "prop1", bottomCalc:bcalc, sorter:SmartSearchReportsUI._tablePropertyExpanded0.indexOf("Date") != -1 ? sorter : undefined
        });

        let bcalc2 = undefined;

        if (SmartSearchReportsUI._tablePropertyExpanded1 != "--EMPTY--") {

            let unitTitle = "";
            if (SmartSearchReportsUI._results.isNumberProp(SmartSearchReportsUI._tablePropertyExpanded1)) {
                let unit = SmartSearchReportsUI._results.getAMTUnit(SmartSearchReportsUI._tablePropertyExpanded1);
                if (unit) {
                    unitTitle = "(" + unit + ")";
                    bcalc2 = "sum";
                }
                else {
                    unitTitle = SmartSearchReportsUI._tablePropertyExpanded1;
                }
            }
            else {
                unitTitle = SmartSearchReportsUI._tablePropertyExpanded1;
            }
            tabulatorColumes.splice(2, 0, {
                headerMenu:columnMenu,title: unitTitle, field: "prop2", bottomCalc: bcalc2, sorter:SmartSearchReportsUI._tablePropertyExpanded1.indexOf("Date") != -1 ? sorter : undefined
            });
        }

        SmartSearchReportsUI._table = new Tabulator("#SmartSearchReportsUITabulator", {
            rowHeight: 15,
            selectable: true,
            selectableRangeMode:"click",
            layout: "fitColumns",
            columns: tabulatorColumes,
        });

        SmartSearchReportsUI._table.on("rowSelectionChanged", async function (e, row) {
            var rows = SmartSearchReportsUI._table.getSelectedData();

            SmartSearchReportsUI._viewer.selectionManager.clear();
            let selections = [];
            if (rows.length == 1) { 
                SmartSearchReportsUI._viewer.selectionManager.selectNode(rows[0].id, Communicator.SelectionMode.Set);
            }
            else {
                for (let i = 0; i < rows.length; i++) {
                    selections.push(new Communicator.Selection.SelectionItem(rows[i].id));
                }
                SmartSearchReportsUI._viewer.selectionManager.add(selections);
            }
                    
        });

        SmartSearchReportsUI._table.on("tableBuilt", function () {
            let tdata = SmartSearchReportsUI._results.getExpandedTableData(nodeids,SmartSearchReportsUI._tablePropertyExpanded0,SmartSearchReportsUI._tablePropertyExpanded1);
            SmartSearchReportsUI._table.setData(tdata);
        });
    }   
}