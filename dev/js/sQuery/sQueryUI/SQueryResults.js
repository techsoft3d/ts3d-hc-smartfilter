import { SQueryEditor } from './SQueryEditor.js';

export class SQueryResults {

    static initialize(maindiv, manager) {
        SQueryResults._maindiv = maindiv;
        SQueryResults._manager = manager;
        SQueryResults._viewer = manager._viewer;
        SQueryResults._isPropertyView = false;
        SQueryResults._tablePropertyAMT = "--EMPTY--";
        SQueryResults._aggType = "sum";
        SQueryResults._tablePropertyExpanded1 = "--EMPTY--";
        SQueryResults._tablePropertyExpanded2 = "--EMPTY--";

    }

    static async display() {
        let html = "";
        html += '<div id = "SQueryResultsFirstRow" style="position:relative;width:100%;height:15px;top:-8px">';
        html += '<div style="position:absolute; left:3px;top:5px; font-size:14px;background-color:white" id="' + SQueryResults._maindiv + '_found"></div>';
        html += SQueryResults._generateDropdown();
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick=\'hcSQuery.SQueryEditor.selectAll(this)\'>Select</button>';
        html += '<button id="SQueryToggleViewButton" class="SQuerySearchButton" type="button" style="right:90px;top:3px;position:absolute;" onclick=\'hcSQuery.SQueryResults.toggleView(this)\'>Property View</button>';
        html += '</div>';

        html += '<div id="' + SQueryResults._maindiv + '_searchitems" class="SQuerySearchItems">';
        html += '</div>';
        html += '<div style="position:absolute; right:20px;bottom:0px; font-size:12px;background-color:white" id="' + SQueryResults._maindiv + '_found"></div>';

        $("#" + SQueryResults._maindiv).empty();
        $("#" + SQueryResults._maindiv).append(html);

        const SQueryDropdowButton = document.querySelector('#SQueryResultsDropdown');
        const SQueryDropdowContent = document.querySelector('#SQueryResultsDropdownContent');

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
            let prop = SQueryResults._manager._allPropertiesHash[items[i]];
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
        SQueryResults._results.setTableProperty($("#SQueryPropSelect")[0].value);
        SQueryEditor._mainFilter.setAutoColors(null, null);
        SQueryResults._generatePropertyView();

    }

    static _propertyExpandedSelected(num) {
        if (num == 0) {
            SQueryResults._tablePropertyExpanded0 = $("#SQueryPropExpandedSelect0")[0].value;
        }
        else if (num == 1) {
            SQueryResults._tablePropertyExpanded1 = $("#SQueryPropExpandedSelect1")[0].value;
        }
        SQueryResults.generateExpandedResults();

    }

    static _propertyAggTypeSelected() {
        SQueryResults._aggType = $("#SQueryPropAggType")[0].value;
        SQueryResults._generatePropertyView();

    }

    static _propertyAMTSelected() {
        SQueryResults._tablePropertyAMT = $("#SQueryPropSelectAMT")[0].value;
        SQueryResults._generatePropertyView();

    }

    static applyColors() {
        let autoColors = SQueryEditor._mainFilter.getAutoColors();
        if (!autoColors) {
            return;
        }
        for (let i in SQueryResults._results.getCategoryHash()) {
            if (autoColors[i]) {
                SQueryEditor._viewer.model.setNodesFaceColor(SQueryResults._results.getCategoryHash()[i].ids, autoColors[i]);
            }
        }
    }

    static _assignColorsMainGradient() {    

        let rows = SQueryResults._table.getRows();
        let delta = 256/rows.length;
        for (let i=0;i<rows.length;i++) {
            let m = delta * rows[i].getPosition();
            SQueryResults._results.getCategoryHash()[rows[i].getData().id].color = new Communicator.Color(m,m,m);
        }

        let autoColors = [];
        for (let i in SQueryResults._results.getCategoryHash()) {
            autoColors[i] = SQueryResults._results.getCategoryHash()[i].color;
        }
        SQueryEditor._mainFilter.setAutoColors(autoColors, SQueryResults._results.getTableProperty());
        SQueryResults._updateColorsInTable();
    }

