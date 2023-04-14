import { SmartSearchEditorUI } from './SmartSearchEditorUI.js';

export class SmartSearchResultsUI {

    static initialize(maindiv, manager) {
        SmartSearchResultsUI._maindiv = maindiv;
        SmartSearchResultsUI._manager = manager;
        SmartSearchResultsUI._viewer = manager._viewer;
        SmartSearchResultsUI._isPropertyView = false;
        SmartSearchResultsUI._tablePropertyAMT = "--EMPTY--";
        SmartSearchResultsUI._aggType = "sum";
        SmartSearchResultsUI._tablePropertyExpanded1 = "--EMPTY--";
        SmartSearchResultsUI._tablePropertyExpanded2 = "--EMPTY--";

        SmartSearchResultsUI._viewer.setCallbacks({
            selectionArray: function (selarray, removed) {
                if (!SmartSearchResultsUI._isPropertyView) {
                    SmartSearchResultsUI.generateSearchResults(SmartSearchEditorUI._founditems);
                }
            },
        });

    }

    static async display() {
        let html = "";
        html += '<div id = "SmartSearchResultsUIFirstRow" style="position:relative;width:100%;height:15px;top:-8px">';
        html += '<div style="position:absolute; left:3px;top:5px; font-size:14px;background-color:white" id="' + SmartSearchResultsUI._maindiv + '_found"></div>';
        html += SmartSearchResultsUI._generateDropdown();
        html += '<button class="SmartSearchSearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick=\'hcSmartSearch.SmartSearchEditorUI.selectAll(this)\'>Select</button>';
        html += '<button id="SmartSearchToggleViewButton" class="SmartSearchSearchButton" type="button" style="right:90px;top:3px;position:absolute;" onclick=\'hcSmartSearch.SmartSearchResultsUI.toggleView(this)\'>Property View</button>';
        html += '</div>';

        html += '<div id="' + SmartSearchResultsUI._maindiv + '_searchitems" class="SmartSearchSearchItems">';
        html += '</div>';
        html += '<div style="position:absolute; right:20px;bottom:0px; font-size:12px;background-color:white" id="' + SmartSearchResultsUI._maindiv + '_found"></div>';

        $("#" + SmartSearchResultsUI._maindiv).empty();
        $("#" + SmartSearchResultsUI._maindiv).append(html);

        const SmartSearchDropdowButton = document.querySelector('#SmartSearchResultsUIDropdown');
        const SmartSearchDropdowContent = document.querySelector('#SmartSearchResultsUIDropdownContent');

        SmartSearchDropdowButton.addEventListener('click', function () {
            SmartSearchDropdowContent.classList.toggle('SmartSearchDropdowShow');
        });

        window.addEventListener('click', function (event) {
            if (!event.target.matches('.SmartSearchDropdow-button')) {
                if (SmartSearchDropdowContent.classList.contains('SmartSearchDropdowShow')) {
                    SmartSearchDropdowContent.classList.remove('SmartSearchDropdowShow');
                }
            }
        });

    }
    
