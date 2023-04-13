import { SQueryResultsUI } from './SQueryResultsUI.js';


export class SQueryEditorUI {
    
    static _chainSkip = 0;
    static _showLimitOption = true;
    static _showFirstRow = true;
    static _showPropertyStats = true;
    static _hideIFCProperties = false;
    static _searchResultsCallback = null;

    static _htmlEncode(html) {
        html = $.trim(html);
        return html.replace(/[&"'\<\>]/g, function (c) {
            switch (c) {
                case "&":
                    return "&amp;";
                case "'":
                    return "&#39;";
                case '"':
                    return "&quot;";
                case "<":
                    return "&lt;";
                default:
                    return "&gt;";
            }
        });
    }

    static initialize(maindiv, manager, startnode) {
        SQueryEditorUI.ctrlPressed = false;

     
        $(document).on('keyup keydown', function(e){
            
            SQueryEditorUI.shiftPressed = e.shiftKey;
            SQueryEditorUI.ctrlPressed = e.ctrlKey;
        } );

        SQueryEditorUI._maindiv = maindiv;
        SQueryEditorUI._manager = manager;
        SQueryEditorUI._viewer = manager._viewer;
        SQueryEditorUI._mainFilter = new hcSQuery.SQuery(SQueryEditorUI._manager, startnode);
        SQueryEditorUI._mainFilter.tempId = 0;

        new ResizeObserver(function () {
            SQueryEditorUI.adjust()
           
        }).observe($("#" + SQueryEditorUI._maindiv)[0]);

        if (!SQueryEditorUI._searchResultsCallback) {
            SQueryResultsUI.initialize(SQueryEditorUI._maindiv + '_resultscontainer', manager);
        }
    }

    static setHideIFCProperties(onoff) {
        SQueryEditorUI._hideIFCProperties = onoff;
    }

    static setChainSkip(skip) {
        SQueryEditorUI._chainSkip = skip;

    }

    static showFirstRow(showFirstRow) {
        SQueryEditorUI._showFirstRow = showFirstRow;

    }

    static showPropertyStats(onoff) {
        SQueryEditorUI._showPropertyStats = onoff;
    }

    static setSearchResultsCallback(callback) {
        SQueryEditorUI._searchResultsCallback = callback;
    }


    static _generateDropdown() {
        let html = "";
        html += '<button style="right:57px;top:3px;position:absolute;" class="SQuerySearchButton SQueryDropdow-button">...</button>';
        html += '<ul style="right:22px;top:10px;position:absolute;" class="SQueryDropdow-content">';
        html +='<li onclick=\'hcSQuery.SQueryEditorUI._setSearchChildren(this)\'><span style="left:-5px;position:absolute;">&#x2714</span>Search Children</li>';        
        html +='<li onclick=\'hcSQuery.SQueryEditorUI._setSearchVisible(this)\'>Search Visible</li>';              
        html +='<li>---</li>';              
        html +='<li onclick=\'hcSQuery.SQueryEditorUI._toggleLighting()\'>Toggle Lighting</li>';              
        html +='<li onclick=\'hcSQuery.SQueryEditorUI._viewer.model.setNodesFaceColor([hcSQuery.SQueryEditorUI._viewer.model.getRootNode()],Communicator.Color.white())\'>Set to White</li>';              
        html += '</ul>';
        return html;
    }

    static _toggleLighting() {
        SQueryEditorUI._viewer.view.setLightingEnabled(!SQueryEditorUI._viewer.view.getLightingEnabled());
    }

