import { SQueryEditor } from './SQueryEditor.js';

export class SQueryResults {

    static initialize(maindiv, manager) {
        SQueryResults._maindiv = maindiv;
        SQueryResults._manager = manager;
        SQueryResults._viewer = manager._viewer;
        SQueryResults._isPropertyView = false;
        SQueryResults._tablePropertyAMT = "--EMPTY--";
        SQueryResults._aggType = "sum";
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
            if (ltext.indexOf("version") != -1 || ltext.indexOf("globalid") != -1 || ltext.indexOf("name") != -1 || ltext.indexOf("date") != -1) {
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
        propnames2.unshift("Node Name");
        return propnames2;
    }

    static _propertySelected() {
        SQueryResults._tableProperty = $("#SQueryPropSelect")[0].value;
        SQueryEditor._mainFilter.setAutoColors(null, null);
        SQueryResults._generatePropertyView();

    }

    static _propertyAggTypeSelected() {
        SQueryResults._aggType = $("#SQueryPropAggType")[0].value;
        SQueryResults._generatePropertyView();

    }

    static _propertyAMTSelected() {
        SQueryResults._tablePropertyAMT = $("#SQueryPropSelectAMT")[0].value;
        SQueryResults._generatePropertyView();

    }

    static _applyColors() {
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

    static _assignColors() {
        for (let i in SQueryResults._categoryHash) {
            let color = new Communicator.Color(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
            SQueryResults._categoryHash[i].color = color;
        }

        let autoColors = [];
        for (let i in SQueryResults._categoryHash) {
            autoColors[i] = SQueryResults._categoryHash[i].color;
        }


        SQueryEditor._mainFilter.setAutoColors(autoColors, SQueryResults._tableProperty);

        SQueryResults._generatePropertyView(true)

    }

    static _generatePropertyView(redrawOnly = false) {

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

        $("#SQueryToggleViewButton").html("Item View");

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
        html += '<button class="SQuerySearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick=\'hcSQueryUI.SQueryResults._assignColors(this)\'>Assign Colors</button>';
        html += '<button class="SQuerySearchButton" type="button" style="right:101px;top:3px;position:absolute;" onclick=\'hcSQueryUI.SQueryResults._applyColors(this)\'>Apply</button>';
        html += '</div>';

        $("#" + SQueryResults._maindiv + "_searchitems").append(html);

        $("#" + SQueryResults._maindiv + "_searchitems").append('<div class = "SQueryResultsTabulator" id = "SQueryResultsTabulator"></div>');


        let tabulatorColumes = [{
            title: SQueryResults._tableProperty, field: "name"
        },
        {
            title: "#", field: "num", width: 40
        },
        {
            title: "Color", field: "color", headerSort: false, field: "color", editor: "list", width: 60,
            formatter: "color", editorParams: { values: ["red", "green", "blue", "yellow", "brown", "orange", "grey", "black", "white"] }
        },
        {
            title: "ID", field: "id", width: 20, visible: false
        }];

        if (SQueryResults._tablePropertyAMT != "--EMPTY--") {

            let unit = SQueryResults._getAMTUnit();
            let unitTitle = "";
            if (unit) {
                unitTitle = SQueryResults._aggType + "(" + unit + ")";
            }
            else {
                unitTitle = SQueryResults._aggType;
            }
            tabulatorColumes.splice(1, 0, {
                title: unitTitle, field: "amt", width: 120
            });
        }


        let rowMenu = [
            {
                label: "<i class='fas fa-user'></i> Expand",
                action: async function (e, row) {
                    let ids = SQueryResults._categoryHash[row.getData().id].ids;
                    SQueryResults.generateExpandedResults(ids);
                }
            },
            {
                label: "<i class='fas fa-user'></i> Expand All",
                action: async function (e, row) {
                    let searchresults = SQueryEditor._founditems;
                    let ids = [];
                    for (let i = 0; i < searchresults.length; i++) {
                        ids.push(searchresults[i].id);
                    }
                    SQueryResults.generateExpandedResults(ids);
                }
            }
            
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
                let data = { name: i, num: SQueryResults._categoryHash[i].ids.length, color: color ? 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',1)' : "", id: i };
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

    static generateExpandedResults(nodeids) {
        $("#" + SQueryResults._maindiv + "_searchitems").empty();
        $("#" + SQueryResults._maindiv + "_searchitems").css("overflow", "inherit");
        $("#" + SQueryResults._maindiv + "_found").empty();

        let html = '<div style="height:25px;">';
        html += '</div>';

        $("#" + SQueryResults._maindiv + "_searchitems").append(html);

        $("#" + SQueryResults._maindiv + "_searchitems").append('<div class = "SQueryResultsTabulator" id = "SQueryResultsTabulator"></div>');


        let tabulatorColumes = [{
            title: "Name", field: "name"
        },
        {
            title: SQueryResults._tableProperty, field: "prop1"
        },
        {
            title: "ID", field: "id", width: 20, visible: false
        }];

        if (SQueryResults._tablePropertyAMT != "--EMPTY--") {

            let unit = SQueryResults._getAMTUnit();
            let unitTitle = "";
            if (unit) {
                unitTitle = SQueryResults._tablePropertyAMT + "(" + unit + ")";
            }
            else {
                unitTitle = SQueryResults._tablePropertyAMT;
            }
            tabulatorColumes.splice(2, 0, {
                title: unitTitle, field: "prop2", width: 120
            });
        }

        SQueryResults._table = new Tabulator("#SQueryResultsTabulator", {
            rowHeight: 15,
            selectable: 0,
            layout: "fitColumns",
            columns: tabulatorColumes,
        });

        SQueryResults._table.on("rowClick", async function (e, row) {
            let data = row.getData();          
            SQueryResults._viewer.selectionManager.selectNode(parseInt(data.id), Communicator.SelectionMode.Set);        
        });

        SQueryResults._table.on("tableBuilt", function () {

            let tdata = [];
            for (let i=0;i<nodeids.length;i++) {
                let name = SQueryResults._viewer.model.getNodeName(nodeids[i]);
                let data = { name:name , id: nodeids[i], prop1:SQueryResults._manager._propertyHash[nodeids[i]][SQueryResults._tableProperty]};
                if (SQueryResults._tablePropertyAMT != "--EMPTY--") {
                    data.prop2 = parseFloat(SQueryResults._manager._propertyHash[nodeids[i]][SQueryResults._tablePropertyAMT]);
                }
                tdata.push(data);
            }

            SQueryResults._table.setData(tdata);
        });
    }



    static _getAMTUnit() {
        let prop = SQueryResults._manager._allPropertiesHash[SQueryResults._tablePropertyAMT];
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

}