    static _updateColorsInTable() {
        let tdata = [];
        for (let i in SQueryResults._results.getCategoryHash()) {
            let color = SQueryResults._results.getCategoryHash()[i].color;
            let data = { color: 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',1)',id: i };
            tdata.push(data);
        }
        SQueryResults._table.updateData(tdata);
    }

    static _assignExpandedColorsGradient(column) {

        let tdata = SQueryResults._results.caculateExpandedColorsGradient(column,this._expandedNodeIds,this._tablePropertyExpanded0,this._tablePropertyExpanded1);
       
        SQueryResults._table.updateData(tdata);
    }

    static applyExpandedColors() {
        let rows = SQueryResults._table.getRows();
        for (let i = 0; i < rows.length; i++) {
            let m = rows[i].getData().colorsav;
            SQueryEditor._viewer.model.setNodesFaceColor([rows[i].getData().id], new Communicator.Color(m, m, m));
        }
    }

    static _assignColorsGradient(column) {
     
        let pname = column;
        if (column == "name") {
            if (!SQueryResults._results.isNumberProp(SQueryResults._results.getTableProperty())) {
                SQueryResults._assignColorsMainGradient();
                return;
            }
            pname = SQueryResults._results.getTableProperty();
        }
        SQueryResults._results.calculateGradientData(pname,SQueryResults._tablePropertyAMT,SQueryResults._aggType);
      
        SQueryResults._updateColorsInTable();
    }


