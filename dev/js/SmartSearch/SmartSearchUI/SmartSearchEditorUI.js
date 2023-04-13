import { SmartSearchResultsUI } from './SmartSearchResultsUI.js';


export class SmartSearchEditorUI {
    
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
        SmartSearchEditorUI.ctrlPressed = false;

     
        $(document).on('keyup keydown', function(e){
            
            SmartSearchEditorUI.shiftPressed = e.shiftKey;
            SmartSearchEditorUI.ctrlPressed = e.ctrlKey;
        } );

        SmartSearchEditorUI._maindiv = maindiv;
        SmartSearchEditorUI._manager = manager;
        SmartSearchEditorUI._viewer = manager._viewer;
        SmartSearchEditorUI._mainFilter = new hcSmartSearch.SmartSearch(SmartSearchEditorUI._manager, startnode);
        SmartSearchEditorUI._mainFilter.tempId = 0;

        new ResizeObserver(function () {
            SmartSearchEditorUI.adjust()
           
        }).observe($("#" + SmartSearchEditorUI._maindiv)[0]);

        if (!SmartSearchEditorUI._searchResultsCallback) {
            SmartSearchResultsUI.initialize(SmartSearchEditorUI._maindiv + '_resultscontainer', manager);
        }
    }

    static setHideIFCProperties(onoff) {
        SmartSearchEditorUI._hideIFCProperties = onoff;
    }

    static setChainSkip(skip) {
        SmartSearchEditorUI._chainSkip = skip;

    }

    static showFirstRow(showFirstRow) {
        SmartSearchEditorUI._showFirstRow = showFirstRow;

    }

    static showPropertyStats(onoff) {
        SmartSearchEditorUI._showPropertyStats = onoff;
    }

    static setSearchResultsCallback(callback) {
        SmartSearchEditorUI._searchResultsCallback = callback;
    }


    static _generateDropdown() {
        let html = "";
        html += '<button style="right:57px;top:3px;position:absolute;" class="SmartSearchSearchButton SmartSearchDropdow-button">...</button>';
        html += '<ul style="right:22px;top:10px;position:absolute;" class="SmartSearchDropdow-content">';
        html +='<li onclick=\'hcSmartSearch.SmartSearchEditorUI._setSearchChildren(this)\'><span style="left:-5px;position:absolute;">&#x2714</span>Search Children</li>';        
        html +='<li onclick=\'hcSmartSearch.SmartSearchEditorUI._setSearchVisible(this)\'>Search Visible</li>';              
        html +='<li>---</li>';              
        html +='<li onclick=\'hcSmartSearch.SmartSearchEditorUI._toggleLighting()\'>Toggle Lighting</li>';              
        html +='<li onclick=\'hcSmartSearch.SmartSearchEditorUI._viewer.model.setNodesFaceColor([hcSmartSearch.SmartSearchEditorUI._viewer.model.getRootNode()],Communicator.Color.white())\'>Set to White</li>';              
        html += '</ul>';
        return html;
    }

    static _toggleLighting() {
        SmartSearchEditorUI._viewer.view.setLightingEnabled(!SmartSearchEditorUI._viewer.view.getLightingEnabled());
    }

    static async display() {
        
        await SmartSearchEditorUI._manager.initialize();

        let html = "";
        html += '<div class = "SmartSearchMain" id="' + SmartSearchEditorUI._maindiv + '_main">';
        if (SmartSearchEditorUI._showFirstRow) {
            html+='<div id = "SmartSearchEditorUIFirstRow">';
            if (SmartSearchEditorUI._showLimitOption) {
                html += '<div id="' + SmartSearchEditorUI._maindiv + '_firstrow" style="position:relative;height:20px;">';
                html += '<button title = "Select nodes current search is limited to" id="SmartSearchLimitSelectionButton" disabled style="position:relative;top:-1px"class="SmartSearchSearchButton" type="button" style="right:65px;top:2px;position:absolute;" onclick=\'hcSmartSearch.SmartSearchEditorUI._limitSelectionShow()\'>Limit</button><input title = "Limit search to currently selected entities" onclick=\'hcSmartSearch.SmartSearchEditorUI._limitSelection()\' style="position:relative;left:-2px;top:2px;" type = "checkbox" id="' + SmartSearchEditorUI._maindiv + '_searchfromselection">'
                html += '</div>';
            }
            else {
                html += '<div style="position:relative;height:20px;"></div>';

            }

            html += SmartSearchEditorUI._generateDropdown();
            html += '<button class="SmartSearchSearchButtonImportant" type="button" style="right:5px;top:3px;position:absolute;" onclick=\'hcSmartSearch.SmartSearchEditorUI.search()\'>Search</button>';
            html += '<hr class="SmartSearchEditorUIDivider">';
            html += '</div>';
        }

        html += '<div id="' + SmartSearchEditorUI._maindiv + '_conditions" class="SmartSearchSearchtoolsConditions">';
        html += await SmartSearchEditorUI._generateConditions();
        html += '</div>';
        
        if (!SmartSearchEditorUI._searchResultsCallback) {
            html += '<hr>';
            html += '<div id="' + SmartSearchEditorUI._maindiv + '_resultscontainer"</div>';
        }
        html += '</div>';
        $("#" + SmartSearchEditorUI._maindiv).empty();
        $("#" + SmartSearchEditorUI._maindiv).append(html);

        if (!SmartSearchEditorUI._searchResultsCallback) {

            SmartSearchResultsUI.display();
        }

        if (SmartSearchEditorUI._showFirstRow) {
            const SmartSearchDropdowButton = document.querySelector('.SmartSearchDropdow-button');
            const SmartSearchDropdowContent = document.querySelector('.SmartSearchDropdow-content');

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

        SmartSearchEditorUI._generateSearchResults();
        SmartSearchEditorUI._addFilterFromUI(false,0);

    }

    static getFilter() {
        return SmartSearchEditorUI._mainFilter;
    }

    static adjust() 
    {

        if (SmartSearchEditorUI._searchResultsCallback) {
            return;
        }
        SmartSearchResultsUI.adjust();

    }

    static flush() {
        $("#" + SmartSearchEditorUI._maindiv).empty();
    }


    static async search(doAction = false) {

        SmartSearchEditorUI.updateFilterFromUI();
      
        SmartSearchEditorUI.clearSearchResults();
        $("#SmartSearchEditorUIFirstRow").css("opacity", 0.5);
        $("#SmartSearchEditorUIFirstRow").css("pointer-events", "none");
        if (!SmartSearchEditorUI._searchResultsCallback) {
            $("#" + SmartSearchResultsUI._maindiv + "_found").append("Searching...");
        }
        let nodeids = await SmartSearchEditorUI._mainFilter.apply();
        $("#SmartSearchEditorUIFirstRow").css("opacity", "");
        $("#SmartSearchEditorUIFirstRow").css("pointer-events", "");



        let startnode = SmartSearchEditorUI._mainFilter.getStartNode();
        SmartSearchEditorUI._founditems = new hcSmartSearch.SmartSearchResult(this._manager, SmartSearchEditorUI._mainFilter);
        SmartSearchEditorUI._founditems.generateItems(nodeids, startnode, SmartSearchEditorUI._chainSkip);

        SmartSearchEditorUI._generateSearchResults();
        if (doAction) {
            SmartSearchEditorUI._mainFilter.performAction(nodeids);
        }
    }


    static _getSmartSearchFromTempId(id) {

        if (id == 0) {
            return SmartSearchEditorUI._mainFilter;
        }

        for (let i=0;i<SmartSearchEditorUI._mainFilter.getNumConditions();i++)
        {
            let condition = SmartSearchEditorUI._mainFilter.getCondition(i);
            if (condition.childFilter && condition.childFilter.tempId == id)
            {
                return condition.childFilter;
            }
        }

    }

    static async _updateSearch() {
        if (SmartSearchEditorUI._founditems || SmartSearchEditorUI._mainFilter.getNumConditions()) {
            await SmartSearchEditorUI.search();
        }
    }

    static resetModel() {                                    
        this._viewer.model.reset();
        this._viewer.model.unsetNodesFaceColor([this._viewer.model.getAbsoluteRootNode()]);
        this._viewer.selectionManager.clear();
    }

    static getFoundItems() {
        return SmartSearchEditorUI._founditems;
    }

    static selectAll() {        
                     
        if (!SmartSearchEditorUI.ctrlPressed) {
            SmartSearchEditorUI._viewer.selectionManager.clear();
        }
        this._founditems.selectAll();
        SmartSearchEditorUI._generateSearchResults();
    }

    static updateFilterFromUI(SmartSearchIn) {
        let SmartSearch;
        if (!SmartSearchIn)
        {
            SmartSearch = SmartSearchEditorUI._mainFilter;                 
        }
        else
        {
            SmartSearch = SmartSearchIn;
        }

        for (let i = 0; i < SmartSearch.getNumConditions(); i++) {
            let condition = SmartSearch.getCondition(i);
            if (condition.childFilter) {
                this.updateFilterFromUI(condition.childFilter);
            }
            else {
                condition.conditionType = hcSmartSearch.SmartSearchCondition.convertStringConditionToEnum($("#" + SmartSearchEditorUI._maindiv + "_propertyChoiceSelect" + i + "-" + SmartSearch.tempId)[0].value);
                condition.propertyType = hcSmartSearch.SmartSearchCondition.convertStringPropertyTypeToEnum($("#" + SmartSearchEditorUI._maindiv + "_propertyTypeSelect" + i + "-" + SmartSearch.tempId)[0].value);

                let relSet = false;
                if (condition.propertyType == hcSmartSearch.SmartSearchPropertyType.relationship) {
                    relSet = true;
                    condition.relationship = hcSmartSearch.SmartSearchCondition.convertStringToRelationshipType($("#" + SmartSearchEditorUI._maindiv + "_propertyTypeSelect" + i + "-" + SmartSearch.tempId)[0].value);
                    condition.propertyType = hcSmartSearch.SmartSearchPropertyType.nodeName;
                    condition.propertyName = "Node Name";
                }
                if ($("#" + SmartSearchEditorUI._maindiv + "_modeltreesearchtext" + i + "-" + SmartSearch.tempId)[0] != undefined) {
                    if (!condition.propertyType == hcSmartSearch.SmartSearchPropertyType.SmartSearch) {
                        condition.text = SmartSearchEditorUI._htmlEncode($("#" + SmartSearchEditorUI._maindiv + "_modeltreesearchtext" + i + "-" + SmartSearch.tempId)[0].value);
                    }
                    else {
                        condition.text = $("#" + SmartSearchEditorUI._maindiv + "_modeltreesearchtext" + i + "-" + SmartSearch.tempId)[0].value;

                    }
                }
                if (!relSet) {
                    condition.propertyName = $("#" + SmartSearchEditorUI._maindiv + "_propertyTypeSelect" + i + "-" + SmartSearch.tempId)[0].value;                
                }
                if (SmartSearchEditorUI._showPropertyStats && condition.propertyName.endsWith(")")) {
                    let lastindex = condition.propertyName.lastIndexOf("(") - 1;
                    condition.propertyName = condition.propertyName.substring(0, lastindex);
                }
            }
            if (i == 1) {
                condition.and = ($("#" + SmartSearchEditorUI._maindiv + "_andOrchoiceSelect" + i + "-" + SmartSearch.tempId)[0].value == "and") ? true : false;
            }
            else if (i > 1) {
                condition.and = ($("#" + SmartSearchEditorUI._maindiv + "_andOrchoiceSelect" + 1 + "-" + SmartSearch.tempId)[0].value == "and") ? true : false;
            }    
        }
    }

    static async refreshUI() {     
        $("#" + SmartSearchEditorUI._maindiv + "_conditions").empty();
        $("#" + SmartSearchEditorUI._maindiv + "_conditions").append(await SmartSearchEditorUI._generateConditions());
        SmartSearchEditorUI.adjust();

    }
    
    static async _andorchangedFromUI() {
        SmartSearchEditorUI.updateFilterFromUI();
        await SmartSearchEditorUI.refreshUI();
    }


    static async _convertToChildfilter() {
        let SmartSearch = SmartSearchEditorUI._mainFilter; 
        let newfilter = new hcSmartSearch.SmartSearch(SmartSearchEditorUI._manager, SmartSearchEditorUI._mainFilter.getStartNode());

        for (let i = 0; i < SmartSearch.getNumConditions(); i++) {

            let condition = SmartSearch.getCondition(i);
            if (!condition.childFilter) {
                newfilter.addCondition(condition);
                SmartSearch.removeCondition(i);
                i--;
            }
        }

        if (newfilter.getNumConditions()) {
            let condition = new hcSmartSearch.SmartSearchCondition();
            condition.propertyName = "Node Name";
            condition.setChildFilter(newfilter);

            SmartSearch.addCondition(condition);

            await SmartSearchEditorUI.refreshUI();
        }
            
    }
    static async _addFilterFromUI(createChildFilter, id) {
        let SmartSearch;
        SmartSearchEditorUI.clearSearchResults();
        SmartSearchEditorUI.updateFilterFromUI();

        SmartSearch = SmartSearchEditorUI._getSmartSearchFromTempId(id);
        let childFilter = null;
        if (createChildFilter) {
            childFilter = new hcSmartSearch.SmartSearch(SmartSearchEditorUI._manager, SmartSearchEditorUI._mainFilter.getStartNode());
            childFilter.addCondition(new hcSmartSearch.SmartSearchCondition());
        }
            
        if (SmartSearch.getNumConditions() <= 1) {
            let condition = new hcSmartSearch.SmartSearchCondition();
            condition.propertyName = "Node Name";
            condition.setChildFilter(childFilter);

            SmartSearch.addCondition(condition);
        }
        else
        {
            let previousCondition = SmartSearch.getCondition(SmartSearch.getNumConditions() - 1);
            let condition = new hcSmartSearch.SmartSearchCondition();
            condition.propertyName = "Node Name";
            condition.setChildFilter(childFilter);
            condition.setAndOr(previousCondition.getAndOr());
            SmartSearch.addCondition(condition);
        }

        await SmartSearchEditorUI.refreshUI();
    }


    static _deleteFilter(i,id) {
        SmartSearchEditorUI.clearSearchResults();
        SmartSearchEditorUI.updateFilterFromUI();
        let SmartSearch = SmartSearchEditorUI._getSmartSearchFromTempId(id);
        SmartSearch.removeCondition(i);

        SmartSearchEditorUI.refreshUI();

    }

    static _setSearchChildren(el) {
        
        SmartSearchEditorUI._manager.setKeepSearchingChildren(!SmartSearchEditorUI._manager.getKeepSearchingChildren());
        let text = "Search Children";
        if (SmartSearchEditorUI._manager.getKeepSearchingChildren()) {
            text = '<span style="left:-5px;position:absolute;">&#x2714</span>' + text;
        }
        $(el).html(text);
    }

    static _setSearchVisible(el) {
        
        SmartSearchEditorUI._manager.setSearchVisible(!SmartSearchEditorUI._manager.getSearchVisible());
        let text = "Search Visible";
        if (SmartSearchEditorUI._manager.getSearchVisible()) {
            text = '<span style="left:-5px;position:absolute;">&#x2714</span>' + text;
        }
        $(el).html(text);
    }


    static _limitSelectionShow() {
      
        let nodeids = SmartSearchEditorUI._mainFilter.getLimitSelectionList();
        SmartSearchEditorUI._founditems = new hcSmartSearch.SmartSearchResult(this._manager, SmartSearchEditorUI._mainFilter);
        SmartSearchEditorUI._founditems.generateItems(nodeids,SmartSearchEditorUI._viewer.model.getRootNode(),0);

        SmartSearchEditorUI.selectAll();        
    }


    static _limitSelection() {
      
        if ($("#" + SmartSearchEditorUI._maindiv + "_searchfromselection")[0].checked) {
            let limitselectionlist = [];
            let r = SmartSearchEditorUI._viewer.selectionManager.getResults();
            for (let i = 0; i < r.length; i++) {
                limitselectionlist.push(r[i].getNodeId());
            }
            SmartSearchEditorUI._mainFilter.limitToNodes(limitselectionlist);
            $( "#SmartSearchLimitSelectionButton" ).prop( "disabled", false );
        }
        else
        {
            SmartSearchEditorUI._mainFilter.limitToNodes([]);
            $( "#SmartSearchLimitSelectionButton" ).prop( "disabled", true );
        }
    }

    static clearSearchResults() {
        SmartSearchEditorUI._founditems = undefined; 
        SmartSearchEditorUI._generateSearchResults();
    }

    static _generateSearchResults() {
        if (SmartSearchEditorUI._searchResultsCallback) {
            SmartSearchEditorUI._searchResultsCallback(SmartSearchEditorUI._founditems);
        }
        else {
            SmartSearchResultsUI.generateSearchResults(SmartSearchEditorUI._founditems);           
        }
    }


    static _generateAndOrChoiceSelect(condition, filterpos, SmartSearch) {
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
            html += '<select class="SmartSearchSearchSelect" onchange=\'hcSmartSearch.SmartSearchEditorUI._andorchangedFromUI()\' id="' +  
            SmartSearchEditorUI._maindiv + '_andOrchoiceSelect' + filterpos + "-" + SmartSearch.tempId + '" value="">\n';

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

    static _generateChoiceSelect(condition, filterpos,SmartSearch) {

        let html = '<select onchange=\'hcSmartSearch.SmartSearchEditorUI._andorchangedFromUI()\' class="SmartSearchAndOrSelect" id="' +  
            SmartSearchEditorUI._maindiv + '_propertyChoiceSelect' + filterpos + "-" + SmartSearch.tempId + '" value="">\n';

        let choices;
        
        if (condition.propertyName == "SmartSearch") {
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
            if (choices[i] == hcSmartSearch.SmartSearchCondition.convertEnumConditionToString(condition.conditionType)) {
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
        if ($("#" + SmartSearchEditorUI._maindiv + "_modeltreesearchtext" + filterpos + "-" + filterid)[0])
        {
            $("#" + SmartSearchEditorUI._maindiv + "_modeltreesearchtext" + filterpos + "-" + filterid)[0].value = "";
        }
    }

    static _generatePropertyTypeSelect(condition, filterpos, SmartSearch) {
      

        let html = '<select onchange=\'hcSmartSearch.SmartSearchEditorUI._clearInputField(' + filterpos + "," + SmartSearch.tempId + ');hcSmartSearch.SmartSearchEditorUI._andorchangedFromUI();\' class="SmartSearchPropertyTypeSelect" id="' +  
            SmartSearchEditorUI._maindiv + '_propertyTypeSelect' + filterpos + "-" + SmartSearch.tempId + '" value="">\n';       

        let sortedStrings = SmartSearchEditorUI._manager.getAllProperties(SmartSearchEditorUI._hideIFCProperties);

        if (SmartSearchEditorUI._showPropertyStats) {
            for (let i = 0; i < sortedStrings.length; i++) {
                if (SmartSearchEditorUI._showPropertyStats) { }
                let numOptions = SmartSearchEditorUI._manager.getNumOptions(sortedStrings[i]);
                if (numOptions) {
                    let numOptionsUsed = SmartSearchEditorUI._manager.getNumOptionsUsed(sortedStrings[i]);
                    sortedStrings[i] = sortedStrings[i] + " (" + numOptions + "/" + numOptionsUsed + ")";
                }
            }
        }

        let prefix = "";

        let propertyNamePlus = condition.propertyName;

        if (SmartSearchEditorUI._showPropertyStats) {
            let numOptions = SmartSearchEditorUI._manager.getNumOptions(propertyNamePlus);
            if (numOptions) {
                let numOptionsUsed = SmartSearchEditorUI._manager.getNumOptionsUsed(propertyNamePlus);
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
        let r = hcSmartSearch.SmartSearchEditorUI._viewer.selectionManager.getResults();
        for (let i = 0; i < r.length; i++) {
            nodeids.push(r[i].getNodeId());
        }

        if (nodeids.length > 0) {
            let lbounds = await hcSmartSearch.SmartSearchEditorUI._viewer.model.getNodesBounding(nodeids);
            let text = ("bounds:" + lbounds.min.x + " " + lbounds.min.y + " " + lbounds.min.z + " " + lbounds.max.x + " " + lbounds.max.y + " " + lbounds.max.z);
            $(el).next().html('<option value="' + text + '"></option>')
        }
        else {
            $(el).next().html('<option value=""></option>')
        }
        
    }

    static async _updateColorDatalist(el) {

        if (hcSmartSearch.SmartSearchEditorUI._viewer.selectionManager.getLast()) {
            let nodeid = hcSmartSearch.SmartSearchEditorUI._viewer.selectionManager.getLast().getNodeId();
            let children = hcSmartSearch.SmartSearchEditorUI._viewer.model.getNodeChildren(nodeid);
            if (children.length > 0)
                nodeid = children[0];
            let colors = await hcSmartSearch.SmartSearchEditorUI._viewer.model.getNodesEffectiveFaceColor([nodeid]);
            $(el).next().html('<option value="' + colors[0].r + " " + colors[0].g + " " + colors[0].b + '"></option>');
        }
        else {
            $(el).next().html('<option value=""></option>')
        }        
    }

    static async _generateInput(condition,filterpos,SmartSearch) {
      

        let html = "";
        if (condition.propertyName == "Bounding") {            
            html = '<input type="search" onfocus="hcSmartSearch.SmartSearchEditorUI._updateBoundingDatalist(this)" class = "valueinput" list="datalist' + filterpos + "-" + SmartSearch.tempId +'" id="' + SmartSearchEditorUI._maindiv + 
            '_modeltreesearchtext' + filterpos + "-" + SmartSearch.tempId + '" value="' + condition.text + '">\n';
        }
        else if (condition.propertyName == "Node Color") {
                html = '<input type="search" onfocus="hcSmartSearch.SmartSearchEditorUI._updateColorDatalist(this)" class = "valueinput" list="datalist' + filterpos + "-" + SmartSearch.tempId +'" id="' + SmartSearchEditorUI._maindiv + 
                '_modeltreesearchtext' + filterpos + "-" + SmartSearch.tempId + '" value="' + condition.text + '">\n';    
        }
        else {
            html = '<input type="search" class = "valueinput" list="datalist' + filterpos + "-" + SmartSearch.tempId +'" id="' + SmartSearchEditorUI._maindiv + 
            '_modeltreesearchtext' + filterpos + "-" + SmartSearch.tempId + '" value="' + condition.text + '">\n';

        }
        html += '<datalist id="datalist' + filterpos + "-" + SmartSearch.tempId +'">\n';
        let sortedStrings = [];
        if (condition.propertyName == "Node Type") {
            for (const property in Communicator.NodeType) {
                if (isNaN(parseFloat(Communicator.NodeType[property])))
                    sortedStrings.push(Communicator.NodeType[property]);
            }

        }      
        else if (condition.propertyName == "SmartSearch") {
            let SmartSearchs = SmartSearchEditorUI._manager.getSmartSearchs();
            for (let i=0;i<SmartSearchs.length;i++) {
                sortedStrings.push(SmartSearchs[i].getName());
            }
        }        
        else {
            let options = SmartSearchEditorUI._manager.getAllOptionsForProperty(condition.propertyName);
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
    static async _generateConditions(SmartSearchIn,index) {                
        let html = "";
        let SmartSearch;
        let tempId;
        if (!SmartSearchIn)
        {
            SmartSearchEditorUI.tempId = 0;
            SmartSearch = SmartSearchEditorUI._mainFilter;                 
        }
        else
        {
            SmartSearch = SmartSearchIn;
        }

        SmartSearch.tempId = SmartSearchEditorUI.tempId;

        if (SmartSearchIn)
        {
                html += '<div class = "SmartSearchChildCondition" style = "position:relative;left:65px;top:-10px">';
            
        }
        for (let i = 0; i < SmartSearch.getNumConditions(); i++) {
            let condition = SmartSearch.getCondition(i);
            if (condition.childFilter) {
                SmartSearchEditorUI.tempId++;
                html += '<div>';
                html += '<div style="position:relative;width:10px; height:10px;float:left;top:10px;left:-1px" onclick=\'hcSmartSearch.SmartSearchEditorUI._deleteFilter(' + i + "," + SmartSearch.tempId + ')\'>';
                html += SmartSearchEditorUI._generateTrashBin();
                html += '</div>';
                html += SmartSearchEditorUI._generateAndOrChoiceSelect(condition, i, SmartSearch);
                html+= await this._generateConditions(condition.childFilter,i);
                html += '</div>';
            }
            else {
                if (condition.relationship) {
                    html += '<div class="SmartSearchRelationshipTag" style="left:64px;position:relative">Relationship:' + hcSmartSearch.SmartSearchCondition.convertEnumRelationshipTypeToString(condition.relationship) + '</div>';
                }

                html += '<div style="height:30px;margin-top:-3px">';
                html += '<div style="position:relative;width:10px; height:10px;float:left;top:10px;left:-1px" onclick=\'hcSmartSearch.SmartSearchEditorUI._deleteFilter(' + i + "," + SmartSearch.tempId + ')\'>';
                html += SmartSearchEditorUI._generateTrashBin();
                html += '</div>';                
                html += SmartSearchEditorUI._generateAndOrChoiceSelect(condition, i, SmartSearch);
                let offset = 66;
                if (SmartSearchIn) {
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
                html += SmartSearchEditorUI._generatePropertyTypeSelect(condition, i, SmartSearch);
                html += SmartSearchEditorUI._generateChoiceSelect(condition, i, SmartSearch);
                if (hcSmartSearch.SmartSearchCondition.convertEnumConditionToString(condition.conditionType) != "exists" && hcSmartSearch.SmartSearchCondition.convertEnumConditionToString(condition.conditionType) != "!exists") {
                    html += await SmartSearchEditorUI._generateInput(condition, i, SmartSearch);
                }
                else {
                    html += '<div style="position:relative;left:5px;top:0px;width:275px"></div>';
                }
                html += '</div>';
                html += '</div>';
            }        
        }
        html += '<button title = "Add new condition" class="SmartSearchSearchButton" type="button" style="margin-top:2px;left:2px;bottom:2px;position:relative;" onclick=\'hcSmartSearch.SmartSearchEditorUI._addFilterFromUI(false,' +  SmartSearch.tempId + ')\'>Add condition</button>';
        if (!SmartSearchIn)
        {
            html += '<button title="Add new condition group: hold down Shift to convert existing conditions to group" class="SmartSearchSearchButton" type="button" style="left:4px;bottom:2px;position:relative;" onclick=\'!hcSmartSearch.SmartSearchEditorUI.shiftPressed ? hcSmartSearch.SmartSearchEditorUI._addFilterFromUI(true,' +  SmartSearch.tempId + ') : hcSmartSearch.SmartSearchEditorUI._convertToChildfilter(true,' +  SmartSearch.tempId + ')\'>Add condition group</button>';
        }
        else
        {           
            html += '</div>';    
        }       
        return html;
    }

}