    static async display() {
        
        await SQueryEditorUI._manager.initialize();

        let html = "";
        html += '<div class = "SQueryMain" id="' + SQueryEditorUI._maindiv + '_main">';
        if (SQueryEditorUI._showFirstRow) {
            html+='<div id = "SQueryEditorUIFirstRow">';
            if (SQueryEditorUI._showLimitOption) {
                html += '<div id="' + SQueryEditorUI._maindiv + '_firstrow" style="position:relative;height:20px;">';
                html += '<button title = "Select nodes current search is limited to" id="SQUeryLimitSelectionButton" disabled style="position:relative;top:-1px"class="SQuerySearchButton" type="button" style="right:65px;top:2px;position:absolute;" onclick=\'hcSQuery.SQueryEditorUI._limitSelectionShow()\'>Limit</button><input title = "Limit search to currently selected entities" onclick=\'hcSQuery.SQueryEditorUI._limitSelection()\' style="position:relative;left:-2px;top:2px;" type = "checkbox" id="' + SQueryEditorUI._maindiv + '_searchfromselection">'
                html += '</div>';
            }
            else {
                html += '<div style="position:relative;height:20px;"></div>';

            }

            html += SQueryEditorUI._generateDropdown();
            html += '<button class="SQuerySearchButtonImportant" type="button" style="right:5px;top:3px;position:absolute;" onclick=\'hcSQuery.SQueryEditorUI.search()\'>Search</button>';
            html += '<hr class="SQueryEditorUIDivider">';
            html += '</div>';
        }

        html += '<div id="' + SQueryEditorUI._maindiv + '_conditions" class="SQuerySearchtoolsConditions">';
        html += await SQueryEditorUI._generateConditions();
        html += '</div>';
        
        if (!SQueryEditorUI._searchResultsCallback) {
            html += '<hr>';
            html += '<div id="' + SQueryEditorUI._maindiv + '_resultscontainer"</div>';
        }
        html += '</div>';
        $("#" + SQueryEditorUI._maindiv).empty();
        $("#" + SQueryEditorUI._maindiv).append(html);

        if (!SQueryEditorUI._searchResultsCallback) {

            SQueryResultsUI.display();
        }

        if (SQueryEditorUI._showFirstRow) {
            const SQueryDropdowButton = document.querySelector('.SQueryDropdow-button');
            const SQueryDropdowContent = document.querySelector('.SQueryDropdow-content');

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

        SQueryEditorUI._generateSearchResults();
        SQueryEditorUI._addFilterFromUI(false,0);

    }

    static getFilter() {
        return SQueryEditorUI._mainFilter;
    }

    static adjust() 
    {

        if (SQueryEditorUI._searchResultsCallback) {
            return;
        }
        SQueryResultsUI.adjust();

    }

    static flush() {
        $("#" + SQueryEditorUI._maindiv).empty();
    }


    static async search(doAction = false) {

        SQueryEditorUI.updateFilterFromUI();
      
        SQueryEditorUI.clearSearchResults();
        $("#SQueryEditorUIFirstRow").css("opacity", 0.5);
        $("#SQueryEditorUIFirstRow").css("pointer-events", "none");
        if (!SQueryEditorUI._searchResultsCallback) {
            $("#" + SQueryResultsUI._maindiv + "_found").append("Searching...");
        }
        let nodeids = await SQueryEditorUI._mainFilter.apply();
        $("#SQueryEditorUIFirstRow").css("opacity", "");
        $("#SQueryEditorUIFirstRow").css("pointer-events", "");



        let startnode = SQueryEditorUI._mainFilter.getStartNode();
        SQueryEditorUI._founditems = new hcSQuery.SQueryResult(this._manager, SQueryEditorUI._mainFilter);
        SQueryEditorUI._founditems.generateItems(nodeids, startnode, SQueryEditorUI._chainSkip);

        SQueryEditorUI._generateSearchResults();
        if (doAction) {
            SQueryEditorUI._mainFilter.performAction(nodeids);
        }
    }


    static _getSQueryFromTempId(id) {

        if (id == 0) {
            return SQueryEditorUI._mainFilter;
        }

        for (let i=0;i<SQueryEditorUI._mainFilter.getNumConditions();i++)
        {
            let condition = SQueryEditorUI._mainFilter.getCondition(i);
            if (condition.childFilter && condition.childFilter.tempId == id)
            {
                return condition.childFilter;
            }
        }

    }

    static async _updateSearch() {
        if (SQueryEditorUI._founditems || SQueryEditorUI._mainFilter.getNumConditions()) {
            await SQueryEditorUI.search();
        }
    }

    static resetModel() {                                    
        this._viewer.model.reset();
        this._viewer.model.unsetNodesFaceColor([this._viewer.model.getAbsoluteRootNode()]);
        this._viewer.selectionManager.clear();
    }

    static getFoundItems() {
        return SQueryEditorUI._founditems;
    }

    static selectAll() {        
                     
        if (!SQueryEditorUI.ctrlPressed) {
            SQueryEditorUI._viewer.selectionManager.clear();
        }
        this._founditems.selectAll();
        SQueryEditorUI._generateSearchResults();
    }

    static updateFilterFromUI(SQueryIn) {
        let SQuery;
        if (!SQueryIn)
        {
            SQuery = SQueryEditorUI._mainFilter;                 
        }
        else
        {
            SQuery = SQueryIn;
        }

        for (let i = 0; i < SQuery.getNumConditions(); i++) {
            let condition = SQuery.getCondition(i);
            if (condition.childFilter) {
                this.updateFilterFromUI(condition.childFilter);
            }
            else {
                condition.conditionType = hcSQuery.SQueryCondition.convertStringConditionToEnum($("#" + SQueryEditorUI._maindiv + "_propertyChoiceSelect" + i + "-" + SQuery.tempId)[0].value);
                condition.propertyType = hcSQuery.SQueryCondition.convertStringPropertyTypeToEnum($("#" + SQueryEditorUI._maindiv + "_propertyTypeSelect" + i + "-" + SQuery.tempId)[0].value);

                let relSet = false;
                if (condition.propertyType == hcSQuery.SQueryPropertyType.relationship) {
                    relSet = true;
                    condition.relationship = hcSQuery.SQueryCondition.convertStringToRelationshipType($("#" + SQueryEditorUI._maindiv + "_propertyTypeSelect" + i + "-" + SQuery.tempId)[0].value);
                    condition.propertyType = hcSQuery.SQueryPropertyType.nodeName;
                    condition.propertyName = "Node Name";
                }
                if ($("#" + SQueryEditorUI._maindiv + "_modeltreesearchtext" + i + "-" + SQuery.tempId)[0] != undefined) {
                    if (!condition.propertyType == hcSQuery.SQueryPropertyType.SQuery) {
                        condition.text = SQueryEditorUI._htmlEncode($("#" + SQueryEditorUI._maindiv + "_modeltreesearchtext" + i + "-" + SQuery.tempId)[0].value);
                    }
                    else {
                        condition.text = $("#" + SQueryEditorUI._maindiv + "_modeltreesearchtext" + i + "-" + SQuery.tempId)[0].value;

                    }
                }
                if (!relSet) {
                    condition.propertyName = $("#" + SQueryEditorUI._maindiv + "_propertyTypeSelect" + i + "-" + SQuery.tempId)[0].value;                
                }
                if (SQueryEditorUI._showPropertyStats && condition.propertyName.endsWith(")")) {
                    let lastindex = condition.propertyName.lastIndexOf("(") - 1;
                    condition.propertyName = condition.propertyName.substring(0, lastindex);
                }
            }
            if (i == 1) {
                condition.and = ($("#" + SQueryEditorUI._maindiv + "_andOrchoiceSelect" + i + "-" + SQuery.tempId)[0].value == "and") ? true : false;
            }
            else if (i > 1) {
                condition.and = ($("#" + SQueryEditorUI._maindiv + "_andOrchoiceSelect" + 1 + "-" + SQuery.tempId)[0].value == "and") ? true : false;
            }    
        }
    }

    static async refreshUI() {     
        $("#" + SQueryEditorUI._maindiv + "_conditions").empty();
        $("#" + SQueryEditorUI._maindiv + "_conditions").append(await SQueryEditorUI._generateConditions());
        SQueryEditorUI.adjust();

    }
    
    static async _andorchangedFromUI() {
        SQueryEditorUI.updateFilterFromUI();
        await SQueryEditorUI.refreshUI();
    }


    static async _convertToChildfilter() {
        let SQuery = SQueryEditorUI._mainFilter; 
        let newfilter = new hcSQuery.SQuery(SQueryEditorUI._manager, SQueryEditorUI._mainFilter.getStartNode());

        for (let i = 0; i < SQuery.getNumConditions(); i++) {

            let condition = SQuery.getCondition(i);
            if (!condition.childFilter) {
                newfilter.addCondition(condition);
                SQuery.removeCondition(i);
                i--;
            }
        }

        if (newfilter.getNumConditions()) {
            let condition = new hcSQuery.SQueryCondition();
            condition.propertyName = "Node Name";
            condition.setChildFilter(newfilter);

            SQuery.addCondition(condition);

            await SQueryEditorUI.refreshUI();
        }
            
    }
    static async _addFilterFromUI(createChildFilter, id) {
        let SQuery;
        SQueryEditorUI.clearSearchResults();
        SQueryEditorUI.updateFilterFromUI();

        SQuery = SQueryEditorUI._getSQueryFromTempId(id);
        let childFilter = null;
        if (createChildFilter) {
            childFilter = new hcSQuery.SQuery(SQueryEditorUI._manager, SQueryEditorUI._mainFilter.getStartNode());
            childFilter.addCondition(new hcSQuery.SQueryCondition());
        }
            
        if (SQuery.getNumConditions() <= 1) {
            let condition = new hcSQuery.SQueryCondition();
            condition.propertyName = "Node Name";
            condition.setChildFilter(childFilter);

            SQuery.addCondition(condition);
        }
        else
        {
            let previousCondition = SQuery.getCondition(SQuery.getNumConditions() - 1);
            let condition = new hcSQuery.SQueryCondition();
            condition.propertyName = "Node Name";
            condition.setChildFilter(childFilter);
            condition.setAndOr(previousCondition.getAndOr());
            SQuery.addCondition(condition);
        }

        await SQueryEditorUI.refreshUI();
    }


    static _deleteFilter(i,id) {
        SQueryEditorUI.clearSearchResults();
        SQueryEditorUI.updateFilterFromUI();
        let SQuery = SQueryEditorUI._getSQueryFromTempId(id);
        SQuery.removeCondition(i);

        SQueryEditorUI.refreshUI();

    }

    static _setSearchChildren(el) {
        
        SQueryEditorUI._manager.setKeepSearchingChildren(!SQueryEditorUI._manager.getKeepSearchingChildren());
        let text = "Search Children";
        if (SQueryEditorUI._manager.getKeepSearchingChildren()) {
            text = '<span style="left:-5px;position:absolute;">&#x2714</span>' + text;
        }
        $(el).html(text);
    }

    static _setSearchVisible(el) {
        
        SQueryEditorUI._manager.setSearchVisible(!SQueryEditorUI._manager.getSearchVisible());
        let text = "Search Visible";
        if (SQueryEditorUI._manager.getSearchVisible()) {
            text = '<span style="left:-5px;position:absolute;">&#x2714</span>' + text;
        }
        $(el).html(text);
    }


    static _limitSelectionShow() {
      
        let nodeids = SQueryEditorUI._mainFilter.getLimitSelectionList();
        SQueryEditorUI._founditems = new hcSQuery.SQueryResult(this._manager, SQueryEditorUI._mainFilter);
        SQueryEditorUI._founditems.generateItems(nodeids,SQueryEditorUI._viewer.model.getRootNode(),0);

        SQueryEditorUI.selectAll();        
    }


    static _limitSelection() {
      
        if ($("#" + SQueryEditorUI._maindiv + "_searchfromselection")[0].checked) {
            let limitselectionlist = [];
            let r = SQueryEditorUI._viewer.selectionManager.getResults();
            for (let i = 0; i < r.length; i++) {
                limitselectionlist.push(r[i].getNodeId());
            }
            SQueryEditorUI._mainFilter.limitToNodes(limitselectionlist);
            $( "#SQUeryLimitSelectionButton" ).prop( "disabled", false );
        }
        else
        {
            SQueryEditorUI._mainFilter.limitToNodes([]);
            $( "#SQUeryLimitSelectionButton" ).prop( "disabled", true );
        }
    }

    static clearSearchResults() {
        SQueryEditorUI._founditems = undefined; 
        SQueryEditorUI._generateSearchResults();
    }

    static _generateSearchResults() {
        if (SQueryEditorUI._searchResultsCallback) {
            SQueryEditorUI._searchResultsCallback(SQueryEditorUI._founditems);
        }
        else {
            SQueryResultsUI.generateSearchResults(SQueryEditorUI._founditems);           
        }
    }


    static _generateAndOrChoiceSelect(condition, filterpos, SQuery) {
        let html = "";
        if (filterpos == 0 || filterpos > 1) {
            if (filterpos ==0) {      
                if (!condition.childFilter) {
                    return '<span style="top:7px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;width:50px;max-width:50px;min-width:50px">Where:</span>';
                }
                else {
                    return '<span style="top:7px;left:6px;position:relative;font-size:14px; margin-top:2px;height:20px;width:50px;max-width:50px;min-width:50px">Where:</span>';

                }
            }
            else {
                return '<span style="top:5px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;max-width:50px;min-width:50px">' + (condition.and ? "and":"or") + '</span>';
            }
        }
        else {

            let html = '<span style="top:5px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;max-width:50px;min-width:50px">';
            html += '<select class="SQuerySearchSelect" onchange=\'hcSQuery.SQueryEditorUI._andorchangedFromUI()\' id="' +  
            SQueryEditorUI._maindiv + '_andOrchoiceSelect' + filterpos + "-" + SQuery.tempId + '" value="">\n';

            if (condition.and) {
                html += '<option value="and" selected>and</option>\n';
                html += '<option value="or">or</option>\n';
            }
            else {
                html += '<option value="and">and</option>\n';
                html += '<option value="or" selected>or</option>\n';
            }
                         
            html += '</select></span>\n';
            return html;
        }
    }

    static _generateChoiceSelect(condition, filterpos,SQuery) {

        let html = '<select onchange=\'hcSQuery.SQueryEditorUI._andorchangedFromUI()\' class="SQueryAndOrSelect" id="' +  
            SQueryEditorUI._maindiv + '_propertyChoiceSelect' + filterpos + "-" + SQuery.tempId + '" value="">\n';

        let choices;
        
        if (condition.propertyName == "SQuery") {
            choices =  ["=", "\u2260"];
        }
        else if (condition.propertyName == "Bounding") {
            choices =  ["evaluate"];
        }
        else if (condition.propertyName == "COG") {
            choices =  ["contains","evaluate", "exists"];
        }
        else {
            choices =  ["contains", "exists","!exists", ">=", "<=",">=(Date)", "<=(Date)", "=", "\u2260"];
        }


        for (let i = 0; i < choices.length; i++) {
            if (choices[i] == hcSQuery.SQueryCondition.convertEnumConditionToString(condition.conditionType)) {
                html += '<option selected value="' + choices[i] + '">' + choices[i] + '</option>\n';
            }
            else {
                html += '<option value="' + choices[i] + '">' + choices[i] + '</option>\n';
            }
        }
       
        html += '</select>\n';
        return html;
    }

    static _clearInputField(filterpos, filterid)
    {
        if ($("#" + SQueryEditorUI._maindiv + "_modeltreesearchtext" + filterpos + "-" + filterid)[0])
        {
            $("#" + SQueryEditorUI._maindiv + "_modeltreesearchtext" + filterpos + "-" + filterid)[0].value = "";
        }
    }

    static _generatePropertyTypeSelect(condition, filterpos, SQuery) {
      

        let html = '<select onchange=\'hcSQuery.SQueryEditorUI._clearInputField(' + filterpos + "," + SQuery.tempId + ');hcSQuery.SQueryEditorUI._andorchangedFromUI();\' class="SQueryPropertyTypeSelect" id="' +  
            SQueryEditorUI._maindiv + '_propertyTypeSelect' + filterpos + "-" + SQuery.tempId + '" value="">\n';       

        let sortedStrings = SQueryEditorUI._manager.getAllProperties(SQueryEditorUI._hideIFCProperties);

        if (SQueryEditorUI._showPropertyStats) {
            for (let i = 0; i < sortedStrings.length; i++) {
                if (SQueryEditorUI._showPropertyStats) { }
                let numOptions = SQueryEditorUI._manager.getNumOptions(sortedStrings[i]);
                if (numOptions) {
                    let numOptionsUsed = SQueryEditorUI._manager.getNumOptionsUsed(sortedStrings[i]);
                    sortedStrings[i] = sortedStrings[i] + " (" + numOptions + "/" + numOptionsUsed + ")";
                }
            }
        }

        let prefix = "";

        let propertyNamePlus = condition.propertyName;

        if (SQueryEditorUI._showPropertyStats) {
            let numOptions = SQueryEditorUI._manager.getNumOptions(propertyNamePlus);
            if (numOptions) {
                let numOptionsUsed = SQueryEditorUI._manager.getNumOptionsUsed(propertyNamePlus);
                propertyNamePlus = propertyNamePlus + " (" + numOptions + "/" + numOptionsUsed + ")";
            }
        }

        for (let i = 0; i < sortedStrings.length;i++) {
            if (propertyNamePlus == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + prefix + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + prefix + sortedStrings[i] + '</option>\n';
        }
        html += '</select>\n';
        return html;
    }


    static async _updateBoundingDatalist(el) {
        let nodeids = [];
        let r = hcSQuery.SQueryEditorUI._viewer.selectionManager.getResults();
        for (let i = 0; i < r.length; i++) {
            nodeids.push(r[i].getNodeId());
        }

        if (nodeids.length > 0) {
            let lbounds = await hcSQuery.SQueryEditorUI._viewer.model.getNodesBounding(nodeids);
            let text = ("bounds:" + lbounds.min.x + " " + lbounds.min.y + " " + lbounds.min.z + " " + lbounds.max.x + " " + lbounds.max.y + " " + lbounds.max.z);
            $(el).next().html('<option value="' + text + '"></option>')
        }
        else {
            $(el).next().html('<option value=""></option>')
        }
        
    }

    static async _updateColorDatalist(el) {

        if (hcSQuery.SQueryEditorUI._viewer.selectionManager.getLast()) {
            let nodeid = hcSQuery.SQueryEditorUI._viewer.selectionManager.getLast().getNodeId();
            let children = hcSQuery.SQueryEditorUI._viewer.model.getNodeChildren(nodeid);
            if (children.length > 0)
                nodeid = children[0];
            let colors = await hcSQuery.SQueryEditorUI._viewer.model.getNodesEffectiveFaceColor([nodeid]);
            $(el).next().html('<option value="' + colors[0].r + " " + colors[0].g + " " + colors[0].b + '"></option>');
        }
        else {
            $(el).next().html('<option value=""></option>')
        }        
    }

    static async _generateInput(condition,filterpos,SQuery) {
      

        let html = "";
        if (condition.propertyName == "Bounding") {            
            html = '<input type="search" onfocus="hcSQuery.SQueryEditorUI._updateBoundingDatalist(this)" class = "valueinput" list="datalist' + filterpos + "-" + SQuery.tempId +'" id="' + SQueryEditorUI._maindiv + 
            '_modeltreesearchtext' + filterpos + "-" + SQuery.tempId + '" value="' + condition.text + '">\n';
        }
        else if (condition.propertyName == "Node Color") {
                html = '<input type="search" onfocus="hcSQuery.SQueryEditorUI._updateColorDatalist(this)" class = "valueinput" list="datalist' + filterpos + "-" + SQuery.tempId +'" id="' + SQueryEditorUI._maindiv + 
                '_modeltreesearchtext' + filterpos + "-" + SQuery.tempId + '" value="' + condition.text + '">\n';    
        }
        else {
            html = '<input type="search" class = "valueinput" list="datalist' + filterpos + "-" + SQuery.tempId +'" id="' + SQueryEditorUI._maindiv + 
            '_modeltreesearchtext' + filterpos + "-" + SQuery.tempId + '" value="' + condition.text + '">\n';

        }
        html += '<datalist id="datalist' + filterpos + "-" + SQuery.tempId +'">\n';
        let sortedStrings = [];
        if (condition.propertyName == "Node Type") {
            for (const property in Communicator.NodeType) {
                if (isNaN(parseFloat(Communicator.NodeType[property])))
                    sortedStrings.push(Communicator.NodeType[property]);
            }

        }      
        else if (condition.propertyName == "SQuery") {
            let SQuerys = SQueryEditorUI._manager.getSQuerys();
            for (let i=0;i<SQuerys.length;i++) {
                sortedStrings.push(SQuerys[i].getName());
            }
        }        
        else {
            let options = SQueryEditorUI._manager.getAllOptionsForProperty(condition.propertyName);
            for (let i in options) {
                sortedStrings.push(i);
            }
        }
        sortedStrings.sort();

        for (let i = 0; i < sortedStrings.length; i++) {
            if (condition.propertyName == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected></option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '"></option>\n';
        }
        html += '</datalist>\n';
        return html;
    }

    static _generateTrashBin() {
        let text = '<div title = "Delete condition" class="icon-trash" style="float: left;">'
        text += '<div class="trash-lid"></div>'
        text += '<div class="trash-container"></div>'
        text += '<div class="trash-line-1"></div>'
        text += '<div class="trash-line-2"></div>'
        text += '<div class="trash-line-3"></div>';
        text += '</div>';
        return text;
    }
    static async _generateConditions(SQueryIn,index) {                
        let html = "";
        let SQuery;
        let tempId;
        if (!SQueryIn)
        {
            SQueryEditorUI.tempId = 0;
            SQuery = SQueryEditorUI._mainFilter;                 
        }
        else
        {
            SQuery = SQueryIn;
        }

        SQuery.tempId = SQueryEditorUI.tempId;

        if (SQueryIn)
        {
                html += '<div class = "SQueryChildCondition" style = "position:relative;left:65px;top:-10px">';
            
        }
        for (let i = 0; i < SQuery.getNumConditions(); i++) {
            let condition = SQuery.getCondition(i);
            if (condition.childFilter) {
                SQueryEditorUI.tempId++;
                html += '<div>';
                html += '<div style="position:relative;width:10px; height:10px;float:left;top:10px;left:-1px" onclick=\'hcSQuery.SQueryEditorUI._deleteFilter(' + i + "," + SQuery.tempId + ')\'>';
                html += SQueryEditorUI._generateTrashBin();
                html += '</div>';
                html += SQueryEditorUI._generateAndOrChoiceSelect(condition, i, SQuery);
                html+= await this._generateConditions(condition.childFilter,i);
                html += '</div>';
            }
            else {
                if (condition.relationship) {
                    html += '<div class="SQueryRelationshipTag" style="left:64px;position:relative">Relationship:' + hcSQuery.SQueryCondition.convertEnumRelationshipTypeToString(condition.relationship) + '</div>';
                }

                html += '<div style="height:30px;margin-top:-3px">';
                html += '<div style="position:relative;width:10px; height:10px;float:left;top:10px;left:-1px" onclick=\'hcSQuery.SQueryEditorUI._deleteFilter(' + i + "," + SQuery.tempId + ')\'>';
                html += SQueryEditorUI._generateTrashBin();
                html += '</div>';                
                html += SQueryEditorUI._generateAndOrChoiceSelect(condition, i, SQuery);
                let offset = 66;
                if (SQueryIn) {
                    offset*=2;
                }                
                if (i==1)
                {
                    html += '<div style="display:flex;position:relative;top:-11px;left:64px;margin-right: 1em;width:calc(100%  - ' + offset + 'px)">';
                }
                else
                {
                    html += '<div style="display:flex;position:relative;top:-8px;left:64px;margin-right: 1em;width:calc(100%  - ' + offset + 'px)">';
                }
                html += SQueryEditorUI._generatePropertyTypeSelect(condition, i, SQuery);
                html += SQueryEditorUI._generateChoiceSelect(condition, i, SQuery);
                if (hcSQuery.SQueryCondition.convertEnumConditionToString(condition.conditionType) != "exists" && hcSQuery.SQueryCondition.convertEnumConditionToString(condition.conditionType) != "!exists") {
                    html += await SQueryEditorUI._generateInput(condition, i, SQuery);
                }
                else {
                    html += '<div style="position:relative;left:5px;top:0px;width:275px"></div>';
                }
                html += '</div>';
                html += '</div>';
            }        
        }
        html += '<button title = "Add new condition" class="SQuerySearchButton" type="button" style="margin-top:2px;left:2px;bottom:2px;position:relative;" onclick=\'hcSQuery.SQueryEditorUI._addFilterFromUI(false,' +  SQuery.tempId + ')\'>Add condition</button>';
        if (!SQueryIn)
        {
            html += '<button title="Add new condition group: hold down Shift to convert existing conditions to group" class="SQuerySearchButton" type="button" style="left:4px;bottom:2px;position:relative;" onclick=\'!hcSQuery.SQueryEditorUI.shiftPressed ? hcSQuery.SQueryEditorUI._addFilterFromUI(true,' +  SQuery.tempId + ') : hcSQuery.SQueryEditorUI._convertToChildfilter(true,' +  SQuery.tempId + ')\'>Add condition group</button>';
        }
        else
        {           
            html += '</div>';    
        }       
        return html;
    }

}
