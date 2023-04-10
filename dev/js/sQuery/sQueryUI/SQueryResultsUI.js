import { SQueryEditorUI } from './SQueryEditorUI.js';

export class SQueryResultsUI {

    static initialize(maindiv, manager) {
        SQueryResultsUI._maindiv = maindiv;
        SQueryResultsUI._manager = manager;
        SQueryResultsUI._viewer = manager._viewer;
        SQueryResultsUI._isPropertyView = false;
        SQueryResultsUI._tablePropertyAMT = "--EMPTY--";
        SQueryResultsUI._aggType = "sum";
        SQueryResultsUI._tablePropertyExpanded1 = "--EMPTY--";
        SQueryResultsUI._tablePropertyExpanded2 = "--EMPTY--";

    }

    static async display() {
        let html = "";
        html += '<div id = "SQueryResultsUIFirstRow" style="position:relative;width:100%;height:15px;top:-8px">';
        html += '<div style="position:absolute; left:3px;top:5px; font-size:14px;background-color:white" id="' + SQueryResultsUI._maindiv + '_found"></div>';
        html += SQueryResultsUI._generateDropdown();
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick=\'hcSQuery.SQueryEditorUI.selectAll(this)\'>Select</button>';
        html += '<button id="SQueryToggleViewButton" class="SQuerySearchButton" type="button" style="right:90px;top:3px;position:absolute;" onclick=\'hcSQuery.SQueryResultsUI.toggleView(this)\'>Property View</button>';
        html += '</div>';

        html += '<div id="' + SQueryResultsUI._maindiv + '_searchitems" class="SQuerySearchItems">';
        html += '</div>';
        html += '<div style="position:absolute; right:20px;bottom:0px; font-size:12px;background-color:white" id="' + SQueryResultsUI._maindiv + '_found"></div>';

        $("#" + SQueryResultsUI._maindiv).empty();
        $("#" + SQueryResultsUI._maindiv).append(html);

        const SQueryDropdowButton = document.querySelector('#SQueryResultsUIDropdown');
        const SQueryDropdowContent = document.querySelector('#SQueryResultsUIDropdownContent');

        SQueryDropdowButton.addEventListener('click', function () {
            SQueryDropdowContent.classList.toggle('SQueryDropdowShow');
        });

        window.addEventListener('click', function (event) {
            if (!event.target.matches('.SQueryDropdow-button')) {
                if (SQueryDropdowContent.classList.contains('SQueryDropdowShow')) {
                    SQueryDropdowContent.classList.remove('SQueryDropdowShow');
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
            let prop = SQueryResultsUI._manager._allPropertiesHash[items[i]];
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
        SQueryResultsUI._results.setTableProperty($("#SQueryPropSelect")[0].value);
        SQueryEditorUI._mainFilter.setAutoColors(null, null);
        SQueryResultsUI._generatePropertyView();

    }

    static _propertyExpandedSelected(num) {
        if (num == 0) {
            SQueryResultsUI._tablePropertyExpanded0 = $("#SQueryPropExpandedSelect0")[0].value;
        }
        else if (num == 1) {
            SQueryResultsUI._tablePropertyExpanded1 = $("#SQueryPropExpandedSelect1")[0].value;
        }
        SQueryResultsUI.generateExpandedResults();

    }

    static _propertyAggTypeSelected() {
        SQueryResultsUI._aggType = $("#SQueryPropAggType")[0].value;
        SQueryResultsUI._generatePropertyView();

    }

    static _propertyAMTSelected() {
        SQueryResultsUI._tablePropertyAMT = $("#SQueryPropSelectAMT")[0].value;
        SQueryResultsUI._generatePropertyView();

    }

    static applyColors() {
        let autoColors = SQueryEditorUI._mainFilter.getAutoColors();
        if (!autoColors) {
            return;
        }
        for (let i in SQueryResultsUI._results.getCategoryHash()) {
            if (autoColors[i]) {
                SQueryEditorUI._viewer.model.setNodesFaceColor(SQueryResultsUI._results.getCategoryHash()[i].ids, autoColors[i]);
            }
        }
    }

    static _assignColorsMainGradient() {    

        let rows = SQueryResultsUI._table.getRows();
        let delta = 256/rows.length;
        for (let i=0;i<rows.length;i++) {
            let m = delta * rows[i].getPosition();
            SQueryResultsUI._results.getCategoryHash()[rows[i].getData().id].color = new Communicator.Color(m,m,m);
        }

        let autoColors = [];
        for (let i in SQueryResultsUI._results.getCategoryHash()) {
            autoColors[i] = SQueryResultsUI._results.getCategoryHash()[i].color;
        }
        SQueryEditorUI._mainFilter.setAutoColors(autoColors, SQueryResultsUI._results.getTableProperty());
        SQueryResultsUI._updateColorsInTable();
    }

    static _updateColorsInTable() {
        let tdata = [];
        for (let i in SQueryResultsUI._results.getCategoryHash()) {
            let color = SQueryResultsUI._results.getCategoryHash()[i].color;
            let data = { color: 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',1)',id: i };
            tdata.push(data);
        }
        SQueryResultsUI._table.updateData(tdata);
    }

    static _assignExpandedColorsGradient(column) {

        let tdata = SQueryResultsUI._results.caculateExpandedColorsGradient(column,this._expandedNodeIds,this._tablePropertyExpanded0,this._tablePropertyExpanded1);
       
        SQueryResultsUI._table.updateData(tdata);
    }

    static applyExpandedColors() {
        let rows = SQueryResultsUI._table.getRows();
        for (let i = 0; i < rows.length; i++) {
            let m = rows[i].getData().colorsav;
            SQueryEditorUI._viewer.model.setNodesFaceColor([rows[i].getData().id], new Communicator.Color(m, m, m));
        }
    }

    static _assignColorsGradient(column) {
     
        let pname = column;
        if (column == "name") {
            if (!SQueryResultsUI._results.isNumberProp(SQueryResultsUI._results.getTableProperty())) {
                SQueryResultsUI._assignColorsMainGradient();
                return;
            }
            pname = SQueryResultsUI._results.getTableProperty();
        }
        SQueryResultsUI._results.calculateGradientData(pname,SQueryResultsUI._tablePropertyAMT,SQueryResultsUI._aggType);
      
        SQueryResultsUI._updateColorsInTable();
    }


    static assignColorsRandom() {
        for (let i in SQueryResultsUI._results.getCategoryHash()) {
            let color = new Communicator.Color(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
            SQueryResultsUI._results.getCategoryHash()[i].color = color;
        }

        let autoColors = [];
        for (let i in SQueryResultsUI._results.getCategoryHash()) {
            autoColors[i] = SQueryResultsUI._results.getCategoryHash()[i].color;
        }

        SQueryEditorUI._mainFilter.setAutoColors(autoColors, SQueryResultsUI._results.getTableProperty());
        SQueryResultsUI._updateColorsInTable();

    }

    static _clearColors() {
        SQueryEditorUI._mainFilter.setAutoColors(null,null);
        let tdata = [];
        for (let i in SQueryResultsUI._results.getCategoryHash()) {
            SQueryResultsUI._results.getCategoryHash()[i].color = undefined;
            let data = { color: null,id: i };
            tdata.push(data);
        }
        SQueryResultsUI._table.updateData(tdata);
    }

    static _generatePropertyView(redrawOnly = false) {

        $("#SQueryResultsUIFirstRow").css("display", "block");
        if (SQueryEditorUI._mainFilter.getAutoColorProperty()) {
            SQueryResultsUI._results.setTableProperty(SQueryEditorUI._mainFilter.getAutoColorProperty());
        }

        let sortedStrings = SQueryResultsUI._results.getAllProperties();

        if (!redrawOnly) {
            let found = false;
            if (SQueryResultsUI._results.getTableProperty()) {
                for (let i = 0; i < sortedStrings.length; i++) {
                    if (sortedStrings[i] == SQueryResultsUI._results.getTableProperty()) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                SQueryResultsUI._results.setTableProperty(null);
            }

            SQueryResultsUI._results.findCategoryFromSearch();
        }

        $("#SQueryToggleViewButton").html("Search View");

        $("#" + SQueryResultsUI._maindiv + "_searchitems").empty();
        $("#" + SQueryResultsUI._maindiv + "_searchitems").css("overflow", "inherit");
        $("#" + SQueryResultsUI._maindiv + "_found").empty();

        let amountStrings = SQueryResultsUI.getAmountStrings(sortedStrings);

        let html = '<div style="height:25px;"><span style="top:-16px;position:relative"><span style="font-family:courier">Prop:</span><select id="SQueryPropSelect" onchange=\'hcSQuery.SQueryResultsUI._propertySelected();\' class="SQueryPropertyResultsSelect" value="">';

        for (let i = 0; i < sortedStrings.length; i++) {
            if (SQueryResultsUI._results.getTableProperty() == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:4px;left:0px;position:absolute"><span style="font-family:courier">AMT :</span><select id="SQueryPropSelectAMT" onchange=\'hcSQuery.SQueryResultsUI._propertyAMTSelected();\' class="SQueryPropertyResultsSelect" value="">';
        for (let i = 0; i < amountStrings.length; i++) {
            if (SQueryResultsUI._tablePropertyAMT == amountStrings[i])
                html += '<option value="' + amountStrings[i] + '" selected>' + amountStrings[i] + '</option>\n';
            else
                html += '<option value="' + amountStrings[i] + '">' + amountStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:4px;left:186px;position:absolute"><span style="font-family:courier"></span><select id="SQueryPropAggType" onchange=\'hcSQuery.SQueryResultsUI._propertyAggTypeSelected();\' class="SQueryPropertyAggTypeSelect" value="">';
        let choices = ["sum", "avg", "max", "min", "med"];
        for (let i = 0; i < choices.length; i++) {
            if (SQueryResultsUI._aggType == choices[i])
                html += '<option value="' + choices[i] + '" selected>' + choices[i] + '</option>\n';
            else
                html += '<option value="' + choices[i] + '">' + choices[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick="hcSQuery.SQueryResultsUI.applyColors()">Apply Colors</button>';
        html += '</div>';

        $("#" + SQueryResultsUI._maindiv + "_searchitems").append(html);

        $("#" + SQueryResultsUI._maindiv + "_searchitems").append('<div class = "SQueryResultsUITabulator" id = "SQueryResultsUITabulator"></div>');


        let sorter = undefined;
        if (SQueryResultsUI._results.getTableProperty().indexOf("Date") != -1) {
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
                    SQueryResultsUI.assignColorsRandom();
                }
            },
            {
                label: "<i class='fas fa-user'></i> Assign Gradient",
                action: async function (e, column) {
                    SQueryResultsUI._assignColorsGradient(column.getDefinition().field);
                }
            },
            {
                label: "<i class='fas fa-user'></i> Clear Colors",
                action: async function (e, column) {
                    SQueryResultsUI._clearColors();
                }
            },
            
        ];

        let firstColumnTitle = SQueryResultsUI._results.getTableProperty();
        if (SQueryResultsUI._results.isNumberProp(SQueryResultsUI._results.getTableProperty())) {

            let unit = SQueryResultsUI._results.getAMTUnit(SQueryResultsUI._results.getTableProperty());
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

        if (SQueryResultsUI._tablePropertyAMT != "--EMPTY--") {

            let unit = SQueryResultsUI._results.getAMTUnit(SQueryResultsUI._tablePropertyAMT);
            let unitTitle = "";
            if (unit) {
                unitTitle = SQueryResultsUI._aggType + "(" + unit + ")";
            }
            else {
                unitTitle = SQueryResultsUI._aggType;
            }
            tabulatorColumes.splice(1, 0, {
                headerMenu:columnMenu,title: unitTitle, field: "amt", width: 120,bottomCalc:SQueryResultsUI._aggType != "med" ? SQueryResultsUI._aggType: undefined
            });
        }

        let rowMenu = [
            {
                label: "<i class='fas fa-user'></i> View Category",
                action: async function (e, row) {
                    let ids = SQueryResultsUI._results.getCategoryHash()[row.getData().id].ids;
                    
                    SQueryResultsUI._tablePropertyExpanded0 = SQueryResultsUI._results.getTableProperty();
                    SQueryResultsUI._tablePropertyExpanded1 = SQueryResultsUI._tablePropertyAMT;
                    SQueryResultsUI.generateExpandedResults(ids);
                }
            },
            {
                label: "<i class='fas fa-user'></i> View All",
                action: async function (e, row) {
                    let searchresults = SQueryEditorUI._founditems.getItems();
                    let ids = [];
                    for (let i = 0; i < searchresults.length; i++) {
                        ids.push(searchresults[i].id);
                    }
                    SQueryResultsUI._tablePropertyExpanded0 = SQueryResultsUI._results.getTableProperty();
                    SQueryResultsUI._tablePropertyExpanded1 = SQueryResultsUI._tablePropertyAMT;
                    SQueryResultsUI.generateExpandedResults(ids);
                }
            },          
            
        ];

        SQueryResultsUI._table = new Tabulator("#SQueryResultsUITabulator", {
            rowHeight: 15,
            selectable: 0,
            layout: "fitColumns",
            columns: tabulatorColumes,
            rowContextMenu: rowMenu
        });

        SQueryResultsUI._table.on("rowClick", async function (e, row) {
            let data = row.getData();

            let ids = SQueryResultsUI._results.getCategoryHash()[data.id].ids;
            SQueryResultsUI._viewer.selectionManager.clear();
            if (ids.length == 1) {
                SQueryResultsUI._viewer.selectionManager.selectNode(ids[0], Communicator.SelectionMode.Set);
            }
            else {
                let selections = [];
                for (let i = 0; i < ids.length; i++) {
                    selections.push(new Communicator.Selection.SelectionItem(ids[i]));
                }
                SQueryResultsUI._viewer.selectionManager.add(selections);
            }

        });

        SQueryResultsUI._table.on("tableBuilt", function () {
            let tdata = SQueryResultsUI._results.getCategoryTableData(SQueryResultsUI._tablePropertyAMT,SQueryResultsUI._aggType);
            SQueryResultsUI._table.setData(tdata);
        });

        SQueryResultsUI._table.on("cellEdited", function (cell) {
            if (cell.getField() == "color") {
                let autoColors = SQueryEditorUI._mainFilter.getAutoColors();
                if (!autoColors) {
                    autoColors = [];
                    SQueryEditorUI._mainFilter.setAutoColors(autoColors, SQueryResultsUI._results.getTableProperty());
                }
                let data = cell.getRow().getData();
                autoColors[data.name] = SQueryResultsUI._results.convertColor(data.color);
            }
            SQueryManagerUI._table.redraw();
        });      
    }

    static generateExpandedResults(nodeids_in = null) {

        let nodeids;
        if (nodeids_in) {
            SQueryResultsUI._expandedNodeIds = nodeids_in;
            nodeids = nodeids_in;
        }
        else {
            nodeids = SQueryResultsUI._expandedNodeIds;
        }

        this._expandedNodeIds = nodeids;

        if (SQueryResultsUI._tablePropertyExpanded0.indexOf("Node Name") != -1) {
            SQueryResultsUI._tablePropertyExpanded0 = "Node Type";
        }

        $("#" + SQueryResultsUI._maindiv + "_searchitems").empty();
        $("#" + SQueryResultsUI._maindiv + "_searchitems").css("overflow", "inherit");
        $("#" + SQueryResultsUI._maindiv + "_found").empty();
        $("#SQueryResultsUIFirstRow").css("display", "none");

        let sortedStrings = SQueryResultsUI._results.getAllProperties();
        sortedStrings.shift();
        sortedStrings.shift();

        let html = '<div style="height:35px;">';
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:-5px;position:absolute;" onclick=\'hcSQuery.SQueryResultsUI._generatePropertyView(true)\'>Property View</button>';
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:17px;position:absolute;" onclick="hcSQuery.SQueryResultsUI.applyExpandedColors()">Apply Colors</button>';
        html += '<div style="height:25px;"><span style="top:-5px;position:relative"><span style="font-family:courier">Prop1:</span><select id="SQueryPropExpandedSelect0" onchange=\'hcSQuery.SQueryResultsUI._propertyExpandedSelected(0);\' class="SQueryPropertyResultsSelect" value="">';
        
        for (let i = 0; i < sortedStrings.length; i++) {
            if (SQueryResultsUI._tablePropertyExpanded0 == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:15px;left:0px;position:absolute"><span style="font-family:courier">Prop2:</span><select id="SQueryPropExpandedSelect1" onchange=\'hcSQuery.SQueryResultsUI._propertyExpandedSelected(1);\' class="SQueryPropertyResultsSelect" value="">';
        sortedStrings.unshift("--EMPTY--");

        for (let i = 0; i < sortedStrings.length; i++) {
            if (SQueryResultsUI._tablePropertyExpanded1 == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
         
        html += '</div>';
        $("#" + SQueryResultsUI._maindiv + "_searchitems").append(html);
        $("#" + SQueryResultsUI._maindiv + "_searchitems").append('<div class = "SQueryResultsUITabulator" id = "SQueryResultsUITabulator"></div>');

        let title1 = SQueryResultsUI._tablePropertyExpanded0;

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
                    SQueryResultsUI._assignExpandedColorsGradient(column.getDefinition().field);
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
        if (SQueryResultsUI._results.isNumberProp(SQueryResultsUI._tablePropertyExpanded0)) {
            let unit = SQueryResultsUI._results.getAMTUnit(SQueryResultsUI._tablePropertyExpanded0);
            if (unit) {
                unitTitle = "(" + unit + ")";
                bcalc = "sum";
            }
            else {
                unitTitle = SQueryResultsUI._tablePropertyExpanded0;
            }
        }
        else {
            unitTitle = SQueryResultsUI._tablePropertyExpanded0;
        }
        tabulatorColumes.splice(1, 0, {
            headerMenu:columnMenu, title: unitTitle, field: "prop1", bottomCalc:bcalc, sorter:SQueryResultsUI._tablePropertyExpanded0.indexOf("Date") != -1 ? sorter : undefined
        });

        let bcalc2 = undefined;

        if (SQueryResultsUI._tablePropertyExpanded1 != "--EMPTY--") {

            let unitTitle = "";
            if (SQueryResultsUI._results.isNumberProp(SQueryResultsUI._tablePropertyExpanded1)) {
                let unit = SQueryResultsUI._results.getAMTUnit(SQueryResultsUI._tablePropertyExpanded1);
                if (unit) {
                    unitTitle = "(" + unit + ")";
                    bcalc2 = "sum";
                }
                else {
                    unitTitle = SQueryResultsUI._tablePropertyExpanded1;
                }
            }
            else {
                unitTitle = SQueryResultsUI._tablePropertyExpanded1;
            }
            tabulatorColumes.splice(2, 0, {
                headerMenu:columnMenu,title: unitTitle, field: "prop2", bottomCalc: bcalc2, sorter:SQueryResultsUI._tablePropertyExpanded1.indexOf("Date") != -1 ? sorter : undefined
            });
        }

        SQueryResultsUI._table = new Tabulator("#SQueryResultsUITabulator", {
            rowHeight: 15,
            selectable: true,
            selectableRangeMode:"click",
            layout: "fitColumns",
            columns: tabulatorColumes,
        });

        SQueryResultsUI._table.on("rowSelectionChanged", async function (e, row) {
            var rows = SQueryResultsUI._table.getSelectedData();

            SQueryResultsUI._viewer.selectionManager.clear();
            let selections = [];
            if (rows.length == 1) { 
                SQueryResultsUI._viewer.selectionManager.selectNode(rows[0].id, Communicator.SelectionMode.Set);
            }
            else {
                for (let i = 0; i < rows.length; i++) {
                    selections.push(new Communicator.Selection.SelectionItem(rows[i].id));
                }
                SQueryResultsUI._viewer.selectionManager.add(selections);
            }
                    
        });

        SQueryResultsUI._table.on("tableBuilt", function () {
            let tdata = SQueryResultsUI._results.getExpandedTableData(nodeids,SQueryResultsUI._tablePropertyExpanded0,SQueryResultsUI._tablePropertyExpanded1);
            SQueryResultsUI._table.setData(tdata);
        });
    }

    static toggleView() {
        SQueryResultsUI._isPropertyView = !SQueryResultsUI._isPropertyView;
        if (SQueryResultsUI._isPropertyView) {
            SQueryResultsUI._generatePropertyView();
        }
        else {
            SQueryResultsUI.generateSearchResults(SQueryEditorUI._founditems);
        }
    }

    static generateSearchResults(founditems_in) {
        SQueryResultsUI._results = founditems_in;
        $("#SQueryResultsUIFirstRow").css("display", "block");
        $("#SQueryToggleViewButton").html("Property View");
        SQueryResultsUI._isPropertyView = false;
        $("#" + SQueryResultsUI._maindiv + "_searchitems").empty();
        $("#" + SQueryResultsUI._maindiv + "_searchitems").css("overflow", "auto");
        $("#" + SQueryResultsUI._maindiv + "_found").empty();
        if (founditems_in == undefined) {
            return;
        }

        let founditems = founditems_in.getItems();

        if (founditems.length == 1) {
            $("#" + SQueryResultsUI._maindiv + "_found").append(founditems.length + " item found");
        }
        else {
            $("#" + SQueryResultsUI._maindiv + "_found").append(founditems.length + " items found");
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
            if (SQueryResultsUI._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(founditems[i].id))) {
                let parent = SQueryResultsUI._viewer.model.getNodeParent(founditems[i].id);
                if (SQueryResultsUI._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(parent))) {
                    html += '<div onclick=\'hcSQuery.SQueryResultsUI._select("' + founditems[i].id + '")\' class="SQuerySearchItemselectedIndirect">';
                }
                else {
                    html += '<div onclick=\'hcSQuery.SQueryResultsUI._select("' + founditems[i].id + '")\' class="SQuerySearchItemselected">';
                }
            }
            else {
                if (toggle)
                    html += '<div onclick=\'hcSQuery.SQueryResultsUI._select("' + founditems[i].id + '")\' class="SQuerySearchItem1">';
                else
                    html += '<div onclick=\'hcSQuery.SQueryResultsUI._select("' + founditems[i].id + '")\' class="SQuerySearchItem2">';
            }

            html += '<div class="SQuerySearchItemText">' + SQueryEditorUI._htmlEncode(founditems[i].name) + '</div>';
            html += '<div class="SQuerySearchItemChainText">' + SQueryEditorUI._htmlEncode(founditems[i].chaintext) + '</div>';
            html += '</div>';
            y++;
        }
        if (more) {
            html += '<div style="left:3px;" >More...</div>';
        }

        $("#" + SQueryResultsUI._maindiv + "_searchitems").append(html);
        SQueryResultsUI.adjust();
    }

    static adjust() {

        let newheight = $("#" + SQueryEditorUI._maindiv).height() - ($("#" + SQueryResultsUI._maindiv + "_searchitems").offset().top - $("#" + SQueryEditorUI._maindiv).parent().offset().top);
        $("#" + SQueryResultsUI._maindiv + "_searchitems").css({ "height": newheight + "px" });


        let gap = newheight + $("#" + SQueryEditorUI._maindiv + "_conditions").height() + 3;
        if (SQueryEditorUI._showFirstRow) {
            gap += $("#" + SQueryEditorUI._maindiv + "_firstrow").height();
        }
    }

    static _select(id) {
        if (!SQueryEditorUI.ctrlPressed)
            SQueryResultsUI._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Set);
        else
            SQueryResultsUI._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Toggle);

        SQueryResultsUI.generateSearchResults(SQueryEditorUI._founditems);
    }

    static _generateDropdown() {
        let html = "";
        html += '<button id="SQueryResultsUIDropdown" style="right:56px;top:3px;position:absolute;" class="SQuerySearchButton SQueryDropdow-button">...</button>';
        html += '<ul  id="SQueryResultsUIDropdownContent" style="right:22px;top:10px;position:absolute;" class="SQueryDropdow-content">';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.selectAll(this)\'>Select</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.getFoundItems().isolateAll(this)\'>Isolate</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.getFoundItems().makeVisible(true)\'>Show</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.getFoundItems().makeVisible(false)\'>Hide</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.resetModel()\'>Reset Model</li>';
        html += '<li >---</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.getFoundItems().colorize(new Communicator.Color(255,0,0))\'>Red</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.getFoundItems().colorize(new Communicator.Color(0,255,0))\'>Green</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.getFoundItems().colorize(new Communicator.Color(0,0,255))\'>Blue</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.getFoundItems().colorize(new Communicator.Color(255,255,0))\'>Yellow</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.getFoundItems().colorize(new Communicator.Color(128,128,128))\'>Grey</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.getFoundItems().setOpacity(0.7)\'>Transparent</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditorUI.getFoundItems().setOpacity(1)\'>Opaque</li>';
        html += '</ul>';
        return html;
    }
}