    static getAmountStrings(items) {

        let amountStrings = [];
        amountStrings.push("--EMPTY--");
        for (let i = 0; i < items.length; i++) {
            let ltext = items[i].toLowerCase();
            if (ltext.indexOf("version") != -1 || ltext.indexOf("globalid") != -1 || ltext.indexOf("name") != -1 || ltext.indexOf("date") != -1 || ltext.indexOf("persistentid") != -1) {
                continue;
            }
            let prop = SmartSearchResultsUI._manager._allPropertiesHash[items[i]];
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
   
    static _propertySelected() {
        SmartSearchResultsUI._results.setTableProperty($("#SmartSearchPropSelect")[0].value);
        SmartSearchEditorUI._mainFilter.setAutoColors(null, null);
        SmartSearchResultsUI._generatePropertyView();

    }

    static _propertyExpandedSelected(num) {
        if (num == 0) {
            SmartSearchResultsUI._tablePropertyExpanded0 = $("#SmartSearchPropExpandedSelect0")[0].value;
        }
        else if (num == 1) {
            SmartSearchResultsUI._tablePropertyExpanded1 = $("#SmartSearchPropExpandedSelect1")[0].value;
        }
        SmartSearchResultsUI.generateExpandedResults();

    }

    static _propertyAggTypeSelected() {
        SmartSearchResultsUI._aggType = $("#SmartSearchPropAggType")[0].value;
        SmartSearchResultsUI._generatePropertyView();

    }

    static _propertyAMTSelected() {
        SmartSearchResultsUI._tablePropertyAMT = $("#SmartSearchPropSelectAMT")[0].value;
        SmartSearchResultsUI._generatePropertyView();

    }

    static applyColors() {
        let autoColors = SmartSearchEditorUI._mainFilter.getAutoColors();
        if (!autoColors) {
            return;
        }
        for (let i in SmartSearchResultsUI._results.getCategoryHash()) {
            if (autoColors[i]) {
                SmartSearchEditorUI._viewer.model.setNodesFaceColor(SmartSearchResultsUI._results.getCategoryHash()[i].ids, autoColors[i]);
            }
        }
    }

    static _assignColorsMainGradient() {    

        let rows = SmartSearchResultsUI._table.getRows();
        let delta = 256/rows.length;
        for (let i=0;i<rows.length;i++) {
            let m = delta * rows[i].getPosition();
            SmartSearchResultsUI._results.getCategoryHash()[rows[i].getData().id].color = new Communicator.Color(m,m,m);
        }

        let autoColors = [];
        for (let i in SmartSearchResultsUI._results.getCategoryHash()) {
            autoColors[i] = SmartSearchResultsUI._results.getCategoryHash()[i].color;
        }
        SmartSearchEditorUI._mainFilter.setAutoColors(autoColors, SmartSearchResultsUI._results.getTableProperty());
        SmartSearchResultsUI._updateColorsInTable();
    }

    static _updateColorsInTable() {
        let tdata = [];
        for (let i in SmartSearchResultsUI._results.getCategoryHash()) {
            let color = SmartSearchResultsUI._results.getCategoryHash()[i].color;
            let data = { color: 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',1)',id: i };
            tdata.push(data);
        }
        SmartSearchResultsUI._table.updateData(tdata);
    }

    static _assignExpandedColorsGradient(column) {

        let tdata = SmartSearchResultsUI._results.caculateExpandedColorsGradient(column,this._expandedNodeIds,this._tablePropertyExpanded0,this._tablePropertyExpanded1);
       
        SmartSearchResultsUI._table.updateData(tdata);
    }

    static applyExpandedColors() {
        let rows = SmartSearchResultsUI._table.getRows();
        for (let i = 0; i < rows.length; i++) {
            let m = rows[i].getData().colorsav;
            SmartSearchEditorUI._viewer.model.setNodesFaceColor([rows[i].getData().id], new Communicator.Color(m, m, m));
        }
    }

    static _assignColorsGradient(column) {
     
        let pname = column;
        if (column == "name") {
            if (!SmartSearchResultsUI._results.isNumberProp(SmartSearchResultsUI._results.getTableProperty())) {
                SmartSearchResultsUI._assignColorsMainGradient();
                return;
            }
            pname = SmartSearchResultsUI._results.getTableProperty();
        }
        SmartSearchResultsUI._results.calculateGradientData(pname,SmartSearchResultsUI._tablePropertyAMT,SmartSearchResultsUI._aggType);
      
        SmartSearchResultsUI._updateColorsInTable();
    }


    static assignColorsRandom() {
        for (let i in SmartSearchResultsUI._results.getCategoryHash()) {
            let color = new Communicator.Color(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
            SmartSearchResultsUI._results.getCategoryHash()[i].color = color;
        }

        let autoColors = [];
        for (let i in SmartSearchResultsUI._results.getCategoryHash()) {
            autoColors[i] = SmartSearchResultsUI._results.getCategoryHash()[i].color;
        }

        SmartSearchEditorUI._mainFilter.setAutoColors(autoColors, SmartSearchResultsUI._results.getTableProperty());
        SmartSearchResultsUI._updateColorsInTable();

    }

    static _clearColors() {
        SmartSearchEditorUI._mainFilter.setAutoColors(null,null);
        let tdata = [];
        for (let i in SmartSearchResultsUI._results.getCategoryHash()) {
            SmartSearchResultsUI._results.getCategoryHash()[i].color = undefined;
            let data = { color: null,id: i };
            tdata.push(data);
        }
        SmartSearchResultsUI._table.updateData(tdata);
    }

    static _generatePropertyView(redrawOnly = false) {

        $("#SmartSearchResultsUIFirstRow").css("display", "block");
        if (SmartSearchEditorUI._mainFilter.getAutoColorProperty()) {
            SmartSearchResultsUI._results.setTableProperty(SmartSearchEditorUI._mainFilter.getAutoColorProperty());
        }

        let sortedStrings = SmartSearchResultsUI._results.getAllProperties();

        if (!redrawOnly) {
            let found = false;
            if (SmartSearchResultsUI._results.getTableProperty()) {
                for (let i = 0; i < sortedStrings.length; i++) {
                    if (sortedStrings[i] == SmartSearchResultsUI._results.getTableProperty()) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                SmartSearchResultsUI._results.setTableProperty(null);
            }

            SmartSearchResultsUI._results.findCategoryFromSearch();
        }

        $("#SmartSearchToggleViewButton").html("Search View");

        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").empty();
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").css("overflow", "inherit");
        $("#" + SmartSearchResultsUI._maindiv + "_found").empty();

        let amountStrings = SmartSearchResultsUI.getAmountStrings(sortedStrings);

        let html = '<div style="height:25px;"><span style="top:-16px;position:relative"><span style="font-family:courier">Prop:</span><select id="SmartSearchPropSelect" onchange=\'hcSmartSearch.SmartSearchResultsUI._propertySelected();\' class="SmartSearchPropertyResultsSelect" value="">';

        for (let i = 0; i < sortedStrings.length; i++) {
            if (SmartSearchResultsUI._results.getTableProperty() == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:4px;left:0px;position:absolute"><span style="font-family:courier">AMT :</span><select id="SmartSearchPropSelectAMT" onchange=\'hcSmartSearch.SmartSearchResultsUI._propertyAMTSelected();\' class="SmartSearchPropertyResultsSelect" value="">';
        for (let i = 0; i < amountStrings.length; i++) {
            if (SmartSearchResultsUI._tablePropertyAMT == amountStrings[i])
                html += '<option value="' + amountStrings[i] + '" selected>' + amountStrings[i] + '</option>\n';
            else
                html += '<option value="' + amountStrings[i] + '">' + amountStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:4px;left:186px;position:absolute"><span style="font-family:courier"></span><select id="SmartSearchPropAggType" onchange=\'hcSmartSearch.SmartSearchResultsUI._propertyAggTypeSelected();\' class="SmartSearchPropertyAggTypeSelect" value="">';
        let choices = ["sum", "avg", "max", "min", "med"];
        for (let i = 0; i < choices.length; i++) {
            if (SmartSearchResultsUI._aggType == choices[i])
                html += '<option value="' + choices[i] + '" selected>' + choices[i] + '</option>\n';
            else
                html += '<option value="' + choices[i] + '">' + choices[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<button class="SmartSearchSearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick="hcSmartSearch.SmartSearchResultsUI.applyColors()">Apply Colors</button>';
        html += '</div>';

        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").append(html);

        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").append('<div class = "SmartSearchResultsUITabulator" id = "SmartSearchResultsUITabulator"></div>');


        let sorter = undefined;
        if (SmartSearchResultsUI._results.getTableProperty().indexOf("Date") != -1) {
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
                    SmartSearchResultsUI.assignColorsRandom();
                }
            },
            {
                label: "<i class='fas fa-user'></i> Assign Gradient",
                action: async function (e, column) {
                    SmartSearchResultsUI._assignColorsGradient(column.getDefinition().field);
                }
            },
            {
                label: "<i class='fas fa-user'></i> Clear Colors",
                action: async function (e, column) {
                    SmartSearchResultsUI._clearColors();
                }
            },
            
        ];

        let firstColumnTitle = SmartSearchResultsUI._results.getTableProperty();
        if (SmartSearchResultsUI._results.isNumberProp(SmartSearchResultsUI._results.getTableProperty())) {

            let unit = SmartSearchResultsUI._results.getAMTUnit(SmartSearchResultsUI._results.getTableProperty());
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

        if (SmartSearchResultsUI._tablePropertyAMT != "--EMPTY--") {

            let unit = SmartSearchResultsUI._results.getAMTUnit(SmartSearchResultsUI._tablePropertyAMT);
            let unitTitle = "";
            if (unit) {
                unitTitle = SmartSearchResultsUI._aggType + "(" + unit + ")";
            }
            else {
                unitTitle = SmartSearchResultsUI._aggType;
            }
            tabulatorColumes.splice(1, 0, {
                headerMenu:columnMenu,title: unitTitle, field: "amt", width: 120,bottomCalc:SmartSearchResultsUI._aggType != "med" ? SmartSearchResultsUI._aggType: undefined
            });
        }

        let rowMenu = [
            {
                label: "<i class='fas fa-user'></i> View Category",
                action: async function (e, row) {
                    let ids = SmartSearchResultsUI._results.getCategoryHash()[row.getData().id].ids;
                    if  (SmartSearchResultsUI._results.getTableProperty().slice(-2) == "/*") { 
                        let rd = row.getData().id.split("/");
                        SmartSearchResultsUI._tablePropertyExpanded0 = SmartSearchResultsUI._results.getTableProperty().slice(0, -2) + "/" + rd[0];
                    }
                    else {
                        SmartSearchResultsUI._tablePropertyExpanded0 = SmartSearchResultsUI._results.getTableProperty();
                    }
                    SmartSearchResultsUI._tablePropertyExpanded1 = SmartSearchResultsUI._tablePropertyAMT;
                    SmartSearchResultsUI.generateExpandedResults(ids);
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
                    SmartSearchResultsUI._tablePropertyExpanded0 = SmartSearchResultsUI._results.getTableProperty();
                    SmartSearchResultsUI._tablePropertyExpanded1 = SmartSearchResultsUI._tablePropertyAMT;
                    SmartSearchResultsUI.generateExpandedResults(ids);
                }
            },          
            
        ];

        SmartSearchResultsUI._table = new Tabulator("#SmartSearchResultsUITabulator", {
            rowHeight: 15,
            selectable: 0,
            layout: "fitColumns",
            columns: tabulatorColumes,
            rowContextMenu: rowMenu
        });

        SmartSearchResultsUI._table.on("rowClick", async function (e, row) {
            let data = row.getData();

            let ids = SmartSearchResultsUI._results.getCategoryHash()[data.id].ids;
            SmartSearchResultsUI._viewer.selectionManager.clear();
            if (ids.length == 1) {
                SmartSearchResultsUI._viewer.selectionManager.selectNode(ids[0], Communicator.SelectionMode.Set);
            }
            else {
                let selections = [];
                for (let i = 0; i < ids.length; i++) {
                    selections.push(new Communicator.Selection.SelectionItem(ids[i]));
                }
                SmartSearchResultsUI._viewer.selectionManager.add(selections);
            }

        });

        SmartSearchResultsUI._table.on("tableBuilt", function () {
            let tdata = SmartSearchResultsUI._results.getCategoryTableData(SmartSearchResultsUI._tablePropertyAMT,SmartSearchResultsUI._aggType);
            SmartSearchResultsUI._table.setData(tdata);
        });

        SmartSearchResultsUI._table.on("cellEdited", function (cell) {
            if (cell.getField() == "color") {
                let autoColors = SmartSearchEditorUI._mainFilter.getAutoColors();
                if (!autoColors) {
                    autoColors = [];
                    SmartSearchEditorUI._mainFilter.setAutoColors(autoColors, SmartSearchResultsUI._results.getTableProperty());
                }
                let data = cell.getRow().getData();
                autoColors[data.id] = SmartSearchResultsUI._results.convertColor(data.color);
            }
            SmartSearchResultsUI._table.redraw();
        });      
    }

    static generateExpandedResults(nodeids_in = null) {

        let nodeids;
        if (nodeids_in) {
            SmartSearchResultsUI._expandedNodeIds = nodeids_in;
            nodeids = nodeids_in;
        }
        else {
            nodeids = SmartSearchResultsUI._expandedNodeIds;
        }

        this._expandedNodeIds = nodeids;

        if (SmartSearchResultsUI._tablePropertyExpanded0.indexOf("Node Name") != -1) {
            SmartSearchResultsUI._tablePropertyExpanded0 = "Node Type";
        }

        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").empty();
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").css("overflow", "inherit");
        $("#" + SmartSearchResultsUI._maindiv + "_found").empty();
        $("#SmartSearchResultsUIFirstRow").css("display", "none");

        let sortedStrings = SmartSearchResultsUI._results.getAllProperties();
        sortedStrings.shift();
        sortedStrings.shift();

        let html = '<div style="height:35px;">';
        html += '<button class="SmartSearchSearchButton" type="button" style="right:5px;top:-5px;position:absolute;" onclick=\'hcSmartSearch.SmartSearchResultsUI._generatePropertyView(true)\'>Property View</button>';
        html += '<button class="SmartSearchSearchButton" type="button" style="right:5px;top:17px;position:absolute;" onclick="hcSmartSearch.SmartSearchResultsUI.applyExpandedColors()">Apply Colors</button>';
        html += '<div style="height:25px;"><span style="top:-5px;position:relative"><span style="font-family:courier">Prop1:</span><select id="SmartSearchPropExpandedSelect0" onchange=\'hcSmartSearch.SmartSearchResultsUI._propertyExpandedSelected(0);\' class="SmartSearchPropertyResultsSelect" value="">';
        
        for (let i = 0; i < sortedStrings.length; i++) {
            if (SmartSearchResultsUI._tablePropertyExpanded0 == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:15px;left:0px;position:absolute"><span style="font-family:courier">Prop2:</span><select id="SmartSearchPropExpandedSelect1" onchange=\'hcSmartSearch.SmartSearchResultsUI._propertyExpandedSelected(1);\' class="SmartSearchPropertyResultsSelect" value="">';
        sortedStrings.unshift("--EMPTY--");

        for (let i = 0; i < sortedStrings.length; i++) {
            if (SmartSearchResultsUI._tablePropertyExpanded1 == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
         
        html += '</div>';
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").append(html);
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").append('<div class = "SmartSearchResultsUITabulator" id = "SmartSearchResultsUITabulator"></div>');

        let title1 = SmartSearchResultsUI._tablePropertyExpanded0;

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
                    SmartSearchResultsUI._assignExpandedColorsGradient(column.getDefinition().field);
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
        if (SmartSearchResultsUI._results.isNumberProp(SmartSearchResultsUI._tablePropertyExpanded0)) {
            let unit = SmartSearchResultsUI._results.getAMTUnit(SmartSearchResultsUI._tablePropertyExpanded0);
            if (unit) {
                unitTitle = "(" + unit + ")";
                bcalc = "sum";
            }
            else {
                unitTitle = SmartSearchResultsUI._tablePropertyExpanded0;
            }
        }
        else {
            unitTitle = SmartSearchResultsUI._tablePropertyExpanded0;
        }
        tabulatorColumes.splice(1, 0, {
            headerMenu:columnMenu, title: unitTitle, field: "prop1", bottomCalc:bcalc, sorter:SmartSearchResultsUI._tablePropertyExpanded0.indexOf("Date") != -1 ? sorter : undefined
        });

        let bcalc2 = undefined;

        if (SmartSearchResultsUI._tablePropertyExpanded1 != "--EMPTY--") {

            let unitTitle = "";
            if (SmartSearchResultsUI._results.isNumberProp(SmartSearchResultsUI._tablePropertyExpanded1)) {
                let unit = SmartSearchResultsUI._results.getAMTUnit(SmartSearchResultsUI._tablePropertyExpanded1);
                if (unit) {
                    unitTitle = "(" + unit + ")";
                    bcalc2 = "sum";
                }
                else {
                    unitTitle = SmartSearchResultsUI._tablePropertyExpanded1;
                }
            }
            else {
                unitTitle = SmartSearchResultsUI._tablePropertyExpanded1;
            }
            tabulatorColumes.splice(2, 0, {
                headerMenu:columnMenu,title: unitTitle, field: "prop2", bottomCalc: bcalc2, sorter:SmartSearchResultsUI._tablePropertyExpanded1.indexOf("Date") != -1 ? sorter : undefined
            });
        }

        SmartSearchResultsUI._table = new Tabulator("#SmartSearchResultsUITabulator", {
            rowHeight: 15,
            selectable: true,
            selectableRangeMode:"click",
            layout: "fitColumns",
            columns: tabulatorColumes,
        });

        SmartSearchResultsUI._table.on("rowSelectionChanged", async function (e, row) {
            var rows = SmartSearchResultsUI._table.getSelectedData();

            SmartSearchResultsUI._viewer.selectionManager.clear();
            let selections = [];
            if (rows.length == 1) { 
                SmartSearchResultsUI._viewer.selectionManager.selectNode(rows[0].id, Communicator.SelectionMode.Set);
            }
            else {
                for (let i = 0; i < rows.length; i++) {
                    selections.push(new Communicator.Selection.SelectionItem(rows[i].id));
                }
                SmartSearchResultsUI._viewer.selectionManager.add(selections);
            }
                    
        });

        SmartSearchResultsUI._table.on("tableBuilt", function () {
            let tdata = SmartSearchResultsUI._results.getExpandedTableData(nodeids,SmartSearchResultsUI._tablePropertyExpanded0,SmartSearchResultsUI._tablePropertyExpanded1);
            SmartSearchResultsUI._table.setData(tdata);
        });
    }

    static toggleView() {
        SmartSearchResultsUI._isPropertyView = !SmartSearchResultsUI._isPropertyView;
        if (SmartSearchResultsUI._isPropertyView) {
            SmartSearchResultsUI._generatePropertyView();
        }
        else {
            SmartSearchResultsUI.generateSearchResults(SmartSearchEditorUI._founditems);
        }
    }

    static generateSearchResults(founditems_in) {
        SmartSearchResultsUI._results = founditems_in;
        $("#SmartSearchResultsUIFirstRow").css("display", "block");
        $("#SmartSearchToggleViewButton").html("Property View");
        SmartSearchResultsUI._isPropertyView = false;
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").empty();
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").css("overflow", "auto");
        $("#" + SmartSearchResultsUI._maindiv + "_found").empty();
        if (founditems_in == undefined) {
            return;
        }

        let founditems = founditems_in.getItems();

        if (founditems.length == 1) {
            $("#" + SmartSearchResultsUI._maindiv + "_found").append(founditems.length + " item found / " + SmartSearchEditorUI._founditems.getTotalSearchCount() + " searched");
        }
        else {
            $("#" + SmartSearchResultsUI._maindiv + "_found").append(founditems.length + " items found / " + SmartSearchEditorUI._founditems.getTotalSearchCount() + " searched");
        }

        let html = "";
        let y = 0;
        let toggle = true;

        let more = false;
        let lend = founditems.length;
        if (founditems.length > 2000) {
            lend = 2000;
            more = true;
        }

        for (let i = 0; i < lend; i++) {
            toggle = !toggle;
            if (SmartSearchResultsUI._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(founditems[i].id))) {
                let parent = SmartSearchResultsUI._viewer.model.getNodeParent(founditems[i].id);
                if (SmartSearchResultsUI._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(parent))) {
                    if (toggle) {
                        html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItemselectedIndirect">';
                    }
                    else {
                        html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItemselectedIndirect2">';
                    }
                }
                else {
                    if (toggle) {
                        html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItemselected">';
                    }
                    else {
                        html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItemselected2">';
                    }
                }
            }
            else {
                if (toggle) {
                    html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItem1">';
                }
                else {
                    html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItem2">';
                }
            }

            html += '<div class="SmartSearchSearchItemText">' + SmartSearchEditorUI._htmlEncode(founditems[i].name) + '</div>';
            html += '<div class="SmartSearchSearchItemChainText">' + SmartSearchEditorUI._htmlEncode(founditems[i].chaintext) + '</div>';
            html += '</div>';
            y++;
        }
        if (more) {
            html += '<div style="left:3px;" >More...</div>';
        }

        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").append(html);
        SmartSearchResultsUI.adjust();
    }

    static adjust() {

        let newheight = $("#" + SmartSearchEditorUI._maindiv).height() - ($("#" + SmartSearchResultsUI._maindiv + "_searchitems").offset().top - $("#" + SmartSearchEditorUI._maindiv).parent().offset().top);
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").css({ "height": newheight + "px" });


        let gap = newheight + $("#" + SmartSearchEditorUI._maindiv + "_conditions").height() + 3;
        if (SmartSearchEditorUI._showFirstRow) {
            gap += $("#" + SmartSearchEditorUI._maindiv + "_firstrow").height();
        }
    }

    static _select(id) {
        if (!SmartSearchEditorUI.ctrlPressed)
            SmartSearchResultsUI._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Set);
        else
            SmartSearchResultsUI._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Toggle);

        SmartSearchResultsUI.generateSearchResults(SmartSearchEditorUI._founditems);
    }

    static _generateDropdown() {
        let html = "";
        html += '<button id="SmartSearchResultsUIDropdown" style="right:56px;top:3px;position:absolute;" class="SmartSearchSearchButton SmartSearchDropdow-button">...</button>';
        html += '<ul  id="SmartSearchResultsUIDropdownContent" style="right:22px;top:10px;position:absolute;" class="SmartSearchDropdow-content">';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.selectAll(this)\'>Select</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().isolateAll(this)\'>Isolate</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().makeVisible(true)\'>Show</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().makeVisible(false)\'>Hide</li>';
        html += '<li >---</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(255,0,0))\'>Red</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(0,255,0))\'>Green</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(0,0,255))\'>Blue</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(255,255,0))\'>Yellow</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(128,128,128))\'>Grey</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().setOpacity(0.7)\'>Transparent</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().setOpacity(1)\'>Opaque</li>';
        html += '</ul>';
        return html;
    }
}