    static assignColorsRandom() {
        for (let i in SQueryResults._results.getCategoryHash()) {
            let color = new Communicator.Color(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
            SQueryResults._results.getCategoryHash()[i].color = color;
        }

        let autoColors = [];
        for (let i in SQueryResults._results.getCategoryHash()) {
            autoColors[i] = SQueryResults._results.getCategoryHash()[i].color;
        }

        SQueryEditor._mainFilter.setAutoColors(autoColors, SQueryResults._results.getTableProperty());
        SQueryResults._updateColorsInTable();

    }

    static _clearColors() {
        SQueryEditor._mainFilter.setAutoColors(null,null);
        let tdata = [];
        for (let i in SQueryResults._results.getCategoryHash()) {
            SQueryResults._results.getCategoryHash()[i].color = undefined;
            let data = { color: null,id: i };
            tdata.push(data);
        }
        SQueryResults._table.updateData(tdata);
    }

    static _generatePropertyView(redrawOnly = false) {

        $("#SQueryResultsFirstRow").css("display", "block");
        if (SQueryEditor._mainFilter.getAutoColorProperty()) {
            SQueryResults._results.setTableProperty(SQueryEditor._mainFilter.getAutoColorProperty());
        }

        let sortedStrings = SQueryResults._results.getAllProperties();

        if (!redrawOnly) {
            let found = false;
            if (SQueryResults._results.getTableProperty()) {
                for (let i = 0; i < sortedStrings.length; i++) {
                    if (sortedStrings[i] == SQueryResults._results.getTableProperty()) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                SQueryResults._results.setTableProperty(null);
            }

            SQueryResults._results.findCategoryFromSearch();
        }

        $("#SQueryToggleViewButton").html("Search View");

        $("#" + SQueryResults._maindiv + "_searchitems").empty();
        $("#" + SQueryResults._maindiv + "_searchitems").css("overflow", "inherit");
        $("#" + SQueryResults._maindiv + "_found").empty();

        let amountStrings = SQueryResults.getAmountStrings(sortedStrings);

        let html = '<div style="height:25px;"><span style="top:-16px;position:relative"><span style="font-family:courier">Prop:</span><select id="SQueryPropSelect" onchange=\'hcSQuery.SQueryResults._propertySelected();\' class="SQueryPropertyResultsSelect" value="">';

        for (let i = 0; i < sortedStrings.length; i++) {
            if (SQueryResults._results.getTableProperty() == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:4px;left:0px;position:absolute"><span style="font-family:courier">AMT :</span><select id="SQueryPropSelectAMT" onchange=\'hcSQuery.SQueryResults._propertyAMTSelected();\' class="SQueryPropertyResultsSelect" value="">';
        for (let i = 0; i < amountStrings.length; i++) {
            if (SQueryResults._tablePropertyAMT == amountStrings[i])
                html += '<option value="' + amountStrings[i] + '" selected>' + amountStrings[i] + '</option>\n';
            else
                html += '<option value="' + amountStrings[i] + '">' + amountStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:4px;left:186px;position:absolute"><span style="font-family:courier"></span><select id="SQueryPropAggType" onchange=\'hcSQuery.SQueryResults._propertyAggTypeSelected();\' class="SQueryPropertyAggTypeSelect" value="">';
        let choices = ["sum", "avg", "max", "min", "med"];
        for (let i = 0; i < choices.length; i++) {
            if (SQueryResults._aggType == choices[i])
                html += '<option value="' + choices[i] + '" selected>' + choices[i] + '</option>\n';
            else
                html += '<option value="' + choices[i] + '">' + choices[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick="hcSQuery.SQueryResults.applyColors()">Apply Colors</button>';
        html += '</div>';

        $("#" + SQueryResults._maindiv + "_searchitems").append(html);

        $("#" + SQueryResults._maindiv + "_searchitems").append('<div class = "SQueryResultsTabulator" id = "SQueryResultsTabulator"></div>');


        let sorter = undefined;
        if (SQueryResults._results.getTableProperty().indexOf("Date") != -1) {
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
                    SQueryResults.assignColorsRandom();
                }
            },
            {
                label: "<i class='fas fa-user'></i> Assign Gradient",
                action: async function (e, column) {
                    SQueryResults._assignColorsGradient(column.getDefinition().field);
                }
            },
            {
                label: "<i class='fas fa-user'></i> Clear Colors",
                action: async function (e, column) {
                    SQueryResults._clearColors();
                }
            },
            
        ];

        let firstColumnTitle = SQueryResults._results.getTableProperty();
        if (SQueryResults._results.isNumberProp(SQueryResults._results.getTableProperty())) {

            let unit = SQueryResults._results.getAMTUnit(SQueryResults._results.getTableProperty());
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

        if (SQueryResults._tablePropertyAMT != "--EMPTY--") {

            let unit = SQueryResults._results.getAMTUnit(SQueryResults._tablePropertyAMT);
            let unitTitle = "";
            if (unit) {
                unitTitle = SQueryResults._aggType + "(" + unit + ")";
            }
            else {
                unitTitle = SQueryResults._aggType;
            }
            tabulatorColumes.splice(1, 0, {
                headerMenu:columnMenu,title: unitTitle, field: "amt", width: 120,bottomCalc:SQueryResults._aggType != "med" ? SQueryResults._aggType: undefined
            });
        }

        let rowMenu = [
            {
                label: "<i class='fas fa-user'></i> View Category",
                action: async function (e, row) {
                    let ids = SQueryResults._results.getCategoryHash()[row.getData().id].ids;
                    
                    SQueryResults._tablePropertyExpanded0 = SQueryResults._results.getTableProperty();
                    SQueryResults._tablePropertyExpanded1 = SQueryResults._tablePropertyAMT;
                    SQueryResults.generateExpandedResults(ids);
                }
            },
            {
                label: "<i class='fas fa-user'></i> View All",
                action: async function (e, row) {
                    let searchresults = SQueryEditor._founditems.getItems();
                    let ids = [];
                    for (let i = 0; i < searchresults.length; i++) {
                        ids.push(searchresults[i].id);
                    }
                    SQueryResults._tablePropertyExpanded0 = SQueryResults._results.getTableProperty();
                    SQueryResults._tablePropertyExpanded1 = SQueryResults._tablePropertyAMT;
                    SQueryResults.generateExpandedResults(ids);
                }
            },          
            
        ];

        SQueryResults._table = new Tabulator("#SQueryResultsTabulator", {
            rowHeight: 15,
            selectable: 0,
            layout: "fitColumns",
            columns: tabulatorColumes,
            rowContextMenu: rowMenu
        });

        SQueryResults._table.on("rowClick", async function (e, row) {
            let data = row.getData();

            let ids = SQueryResults._results.getCategoryHash()[data.id].ids;
            SQueryResults._viewer.selectionManager.clear();
            if (ids.length == 1) {
                SQueryResults._viewer.selectionManager.selectNode(ids[0], Communicator.SelectionMode.Set);
            }
            else {
                let selections = [];
                for (let i = 0; i < ids.length; i++) {
                    selections.push(new Communicator.Selection.SelectionItem(ids[i]));
                }
                SQueryResults._viewer.selectionManager.add(selections);
            }

        });

        SQueryResults._table.on("tableBuilt", function () {
            let tdata = SQueryResults._results.getCategoryTableData(SQueryResults._tablePropertyAMT,SQueryResults._aggType);
            SQueryResults._table.setData(tdata);
        });

        SQueryResults._table.on("cellEdited", function (cell) {
            if (cell.getField() == "color") {
                let autoColors = SQueryEditor._mainFilter.getAutoColors();
                if (!autoColors) {
                    autoColors = [];
                    SQueryEditor._mainFilter.setAutoColors(autoColors, SQueryResults._results.getTableProperty());
                }
                let data = cell.getRow().getData();
                autoColors[data.name] = SQueryResults._results.convertColor(data.color);
            }
            SQueryManagerUI._table.redraw();
        });      
    }

    static generateExpandedResults(nodeids_in = null) {

        let nodeids;
        if (nodeids_in) {
            SQueryResults._expandedNodeIds = nodeids_in;
            nodeids = nodeids_in;
        }
        else {
            nodeids = SQueryResults._expandedNodeIds;
        }

        this._expandedNodeIds = nodeids;

        if (SQueryResults._tablePropertyExpanded0.indexOf("Node Name") != -1) {
            SQueryResults._tablePropertyExpanded0 = "Node Type";
        }

        $("#" + SQueryResults._maindiv + "_searchitems").empty();
        $("#" + SQueryResults._maindiv + "_searchitems").css("overflow", "inherit");
        $("#" + SQueryResults._maindiv + "_found").empty();
        $("#SQueryResultsFirstRow").css("display", "none");

        let sortedStrings = SQueryResults._results.getAllProperties();
        sortedStrings.shift();
        sortedStrings.shift();

        let html = '<div style="height:35px;">';
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:-5px;position:absolute;" onclick=\'hcSQuery.SQueryResults._generatePropertyView(true)\'>Property View</button>';
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:17px;position:absolute;" onclick="hcSQuery.SQueryResults.applyExpandedColors()">Apply Colors</button>';
        html += '<div style="height:25px;"><span style="top:-5px;position:relative"><span style="font-family:courier">Prop1:</span><select id="SQueryPropExpandedSelect0" onchange=\'hcSQuery.SQueryResults._propertyExpandedSelected(0);\' class="SQueryPropertyResultsSelect" value="">';
        
        for (let i = 0; i < sortedStrings.length; i++) {
            if (SQueryResults._tablePropertyExpanded0 == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:15px;left:0px;position:absolute"><span style="font-family:courier">Prop2:</span><select id="SQueryPropExpandedSelect1" onchange=\'hcSQuery.SQueryResults._propertyExpandedSelected(1);\' class="SQueryPropertyResultsSelect" value="">';
        sortedStrings.unshift("--EMPTY--");

        for (let i = 0; i < sortedStrings.length; i++) {
            if (SQueryResults._tablePropertyExpanded1 == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
         
        html += '</div>';
        $("#" + SQueryResults._maindiv + "_searchitems").append(html);
        $("#" + SQueryResults._maindiv + "_searchitems").append('<div class = "SQueryResultsTabulator" id = "SQueryResultsTabulator"></div>');

        let title1 = SQueryResults._tablePropertyExpanded0;

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
                    SQueryResults._assignExpandedColorsGradient(column.getDefinition().field);
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
        if (SQueryResults._results.isNumberProp(SQueryResults._tablePropertyExpanded0)) {
            let unit = SQueryResults._results.getAMTUnit(SQueryResults._tablePropertyExpanded0);
            if (unit) {
                unitTitle = SQueryResults._tablePropertyExpanded0 + "(" + unit + ")";
                bcalc = "sum";
            }
            else {
                unitTitle = SQueryResults._tablePropertyExpanded0;
            }
        }
        else {
            unitTitle = SQueryResults._tablePropertyExpanded0;
        }
        tabulatorColumes.splice(1, 0, {
            headerMenu:columnMenu, title: unitTitle, field: "prop1", bottomCalc:bcalc, sorter:SQueryResults._tablePropertyExpanded0.indexOf("Date") != -1 ? sorter : undefined
        });

        let bcalc2 = undefined;

        if (SQueryResults._tablePropertyExpanded1 != "--EMPTY--") {

            let unitTitle = "";
            if (SQueryResults._results.isNumberProp(SQueryResults._tablePropertyExpanded1)) {
                let unit = SQueryResults._results.getAMTUnit(SQueryResults._tablePropertyExpanded1);
                if (unit) {
                    unitTitle = SQueryResults._tablePropertyExpanded1 + "(" + unit + ")";
                    bcalc2 = "sum";
                }
                else {
                    unitTitle = SQueryResults._tablePropertyExpanded1;
                }
            }
            else {
                unitTitle = SQueryResults._tablePropertyExpanded1;
            }
            tabulatorColumes.splice(2, 0, {
                headerMenu:columnMenu,title: unitTitle, field: "prop2", bottomCalc: bcalc2, sorter:SQueryResults._tablePropertyExpanded1.indexOf("Date") != -1 ? sorter : undefined
            });
        }

        SQueryResults._table = new Tabulator("#SQueryResultsTabulator", {
            rowHeight: 15,
            selectable: true,
            selectableRangeMode:"click",
            layout: "fitColumns",
            columns: tabulatorColumes,
        });

        SQueryResults._table.on("rowSelectionChanged", async function (e, row) {
            var rows = SQueryResults._table.getSelectedData();

            SQueryResults._viewer.selectionManager.clear();
            let selections = [];
            if (rows.length == 1) { 
                SQueryResults._viewer.selectionManager.selectNode(rows[0].id, Communicator.SelectionMode.Set);
            }
            else {
                for (let i = 0; i < rows.length; i++) {
                    selections.push(new Communicator.Selection.SelectionItem(rows[i].id));
                }
                SQueryResults._viewer.selectionManager.add(selections);
            }
                    
        });

        SQueryResults._table.on("tableBuilt", function () {
            let tdata = SQueryResults._results.getExpandedTableData(nodeids,SQueryResults._tablePropertyExpanded0,SQueryResults._tablePropertyExpanded1);
            SQueryResults._table.setData(tdata);
        });
    }

    static toggleView() {
        SQueryResults._isPropertyView = !SQueryResults._isPropertyView;
        if (SQueryResults._isPropertyView) {
            SQueryResults._generatePropertyView();
        }
        else {
            SQueryResults.generateSearchResults(SQueryEditor._founditems);
        }
    }

    static generateSearchResults(founditems_in) {
        SQueryResults._results = founditems_in;
        $("#SQueryResultsFirstRow").css("display", "block");
        $("#SQueryToggleViewButton").html("Property View");
        SQueryResults._isPropertyView = false;
        $("#" + SQueryResults._maindiv + "_searchitems").empty();
        $("#" + SQueryResults._maindiv + "_searchitems").css("overflow", "auto");
        $("#" + SQueryResults._maindiv + "_found").empty();
        if (founditems_in == undefined) {
            return;
        }

        let founditems = founditems_in.getItems();

        if (founditems.length == 1) {
            $("#" + SQueryResults._maindiv + "_found").append(founditems.length + " item found");
        }
        else {
            $("#" + SQueryResults._maindiv + "_found").append(founditems.length + " items found");
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
            if (SQueryResults._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(founditems[i].id))) {
                let parent = SQueryResults._viewer.model.getNodeParent(founditems[i].id);
                if (SQueryResults._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(parent))) {
                    html += '<div onclick=\'hcSQuery.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItemselectedIndirect">';
                }
                else {
                    html += '<div onclick=\'hcSQuery.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItemselected">';
                }
            }
            else {
                if (toggle)
                    html += '<div onclick=\'hcSQuery.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItem1">';
                else
                    html += '<div onclick=\'hcSQuery.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItem2">';
            }

            html += '<div class="SQuerySearchItemText">' + SQueryEditor._htmlEncode(founditems[i].name) + '</div>';
            html += '<div class="SQuerySearchItemChainText">' + SQueryEditor._htmlEncode(founditems[i].chaintext) + '</div>';
            html += '</div>';
            y++;
        }
        if (more) {
            html += '<div style="left:3px;" >More...</div>';
        }

        $("#" + SQueryResults._maindiv + "_searchitems").append(html);
        SQueryResults.adjust();
    }

    static adjust() {

        let newheight = $("#" + SQueryEditor._maindiv).height() - ($("#" + SQueryResults._maindiv + "_searchitems").offset().top - $("#" + SQueryEditor._maindiv).parent().offset().top);
        $("#" + SQueryResults._maindiv + "_searchitems").css({ "height": newheight + "px" });


        let gap = newheight + $("#" + SQueryEditor._maindiv + "_conditions").height() + 3;
        if (SQueryEditor._showFirstRow) {
            gap += $("#" + SQueryEditor._maindiv + "_firstrow").height();
        }
    }

    static _select(id) {
        if (!SQueryEditor.ctrlPressed)
            SQueryResults._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Set);
        else
            SQueryResults._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Toggle);

        SQueryResults.generateSearchResults(SQueryEditor._founditems);
    }

    static _generateDropdown() {
        let html = "";
        html += '<button id="SQueryResultsDropdown" style="right:56px;top:3px;position:absolute;" class="SQuerySearchButton SQueryDropdow-button">...</button>';
        html += '<ul  id="SQueryResultsDropdownContent" style="right:22px;top:10px;position:absolute;" class="SQueryDropdow-content">';
        html += '<li onclick=\'hcSQuery.SQueryEditor.selectAll(this)\'>Select</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.getFoundItems().isolateAll(this)\'>Isolate</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.getFoundItems().makeVisible(true)\'>Show</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.getFoundItems().makeVisible(false)\'>Hide</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.resetModel()\'>Reset Model</li>';
        html += '<li >---</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.getFoundItems().colorize(new Communicator.Color(255,0,0))\'>Red</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.getFoundItems().colorize(new Communicator.Color(0,255,0))\'>Green</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.getFoundItems().colorize(new Communicator.Color(0,0,255))\'>Blue</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.getFoundItems().colorize(new Communicator.Color(255,255,0))\'>Yellow</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.getFoundItems().colorize(new Communicator.Color(128,128,128))\'>Grey</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.getFoundItems().setOpacity(0.7)\'>Transparent</li>';
        html += '<li onclick=\'hcSQuery.SQueryEditor.getFoundItems().setOpacity(1)\'>Opaque</li>';
        html += '</ul>';
        return html;
    }
}