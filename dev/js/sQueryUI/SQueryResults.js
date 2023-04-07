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
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick=\'hcSQueryUI.SQueryEditor.selectAll(this)\'>Select</button>';
        html += '<button id="SQueryToggleViewButton" class="SQuerySearchButton" type="button" style="right:90px;top:3px;position:absolute;" onclick=\'hcSQueryUI.SQueryResults.toggleView(this)\'>Property View</button>';
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

    static _findCategoryFromSearch() {

        let query = SQueryEditor._mainFilter;
        let searchresults = SQueryEditor._founditems;
        SQueryResults._categoryHash = [];

        if (SQueryResults._tableProperty) {
            if (SQueryResults._tableProperty == "Node Name") {
                for (let j = 0; j < searchresults.length; j++) {
                    if (SQueryResults._categoryHash[searchresults[j].name] == undefined) {
                        SQueryResults._categoryHash[searchresults[j].name] = { ids: [] };
                    }
                    SQueryResults._categoryHash[searchresults[j].name].ids.push(searchresults[j].id);
                }
            }
            else if (SQueryResults._tableProperty == "Node Name (No :Ext)") {
                for (let j = 0; j < searchresults.length; j++) {
                    let name;
                    let dindex = searchresults[j].name.lastIndexOf(":");
                    if (dindex > -1) {
                        name = searchresults[j].name.substring(0,dindex);
                    }
                    else {
                        name = searchresults[j].name;
                    }
                    if (SQueryResults._categoryHash[name] == undefined) {
                        SQueryResults._categoryHash[name] = { ids: [] };
                    }
                    SQueryResults._categoryHash[name].ids.push(searchresults[j].id);
                }
            }
            else if (SQueryResults._tableProperty == "Node Name (No -Ext)") {
                for (let j = 0; j < searchresults.length; j++) {
                    let name;
                    let dindex = searchresults[j].name.lastIndexOf("-");
                    if (dindex > -1) {
                        name = searchresults[j].name.substring(0,dindex);
                    }
                    else {
                        name = searchresults[j].name;
                    }
                    if (SQueryResults._categoryHash[name] == undefined) {
                        SQueryResults._categoryHash[name] = { ids: [] };
                    }
                    SQueryResults._categoryHash[name].ids.push(searchresults[j].id);
                }
            }
            else if (SQueryResults._tableProperty == "Node Parent") {
                for (let j = 0; j < searchresults.length; j++) {
                    let nodename = SQueryResults._viewer.model.getNodeName(SQueryResults._viewer.model.getNodeParent(searchresults[j].id));
                    if (SQueryResults._categoryHash[nodename] == undefined) {
                        SQueryResults._categoryHash[nodename] = { ids: [] };
                    }
                    SQueryResults._categoryHash[nodename].ids.push(searchresults[j].id);
                }
            }
            else if (SQueryResults._tableProperty == "Node Type") {
                for (let j = 0; j < searchresults.length; j++) {
                    let nodetype = Communicator.NodeType[SQueryResults._viewer.model.getNodeType(searchresults[j].id)];
                    if (SQueryResults._categoryHash[nodetype] == undefined) {
                        SQueryResults._categoryHash[nodetype] = { ids: [] };
                    }
                    SQueryResults._categoryHash[nodetype].ids.push(searchresults[j].id);
                }
            }
            else {
                let propname = SQueryResults._tableProperty
                for (let j = 0; j < searchresults.length; j++) {
                    let id = searchresults[j].id;
                    if (SQueryResults._manager._propertyHash[id][propname] != undefined) {
                        if (SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][propname]] == undefined) {
                            SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][propname]] = { ids: [] };
                        }
                        SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][propname]].ids.push(searchresults[j].id);
                    }
                }
            }
        }
        else {

            for (let i = 0; i < query.getNumConditions(); i++) {
                let condition = query.getCondition(i);
                if (condition.propertyType == hcSQuery.SQueryPropertyType.nodeName) {
                    for (let j = 0; j < searchresults.length; j++) {
                        if (SQueryResults._categoryHash[searchresults[j].name] == undefined) {
                            SQueryResults._categoryHash[searchresults[j].name] = { ids: [] };
                        }
                        SQueryResults._categoryHash[searchresults[j].name].ids.push(searchresults[j].id);
                    }
                    SQueryResults._tableProperty = "Node Name";
                    return;
                }
                else if (condition.relationship == hcSQuery.SQueryRelationshipType.nodeParent) {
                    for (let j = 0; j < searchresults.length; j++) {
                        let nodename = SQueryResults._viewer.model.getNodeName(SQueryResults._viewer.model.getNodeParent(searchresults[j].id));
                        if (SQueryResults._categoryHash[nodename] == undefined) {
                            SQueryResults._categoryHash[nodename] = { ids: [] };
                        }
                        SQueryResults._categoryHash[nodename].ids.push(searchresults[j].id);
                    }
                    SQueryResults._tableProperty = "Node Parent";
                    return;
                }
                else if (condition.propertyType == hcSQuery.SQueryPropertyType.nodeType) {
                    for (let j = 0; j < searchresults.length; j++) {
                        let nodetype = Communicator.NodeType[SQueryResults._viewer.model.getNodeType(searchresults[j].id)];
                        if (SQueryResults._categoryHash[nodetype] == undefined) {
                            SQueryResults._categoryHash[nodetype] = { ids: [] };
                        }
                        SQueryResults._categoryHash[nodetype].ids.push(searchresults[j].id);
                    }
                    SQueryResults._tableProperty = "Node Type";
                    return;
                }
                else if (condition.propertyType == hcSQuery.SQueryPropertyType.property) {
                    let propname = condition.propertyName;
                    for (let j = 0; j < searchresults.length; j++) {
                        let id = searchresults[j].id;
                        if (SQueryResults._manager._propertyHash[id][condition.propertyName] != undefined) {
                            if (SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][condition.propertyName]] == undefined) {
                                SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][condition.propertyName]] = { ids: [] };
                            }
                            SQueryResults._categoryHash[SQueryResults._manager._propertyHash[id][condition.propertyName]].ids.push(searchresults[j].id);
                        }
                    }
                    SQueryResults._tableProperty = propname;
                    return;
                }
            }
            SQueryResults._tableProperty = "Node Name";
            SQueryResults._findCategoryFromSearch();

        }
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

    static isNumberProp(ltextin) {
        let ltext = ltextin.toLowerCase();
        if (ltext.indexOf("version") != -1 || ltext.indexOf("globalid") != -1 || ltext.indexOf("name") != -1 || ltext.indexOf("date") != -1 || ltext.indexOf("persistentid") != -1) {
            return false;
        }

        let prop = SQueryResults._manager._allPropertiesHash[ltextin];
        if (prop != undefined) {
            for (let j in prop) {
                if (!isNaN(parseFloat(j))) {
                    return true;
                }
                break;
            }
        }
        return false;
    }

    static getAllProperties() {

        let searchresults = SQueryEditor._founditems;
        let propsnames = [];
        let thash = [];
        for (let i in SQueryResults._manager._allPropertiesHash) {
            propsnames.push(i);
        }

        for (let j = 0; j < searchresults.length; j++) {
            let id = searchresults[j].id;
            for (let k in SQueryResults._manager._propertyHash[id]) {
                thash[k] = true;
            }
        }

        let propnames2 = [];
        for (let i = 0; i < propsnames.length; i++) {
            if (thash[propsnames[i]] != undefined) {
                propnames2.push(propsnames[i]);
            }
        }

        propnames2.sort();
        propnames2.unshift("Node Parent");
        propnames2.unshift("Node Type");
        propnames2.unshift("Node Name (No -Ext)");
        propnames2.unshift("Node Name (No :Ext)");
        propnames2.unshift("Node Name");
        return propnames2;
    }

    static _propertySelected() {
        SQueryResults._tableProperty = $("#SQueryPropSelect")[0].value;
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
        for (let i in SQueryResults._categoryHash) {
            if (autoColors[i]) {
                SQueryEditor._viewer.model.setNodesFaceColor(SQueryResults._categoryHash[i].ids, autoColors[i]);
            }
        }
    }


    static _assignColorsMainGradient() {    

        let rows = SQueryResults._table.getRows();
        let delta = 256/rows.length;
        for (let i=0;i<rows.length;i++) {
            let m = delta * rows[i].getPosition();
            SQueryResults._categoryHash[rows[i].getData().id].color = new Communicator.Color(m,m,m);
        }

        let autoColors = [];
        for (let i in SQueryResults._categoryHash) {
            autoColors[i] = SQueryResults._categoryHash[i].color;
        }
        SQueryEditor._mainFilter.setAutoColors(autoColors, SQueryResults._tableProperty);
        SQueryResults._updateColorsInTable();
    }

    static _updateColorsInTable() {
        let tdata = [];
        for (let i in SQueryResults._categoryHash) {
            let color = SQueryResults._categoryHash[i].color;
            let data = { color: 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',1)',id: i };
            tdata.push(data);
        }
        SQueryResults._table.updateData(tdata);
    }



    static _assignColorsGradient(column) {
        let pname = column;
        if (column == "name") {
            if (!SQueryResults.isNumberProp(SQueryResults._tableProperty)) {
                SQueryResults._assignColorsMainGradient();
                return;
            }
            pname = SQueryResults._tableProperty;
        }

    
        let rows = SQueryResults._table.getRows();
        let min = Number.MAX_VALUE;
        let max = -Number.MAX_VALUE;
        for (let i = 0; i < rows.length; i++) {
            let num;
            if (pname == "num") {
                num = parseInt(rows[i].getData().num);
            }
            else if (pname == "amt") {
                num = parseFloat(rows[i].getData().amt);
            }
            else {
                num = parseFloat(rows[i].getData().name);
            }

            if (num < min) {
                min = num;
            }
            if (num > max) {
                max = num;
            }
        }
        let tdist = (max - min);

        for (let i = 0; i < rows.length; i++) {
            let num;
            if (pname == "num") {
                num = parseInt(rows[i].getData().num);
            }
            else if (pname == "amt") {
                num = parseFloat(rows[i].getData().amt);
            }
            else {
                num = parseFloat(rows[i].getData().name);
            }

            let m = (num - min) / tdist * 256;
            SQueryResults._categoryHash[rows[i].getData().id].color = new Communicator.Color(m, m, m);
        }


        let autoColors = [];
        for (let i in SQueryResults._categoryHash) {
            autoColors[i] = SQueryResults._categoryHash[i].color;
        }
        SQueryEditor._mainFilter.setAutoColors(autoColors, SQueryResults._tableProperty);
        SQueryResults._updateColorsInTable();
    }


    static assignColorsRandom() {
        for (let i in SQueryResults._categoryHash) {
            let color = new Communicator.Color(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
            SQueryResults._categoryHash[i].color = color;
        }

        let autoColors = [];
        for (let i in SQueryResults._categoryHash) {
            autoColors[i] = SQueryResults._categoryHash[i].color;
        }

        SQueryEditor._mainFilter.setAutoColors(autoColors, SQueryResults._tableProperty);
        SQueryResults._updateColorsInTable();

    }

    static _generatePropertyView(redrawOnly = false) {

        $("#SQueryResultsFirstRow").css("display", "block");
        if (SQueryEditor._mainFilter.getAutoColorProperty()) {
            SQueryResults._tableProperty = SQueryEditor._mainFilter.getAutoColorProperty();
        }

        let sortedStrings = SQueryResults.getAllProperties();

        if (!redrawOnly) {
            let found = false;
            if (SQueryResults._tableProperty) {
                for (let i = 0; i < sortedStrings.length; i++) {
                    if (sortedStrings[i] == SQueryResults._tableProperty) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                SQueryResults._tableProperty = null;
            }

            SQueryResults._findCategoryFromSearch();
        }

        $("#SQueryToggleViewButton").html("Search View");

        $("#" + SQueryResults._maindiv + "_searchitems").empty();
        $("#" + SQueryResults._maindiv + "_searchitems").css("overflow", "inherit");
        $("#" + SQueryResults._maindiv + "_found").empty();



        let amountStrings = SQueryResults.getAmountStrings(sortedStrings);


        let html = '<div style="height:25px;"><span style="top:-16px;position:relative"><span style="font-family:courier">Prop:</span><select id="SQueryPropSelect" onchange=\'hcSQueryUI.SQueryResults._propertySelected();\' class="SQueryPropertyResultsSelect" value="">';

        for (let i = 0; i < sortedStrings.length; i++) {
            if (SQueryResults._tableProperty == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:4px;left:0px;position:absolute"><span style="font-family:courier">AMT :</span><select id="SQueryPropSelectAMT" onchange=\'hcSQueryUI.SQueryResults._propertyAMTSelected();\' class="SQueryPropertyResultsSelect" value="">';
        for (let i = 0; i < amountStrings.length; i++) {
            if (SQueryResults._tablePropertyAMT == amountStrings[i])
                html += '<option value="' + amountStrings[i] + '" selected>' + amountStrings[i] + '</option>\n';
            else
                html += '<option value="' + amountStrings[i] + '">' + amountStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:4px;left:186px;position:absolute"><span style="font-family:courier"></span><select id="SQueryPropAggType" onchange=\'hcSQueryUI.SQueryResults._propertyAggTypeSelected();\' class="SQueryPropertyAggTypeSelect" value="">';
        let choices = ["sum", "avg", "max", "min", "med"];
        for (let i = 0; i < choices.length; i++) {
            if (SQueryResults._aggType == choices[i])
                html += '<option value="' + choices[i] + '" selected>' + choices[i] + '</option>\n';
            else
                html += '<option value="' + choices[i] + '">' + choices[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick="hcSQueryUI.SQueryResults.applyColors()">Apply Colors</button>';
        html += '</div>';

        $("#" + SQueryResults._maindiv + "_searchitems").append(html);

        $("#" + SQueryResults._maindiv + "_searchitems").append('<div class = "SQueryResultsTabulator" id = "SQueryResultsTabulator"></div>');


        let sorter = undefined;
        if (SQueryResults._tableProperty.indexOf("Date") != -1) {
            sorter = function(a, b, aRow, bRow, column, dir, sorterParams) {

                let aDate = new Date(a);
                let bDate = new Date(b);

                if (aDate > bDate) {
                    return 1;
                }
                if (aDate < bDate) {
                    return -1;
                }
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
            
        ];

        let firstColumnTitle = SQueryResults._tableProperty;
        if (SQueryResults.isNumberProp(SQueryResults._tableProperty)) {

            let unit = SQueryResults._getAMTUnit(SQueryResults._tableProperty);
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
            title: "Color", field: "color", headerSort: false, field: "color", editor: "list", width: 60,
            formatter: "color", editorParams: { values: ["red", "green", "blue", "yellow", "brown", "orange", "grey", "black", "white"] }
        },
        {
            title: "ID", field: "id", width: 20, visible: false
        }];

        if (SQueryResults._tablePropertyAMT != "--EMPTY--") {

            let unit = SQueryResults._getAMTUnit(SQueryResults._tablePropertyAMT);
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
                    let ids = SQueryResults._categoryHash[row.getData().id].ids;
                    
                    SQueryResults._tablePropertyExpanded0 = SQueryResults._tableProperty;
                    SQueryResults._tablePropertyExpanded1 = SQueryResults._tablePropertyAMT;
                    SQueryResults.generateExpandedResults(ids);
                }
            },
            {
                label: "<i class='fas fa-user'></i> View All",
                action: async function (e, row) {
                    let searchresults = SQueryEditor._founditems;
                    let ids = [];
                    for (let i = 0; i < searchresults.length; i++) {
                        ids.push(searchresults[i].id);
                    }
                    SQueryResults._tablePropertyExpanded0 = SQueryResults._tableProperty;
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

            let ids = SQueryResults._categoryHash[data.id].ids;
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

            let tdata = [];
            let autoColors = SQueryEditor._mainFilter.getAutoColors();
            if (autoColors) {
                for (let i in SQueryResults._categoryHash) {
                    if (!autoColors[i]) {
                        autoColors[i] = SQueryResults._categoryHash[i].color;
                    }
                }
            }

            for (let i in SQueryResults._categoryHash) {
                let color = autoColors ? autoColors[i] : null;
                let column1name = i;
                if (SQueryResults.isNumberProp(SQueryResults._tableProperty)) {
                    column1name = parseFloat(i);
                }
                let data = { name: column1name, num: SQueryResults._categoryHash[i].ids.length, color: color ? 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',1)' : "", id: i };
                if (SQueryResults._tablePropertyAMT != "--EMPTY--") {
                    let amount = SQueryResults._calculateAMT(SQueryResults._categoryHash[i].ids);
                    data.amt = amount;
                }

                tdata.push(data);
            }
            SQueryResults._table.setData(tdata);
        });

        SQueryResults._table.on("cellEdited", function (cell) {
            if (cell.getField() == "color") {
                let autoColors = SQueryEditor._mainFilter.getAutoColors();
                if (!autoColors) {
                    autoColors = [];
                    SQueryEditor._mainFilter.setAutoColors(autoColors, SQueryResults._tableProperty);
                }
                let data = cell.getRow().getData();
                autoColors[data.name] = SQueryResults._convertColor(data.color);
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

        if (SQueryResults._tablePropertyExpanded0.indexOf("Node Name") != -1) {
            SQueryResults._tablePropertyExpanded0 = "Node Type";
        }

    
        $("#" + SQueryResults._maindiv + "_searchitems").empty();
        $("#" + SQueryResults._maindiv + "_searchitems").css("overflow", "inherit");
        $("#" + SQueryResults._maindiv + "_found").empty();
        $("#SQueryResultsFirstRow").css("display", "none");


        let sortedStrings = SQueryResults.getAllProperties();
        sortedStrings.shift();
        sortedStrings.shift();

        let html = '<div style="height:35px;">';
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:-5px;position:absolute;" onclick=\'hcSQueryUI.SQueryResults._generatePropertyView(true)\'>Property View</button>';
        html += '<div style="height:25px;"><span style="top:-5px;position:relative"><span style="font-family:courier">Prop1:</span><select id="SQueryPropExpandedSelect0" onchange=\'hcSQueryUI.SQueryResults._propertyExpandedSelected(0);\' class="SQueryPropertyResultsSelect" value="">';
        
        for (let i = 0; i < sortedStrings.length; i++) {
            if (SQueryResults._tablePropertyExpanded0 == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
        }
        html += '</select></span>';
        html += '<span style="top:15px;left:0px;position:absolute"><span style="font-family:courier">Prop2:</span><select id="SQueryPropExpandedSelect1" onchange=\'hcSQueryUI.SQueryResults._propertyExpandedSelected(1);\' class="SQueryPropertyResultsSelect" value="">';
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
            if (aDate == "Invalid Date") {
                return -1;
            }
            if (bDate == "Invalid Date") {
                return -1;
            }

            if (aDate > bDate) {
                return 1;
            }
            if (aDate < bDate) {
                return -1;
            }
            return 0;

        }
    
        
        let tabulatorColumes = [{
            title: "Name", field: "name"
        },
        {
            title: "ID", field: "id", visible: false
        }];

        let unitTitle = "";
        let bcalc = undefined;
        if (SQueryResults.isNumberProp(SQueryResults._tablePropertyExpanded0)) {
            let unit = SQueryResults._getAMTUnit(SQueryResults._tablePropertyExpanded0);
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
            title: unitTitle, field: "prop1", bottomCalc:bcalc, sorter:SQueryResults._tablePropertyExpanded0.indexOf("Date") != -1 ? sorter : undefined
        });

        let bcalc2 = undefined;

        if (SQueryResults._tablePropertyExpanded1 != "--EMPTY--") {

            let unitTitle = "";
            if (SQueryResults.isNumberProp(SQueryResults._tablePropertyExpanded1)) {
                let unit = SQueryResults._getAMTUnit(SQueryResults._tablePropertyExpanded1);
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
                title: unitTitle, field: "prop2", bottomCalc: bcalc2, sorter:SQueryResults._tablePropertyExpanded1.indexOf("Date") != -1 ? sorter : undefined
            });
        }

        SQueryResults._table = new Tabulator("#SQueryResultsTabulator", {
            rowHeight: 15,
            selectable: true,
            selectableRangeMode:"click",
            layout: "fitColumns",
            columns: tabulatorColumes,
        });

        SQueryResults._table.on("rowClick", async function (e, row) {
   //         let data = row.getData();          
    //        SQueryResults._viewer.selectionManager.selectNode(parseInt(data.id), Communicator.SelectionMode.Set);        
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

            let tdata = [];
            for (let i=0;i<nodeids.length;i++) {
                let name = SQueryResults._viewer.model.getNodeName(nodeids[i]);
                let prop1;
                if (SQueryResults._tablePropertyExpanded0.indexOf("Node Name") != -1 || SQueryResults._tablePropertyExpanded0.indexOf("Node Type") != -1) {
                    prop1 = Communicator.NodeType[SQueryResults._viewer.model.getNodeType(nodeids[i])];
                }
                else if (SQueryResults._tablePropertyExpanded0.indexOf("Node Parent") != -1) {
                    prop1 = SQueryResults._viewer.model.getNodeName(SQueryResults._viewer.model.getNodeParent(nodeids[i]));
                }
                else if (SQueryResults.isNumberProp(SQueryResults._tablePropertyExpanded0)) {
                    prop1 = parseFloat(SQueryResults._manager._propertyHash[nodeids[i]][SQueryResults._tablePropertyExpanded0]);
                    if (isNaN(prop1)) {
                        prop1 = "Not Defined";
                    }
                }
                else {
                    prop1 = SQueryResults._manager._propertyHash[nodeids[i]][SQueryResults._tablePropertyExpanded0];
                }
                if (prop1 == undefined) {
                    prop1 = "Not Defined";
                }
                let data = { name:name , id: nodeids[i], prop1:prop1};
                if (SQueryResults._tablePropertyExpanded1 != "--EMPTY--") {
                    if (SQueryResults._tablePropertyExpanded1.indexOf("Node Name") != -1 || SQueryResults._tablePropertyExpanded1.indexOf("Node Type") != -1) {
                        data.prop2 = Communicator.NodeType[SQueryResults._viewer.model.getNodeType(nodeids[i])];
                    }
                    else if (SQueryResults._tablePropertyExpanded1.indexOf("Node Parent") != -1) {
                        data.prop2 = SQueryResults._viewer.model.getNodeName(SQueryResults._viewer.model.getNodeParent(nodeids[i]));
                    }
                    else if (SQueryResults.isNumberProp(SQueryResults._tablePropertyExpanded1)) {
                        data.prop2 = parseFloat(SQueryResults._manager._propertyHash[nodeids[i]][SQueryResults._tablePropertyExpanded1]);
                        if (isNaN(data.prop2)) {
                            data.prop2 = "Not Defined";
                        }
                    }
                    else {
                        data.prop2 = SQueryResults._manager._propertyHash[nodeids[i]][SQueryResults._tablePropertyExpanded1];
                        if (data.prop2 == undefined) {
                            data.prop2 = "Not Defined";
                        }
                    }                    
                }
                tdata.push(data);
            }

            SQueryResults._table.setData(tdata);
        });
    }



    static _getAMTUnit(propstring) {
        let prop = SQueryResults._manager._allPropertiesHash[propstring];
        if (prop != undefined) {
            for (let j in prop) {
                if (j.indexOf("mm²") != -1) {
                    return "mm²";
                }
                else if (j.indexOf("m²") != -1) {
                    return "m²";
                }
                else if (j.indexOf("mm³") != -1) {
                    return "mm³";
                }
                else if (j.indexOf("m³") != -1) {
                    return "m³";
                }
                else if (j.indexOf("mm") != -1) {
                    return "mm";
                }
                else if (j.indexOf("m") != -1) {
                    return "m";
                }
                else if (j.indexOf("inch³") != -1) {
                    return "inch³";
                }
                else if (j.indexOf("inch²") != -1) {
                    return "inch²";
                }
                break;
            }
        }
    }

    static _calculateAMT(ids) {
        if (SQueryResults._aggType == "sum") {
            let amount = 0;
            for (let i = 0; i < ids.length; i++) {
                let res = SQueryResults._manager._propertyHash[ids[i]][SQueryResults._tablePropertyAMT];
                if (res != undefined) {
                    amount += parseFloat(res);
                }
            }
            return amount;
        }
        else {
            let numbers = [];
            for (let i = 0; i < ids.length; i++) {
                let res = SQueryResults._manager._propertyHash[ids[i]][SQueryResults._tablePropertyAMT];
                if (res != undefined) {
                    numbers.push(parseFloat(res));
                }
            }

            if (numbers.length === 0) {
                return 0;
            }

            if (SQueryResults._aggType == "avg") {

                const sum = numbers.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
                const avg = sum / numbers.length;
                return avg;
            }
            else if (SQueryResults._aggType == "max") {
                return Math.max(...numbers);
            }
            else if (SQueryResults._aggType == "min") {
                return Math.min(...numbers);
            }
            else if (SQueryResults._aggType == "med") {
                numbers.sort((a, b) => a - b);
                const middle = Math.floor(numbers.length / 2);

                return numbers.length % 2 === 0
                    ? (numbers[middle - 1] + numbers[middle]) / 2
                    : numbers[middle];
            }
        }
    }

    static _convertColor(color) {
        switch (color) {
            case "red":
                return new Communicator.Color(255, 0, 0);
            case "green":
                return new Communicator.Color(0, 255, 0);
            case "blue":
                return new Communicator.Color(0, 0, 255);
            case "yellow":
                return new Communicator.Color(255, 255, 0);
            case "brown":
                return new Communicator.Color(150, 75, 0);
            case "black":
                return new Communicator.Color(0, 0, 0);
            case "white":
                return new Communicator.Color(255, 255, 255);
            case "orange":
                return new Communicator.Color(255, 165, 0);
            case "grey":
                return new Communicator.Color(128, 128, 128);
        }
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


    static generateSearchResults(founditems) {
        $("#SQueryResultsFirstRow").css("display", "block");
        $("#SQueryToggleViewButton").html("Property View");
        SQueryResults._isPropertyView = false;
        $("#" + SQueryResults._maindiv + "_searchitems").empty();
        $("#" + SQueryResults._maindiv + "_searchitems").css("overflow", "auto");
        $("#" + SQueryResults._maindiv + "_found").empty();
        if (founditems == undefined)
            return;

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
                let parent = SQueryResults._viewer.model.getNodeParent(SQueryEditor._founditems[i].id);
                if (SQueryResults._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(parent))) {
                    html += '<div onclick=\'hcSQueryUI.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItemselectedIndirect">';
                }
                else {
                    html += '<div onclick=\'hcSQueryUI.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItemselected">';
                }
            }
            else {
                if (toggle)
                    html += '<div onclick=\'hcSQueryUI.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItem1">';
                else
                    html += '<div onclick=\'hcSQueryUI.SQueryResults._select("' + founditems[i].id + '")\' class="SQuerySearchItem2">';
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
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.selectAll(this)\'>Select</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.isolateAll(this)\'>Isolate</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.makeVisible(true)\'>Show</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.makeVisible(false)\'>Hide</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.resetModel()\'>Reset Model</li>';
        html += '<li >---</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.colorize(new Communicator.Color(255,0,0))\'>Red</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.colorize(new Communicator.Color(0,255,0))\'>Green</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.colorize(new Communicator.Color(0,0,255))\'>Blue</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.colorize(new Communicator.Color(255,255,0))\'>Yellow</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.colorize(new Communicator.Color(128,128,128))\'>Grey</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.setOpacity(0.7)\'>Transparent</li>';
        html += '<li onclick=\'hcSQueryUI.SQueryEditor.setOpacity(1)\'>Opaque</li>';
        html += '</ul>';
        return html;
    }

    // static _generateAssignColorDropdown() {
    //     let html = "";
    //     html += '<button id="SQueryResultsDropdown2" style="right:5px;top:3px;position:absolute;" class="SQuerySearchButton SQueryDropdow-button">Set Colors</button>';
    //     html += '<ul  id="SQueryResultsDropdownContent2" style="right:-20px;top:10px;position:absolute;" class="SQueryDropdow-content">';
    //     html += '<li style="font-weight:bold" onclick=\'hcSQueryUI.SQueryResults.applyColors()\'>Apply to model</li>';
    //     html += '</ul>';
    //     return html;
    // }


}