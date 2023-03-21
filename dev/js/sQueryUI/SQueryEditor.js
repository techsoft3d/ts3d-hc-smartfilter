export class SQueryEditor {
    
    static _chainSkip = 0;
    static _showLimitOption = true;
    static _showFirstRow = true;
    static _showPropertyStats = true;
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
        SQueryEditor.ctrlPressed = false;

     
        $(document).on('keyup keydown', function(e){
            
            SQueryEditor.ctrlPressed = e.ctrlKey;
        } );

        SQueryEditor._maindiv = maindiv;
        SQueryEditor._manager = manager;
        SQueryEditor._viewer = manager._viewer;
        SQueryEditor._mainFilter = new hcSQuery.SQuery(SQueryEditor._manager, startnode);
        SQueryEditor._mainFilter.tempId = 0;

        new ResizeObserver(function () {
            SQueryEditor.adjust()
           
        }).observe($("#" + SQueryEditor._maindiv)[0]);

        
    }

    static setChainSkip(skip) {
        SQueryEditor._chainSkip = skip;

    }

    static showFirstRow(showFirstRow) {
        SQueryEditor._showFirstRow = showFirstRow;

    }

    static showPropertyStats(onoff) {
        SQueryEditor._showPropertyStats = onoff;
    }

    static setSearchResultsCallback(callback) {
        SQueryEditor._searchResultsCallback = callback;
    }

    static async display() {
        
        await SQueryEditor._manager.initialize();

        let html = "";
        html += '<div class = "SQueryMain" id="' + SQueryEditor._maindiv + '_main">';
        if (SQueryEditor._showFirstRow) {
            if (SQueryEditor._showLimitOption) {
                html += '<div id="' + SQueryEditor._maindiv + '_firstrow" style="position:relative;height:20px;">';
                html += '<button id="SQUeryLimitSelectionButton" disabled style="position:relative;top:-1px"class="SQuerySearchButton" type="button" style="right:65px;top:2px;position:absolute;" onclick=\'hcSQueryUI.SQueryEditor._limitSelectionShow()\'>Limit Selection</button><input onclick=\'hcSQueryUI.SQueryEditor._limitSelection()\' style="position:relative;left:-2px;top:2px;" type = "checkbox" id="' + SQueryEditor._maindiv + '_searchfromselection">'
                html += '<label style="position:relative;left:5px;">Search Children:</label><input onclick=\'hcSQueryUI.SQueryEditor._setSearchChildren()\' style="position:relative;left:2px;top:2px;" type = "checkbox" id="' + SQueryEditor._maindiv + '_searchChildren">'
                html += '</div>';
            }
            else {
                html += '<div style="position:relative;height:20px;"></div>';

            }

            html += '<button class="SQuerySearchButton" type="button" style="right:65px;top:2px;position:absolute;" onclick=\'hcSQueryUI.SQueryEditor.selectAll(this)\'>Select All</button>';
            html += '<button class="SQuerySearchButtonImportant" type="button" style="right:5px;top:2px;position:absolute;" onclick=\'hcSQueryUI.SQueryEditor.search()\'>Search</button>';
            html += '<hr class="SQueryEditorDivider">';
        }

        html += '<div id="' + SQueryEditor._maindiv + '_conditions" class="SQuerySearchtoolsConditions">';
        html += await SQueryEditor._generateConditions();
        html += '</div><hr>';
        html += '<div id="' + SQueryEditor._maindiv + '_searchitems" class="SQuerySearchItems"></div>';
        html += '<div style="position:absolute; right:20px;bottom:0px; font-size:12px;background-color:white" id="' + SQueryEditor._maindiv + '_found">Found:</div>';
        html += '</div>';
        $("#" + SQueryEditor._maindiv).empty();
        $("#" + SQueryEditor._maindiv).append(html);
        SQueryEditor._generateSearchResults();
        SQueryEditor._addFilterFromUI(false,0);

    }

    static getFilter() {
        return SQueryEditor._mainFilter;
    }

    static adjust() 
    {

        let newheight = $("#" + SQueryEditor._maindiv).height() - ($("#" + SQueryEditor._maindiv + "_searchitems").offset().top - $("#" + SQueryEditor._maindiv).parent().offset().top);
        $("#" + SQueryEditor._maindiv + "_searchitems").css({ "height": newheight + "px" });
        

        let gap  = newheight + $("#" + SQueryEditor._maindiv + "_conditions").height() + 3;
        if (SQueryEditor._showFirstRow) {
            gap += $("#" + SQueryEditor._maindiv + "_firstrow").height();
        }
        $("#" + SQueryEditor._maindiv + "_found").css({ "top": gap + "px" });


    }

    static flush() {
        $("#" + SQueryEditor._maindiv).empty();
    }


    static async search() {

        SQueryEditor.updateFilterFromUI();
      
        let nodeids = await SQueryEditor._mainFilter.apply();

        let startnode = SQueryEditor._mainFilter.getStartNode();
        SQueryEditor._founditems = [];
        for (let i=0;i<nodeids.length;i++) {
            let chaintext = SQueryEditor._mainFilter.createChainText(nodeids[i], startnode, SQueryEditor._chainSkip);
            let item = {name: SQueryEditor._viewer.model.getNodeName(nodeids[i]), id: nodeids[i], chaintext: chaintext};            
            SQueryEditor._founditems.push(item);
        }    
        SQueryEditor._generateSearchResults();
    }


    static _getSQueryFromTempId(id) {

        if (id == 0) {
            return SQueryEditor._mainFilter;
        }

        for (let i=0;i<SQueryEditor._mainFilter.getNumConditions();i++)
        {
            let condition = SQueryEditor._mainFilter.getCondition(i);
            if (condition.childFilter && condition.childFilter.tempId == id)
            {
                return condition.childFilter;
            }
        }

    }

    static isolateAll() {        
                            
        let selections = [];
        for (let i = 0; i < SQueryEditor._founditems.length; i++) {
            selections.push(parseInt(SQueryEditor._founditems[i].id));
        }
        SQueryEditor._viewer.view.isolateNodes(selections);
    }

    static selectAll() {        
                     
        if (!SQueryEditor.ctrlPressed)
            SQueryEditor._viewer.selectionManager.clear();

        let selections = [];
        for (let i = 0; i < SQueryEditor._founditems.length; i++) {
            selections.push(new Communicator.Selection.SelectionItem(parseInt(SQueryEditor._founditems[i].id)));
        }
        SQueryEditor._viewer.selectionManager.add(selections);
        SQueryEditor._generateSearchResults();
    }

    static updateFilterFromUI(SQueryIn) {
        let SQuery;
        if (!SQueryIn)
        {
            SQuery = SQueryEditor._mainFilter;                 
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
                condition.conditionType = hcSQuery.SQueryCondition.convertStringConditionToEnum($("#" + SQueryEditor._maindiv + "_propertyChoiceSelect" + i + "-" + SQuery.tempId)[0].value);
                condition.propertyType = hcSQuery.SQueryCondition.convertStringPropertyTypeToEnum(condition.propertyName);

                if ($("#" + SQueryEditor._maindiv + "_modeltreesearchtext" + i + "-" + SQuery.tempId)[0] != undefined) {
                    if (!condition.propertyType == hcSQuery.SQueryPropertyType.SQuery) {
                        condition.text = SQueryEditor._htmlEncode($("#" + SQueryEditor._maindiv + "_modeltreesearchtext" + i + "-" + SQuery.tempId)[0].value);
                    }
                    else {
                        condition.text = $("#" + SQueryEditor._maindiv + "_modeltreesearchtext" + i + "-" + SQuery.tempId)[0].value;

                    }
                }
                condition.propertyName = $("#" + SQueryEditor._maindiv + "_propertyTypeSelect" + i + "-" + SQuery.tempId)[0].value;                
                if (SQueryEditor._showPropertyStats && condition.propertyName.endsWith(")")) {
                    let lastindex = condition.propertyName.lastIndexOf("(") - 1;
                    condition.propertyName = condition.propertyName.substring(0, lastindex);
                }
            }
            if (i == 1) {
                condition.and = ($("#" + SQueryEditor._maindiv + "_andOrchoiceSelect" + i + "-" + SQuery.tempId)[0].value == "and") ? true : false;
            }
            else if (i > 1) {
                condition.and = ($("#" + SQueryEditor._maindiv + "_andOrchoiceSelect" + 1 + "-" + SQuery.tempId)[0].value == "and") ? true : false;
            }    
        }
    }

    static async refreshUI() {     
        $("#" + SQueryEditor._maindiv + "_conditions").empty();
        $("#" + SQueryEditor._maindiv + "_conditions").append(await SQueryEditor._generateConditions());
        SQueryEditor.adjust();

    }
    
    static async _andorchangedFromUI() {
        SQueryEditor.updateFilterFromUI();
        await SQueryEditor.refreshUI();
    }


    static async _convertToChildfilter() {
        let SQuery = SQueryEditor._mainFilter; 
        let newfilter = new hcSQuery.SQuery(SQueryEditor._manager, SQueryEditor._mainFilter.getStartNode());

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

            await SQueryEditor.refreshUI();
        }
            
    }
    static async _addFilterFromUI(createChildFilter, id) {
        let SQuery;
        SQueryEditor.clearSearchResults();
        SQueryEditor.updateFilterFromUI();

        SQuery = SQueryEditor._getSQueryFromTempId(id);
        let childFilter = null;
        if (createChildFilter) {
            childFilter = new hcSQuery.SQuery(SQueryEditor._manager, SQueryEditor._mainFilter.getStartNode());
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

        await SQueryEditor.refreshUI();
    }


    static _select(id) {
        if (!SQueryEditor.ctrlPressed)
            SQueryEditor._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Set);
        else
            SQueryEditor._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Toggle);
       
        SQueryEditor._generateSearchResults();
    }

    static _deleteFilter(i,id) {
        SQueryEditor.clearSearchResults();
        SQueryEditor.updateFilterFromUI();
        let SQuery = SQueryEditor._getSQueryFromTempId(id);
        SQuery.removeCondition(i);

        SQueryEditor.refreshUI();

    }

    static _setSearchChildren() {
        let searchChildren = $("#" + SQueryEditor._maindiv + "_searchChildren")[0].checked;

        SQueryEditor._mainFilter.setKeepSearchingChildren(searchChildren);

    }

    static _limitSelectionShow() {
      
        let nodeids = SQueryEditor._mainFilter.getLimitSelectionList();
        SQueryEditor._founditems = [];
        for (let i = 0; i < nodeids.length; i++) {
            let chaintext = SQueryEditor._mainFilter.createChainText(nodeids[i], SQueryEditor._viewer.model.getRootNode(), 0);
            let item = {name: SQueryEditor._viewer.model.getNodeName(nodeids[i]), id: nodeids[i], chaintext: chaintext};            
            SQueryEditor._founditems.push(item);
        }    

        SQueryEditor.selectAll();        
    }


    static _limitSelection() {
      
        if ($("#" + SQueryEditor._maindiv + "_searchfromselection")[0].checked) {
            let limitselectionlist = [];
            let r = SQueryEditor._viewer.selectionManager.getResults();
            for (let i = 0; i < r.length; i++) {
                limitselectionlist.push(r[i].getNodeId());
            }
            SQueryEditor._mainFilter.limitToNodes(limitselectionlist);
            $( "#SQUeryLimitSelectionButton" ).prop( "disabled", false );
        }
        else
        {
            SQueryEditor._mainFilter.limitToNodes([]);
            $( "#SQUeryLimitSelectionButton" ).prop( "disabled", true );
        }
    }

    static clearSearchResults() {
        SQueryEditor._founditems = undefined; 
        SQueryEditor._generateSearchResults();
    }

    static _generateSearchResults() {
        if (SQueryEditor._searchResultsCallback) {
            SQueryEditor._searchResultsCallback(SQueryEditor._founditems);
        }
        else {
            $("#" + SQueryEditor._maindiv + "_searchitems").empty();
            $("#" + SQueryEditor._maindiv + "_found").empty();
            if (SQueryEditor._founditems == undefined)
                return;

            $("#" + SQueryEditor._maindiv + "_found").append("Found:" + SQueryEditor._founditems.length);

            let html = "";
            let y = 0;
            let toggle = true;

            let more = false;
            let lend = SQueryEditor._founditems.length;
            if (SQueryEditor._founditems.length > 2000) {
                lend = 2000;
                more = true;
            }

            for (let i = 0; i < lend; i++) {
                toggle = !toggle;
                if (SQueryEditor._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(SQueryEditor._founditems[i].id))) {
                    let parent = SQueryEditor._viewer.model.getNodeParent(SQueryEditor._founditems[i].id);
                    if (SQueryEditor._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(parent))) {
                        html += '<div onclick=\'hcSQueryUI.SQueryEditor._select("' + SQueryEditor._founditems[i].id + '")\' class="SQuerySearchItemselectedIndirect">';
                    }
                    else {
                        html += '<div onclick=\'hcSQueryUI.SQueryEditor._select("' + SQueryEditor._founditems[i].id + '")\' class="SQuerySearchItemselected">';
                    }
                }
                else {
                    if (toggle)
                        html += '<div onclick=\'hcSQueryUI.SQueryEditor._select("' + SQueryEditor._founditems[i].id + '")\' class="SQuerySearchItem1">';
                    else
                        html += '<div onclick=\'hcSQueryUI.SQueryEditor._select("' + SQueryEditor._founditems[i].id + '")\' class="SQuerySearchItem2">';
                }

                html += '<div class="SQuerySearchItemText">' + SQueryEditor._htmlEncode(SQueryEditor._founditems[i].name) + '</div>';
                html += '<div class="SQuerySearchItemChainText">' + SQueryEditor._htmlEncode(SQueryEditor._founditems[i].chaintext) + '</div>';
                html += '</div>';
                y++;
            }
            if (more) {
                html += '<div style="left:3px;" >More...</div>';
            }

            $("#" + SQueryEditor._maindiv + "_searchitems").append(html);

            SQueryEditor.adjust();
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
                return '<span style="top:7px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;max-width:50px;min-width:50px">' + (condition.and ? "and":"or") + '</span>';
            }
        }
        else {

            let html = '<span style="top:7px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;max-width:50px;min-width:50px">';
            html += '<select class="SQuerySearchSelect" onchange=\'hcSQueryUI.SQueryEditor._andorchangedFromUI()\' id="' +  
            SQueryEditor._maindiv + '_andOrchoiceSelect' + filterpos + "-" + SQuery.tempId + '" value="">\n';

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

        let html = '<select onchange=\'hcSQueryUI.SQueryEditor._andorchangedFromUI()\' class="SQueryAndOrSelect" id="' +  
            SQueryEditor._maindiv + '_propertyChoiceSelect' + filterpos + "-" + SQuery.tempId + '" value="">\n';

        let choices;
        
        if (condition.propertyName == "SQuery") {
            choices =  ["=", "\u2260"];
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
        if ($("#" + SQueryEditor._maindiv + "_modeltreesearchtext" + filterpos + "-" + filterid)[0])
        {
            $("#" + SQueryEditor._maindiv + "_modeltreesearchtext" + filterpos + "-" + filterid)[0].value = "";
        }
    }

    static _generatePropertyTypeSelect(condition, filterpos, SQuery) {
      

        let html = '<select onchange=\'hcSQueryUI.SQueryEditor._clearInputField(' + filterpos + "," + SQuery.tempId + ');hcSQueryUI.SQueryEditor._andorchangedFromUI();\' class="propertyTypeSelect" id="' +  
            SQueryEditor._maindiv + '_propertyTypeSelect' + filterpos + "-" + SQuery.tempId + '" value="">\n';       

        let sortedStrings = SQueryEditor._manager.getAllProperties();

        if (SQueryEditor._showPropertyStats) {
            for (let i = 0; i < sortedStrings.length; i++) {
                if (SQueryEditor._showPropertyStats) { }
                let numOptions = SQueryEditor._manager.getNumOptions(sortedStrings[i]);
                if (numOptions) {
                    let numOptionsUsed = SQueryEditor._manager.getNumOptionsUsed(sortedStrings[i]);
                    sortedStrings[i] = sortedStrings[i] + " (" + numOptions + "," + numOptionsUsed + ")";
                }
            }
        }

        let prefix = "";

        let propertyNamePlus = condition.propertyName;

        if (SQueryEditor._showPropertyStats) {
            let numOptions = SQueryEditor._manager.getNumOptions(propertyNamePlus);
            if (numOptions) {
                let numOptionsUsed = SQueryEditor._manager.getNumOptionsUsed(propertyNamePlus);
                propertyNamePlus = propertyNamePlus + " (" + numOptions + "," + numOptionsUsed + ")";
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

    static async _generateInput(condition,filterpos,SQuery) {
      

        let html = '<input class = "valueinput" list="datalist' + filterpos + "-" + SQuery.tempId +'" id="' + SQueryEditor._maindiv + 
            '_modeltreesearchtext' + filterpos + "-" + SQuery.tempId + '" value="' + condition.text + '">\n';
        html += '<datalist id="datalist' + filterpos + "-" + SQuery.tempId +'">\n';
        let sortedStrings = [];
        if (condition.propertyName == "Node Type") {
            for (const property in Communicator.NodeType) {
                if (isNaN(parseFloat(Communicator.NodeType[property])))
                    sortedStrings.push(Communicator.NodeType[property]);
            }

        }
        else if (condition.propertyName == "Node Color") {
            if (SQueryEditor._viewer.selectionManager.getLast()) {
                let nodeid = SQueryEditor._viewer.selectionManager.getLast().getNodeId();
                let children = SQueryEditor._viewer.model.getNodeChildren(nodeid);
                if (children.length > 0)
                    nodeid = children[0];
                let colors = await SQueryEditor._viewer.model.getNodesEffectiveFaceColor([nodeid]);
                sortedStrings.push(colors[0].r + " " + colors[0].g + " " + colors[0].b);
            }
        }        
        else if (condition.propertyName == "SQuery") {
            let SQuerys = SQueryEditor._manager.getSQuerys();
            for (let i=0;i<SQuerys.length;i++) {
                sortedStrings.push(SQuerys[i].filter.getName());
            }
        }        
        else {
            let options = SQueryEditor._manager.getAllOptionsForProperty(condition.propertyName);
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
        let text = '<div class="icon-trash" style="float: left;">'
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
            SQueryEditor.tempId = 0;
            SQuery = SQueryEditor._mainFilter;                 
        }
        else
        {
            SQuery = SQueryIn;
        }

        SQuery.tempId = SQueryEditor.tempId;

        if (SQueryIn)
        {
                html += '<div class = "SQueryChildCondition" style = "position:relative;left:65px;top:-10px">';
            
        }
        for (let i = 0; i < SQuery.getNumConditions(); i++) {
            let condition = SQuery.getCondition(i);
            if (condition.childFilter) {
                SQueryEditor.tempId++;
                html += '<div>';
                html += '<div style="position:relative;width:10px; height:10px;float:left;top:10px;left:-1px" onclick=\'hcSQueryUI.SQueryEditor._deleteFilter(' + i + "," + SQuery.tempId + ')\'>';
                html += SQueryEditor._generateTrashBin();
                html += '</div>';
                html += SQueryEditor._generateAndOrChoiceSelect(condition, i, SQuery);
                html+= await this._generateConditions(condition.childFilter,i);
                html += '</div>';
            }
            else {
                html += '<div style="height:30px;margin-top:-3px">';
                html += '<div style="position:relative;width:10px; height:10px;float:left;top:10px;left:-1px" onclick=\'hcSQueryUI.SQueryEditor._deleteFilter(' + i + "," + SQuery.tempId + ')\'>';
                html += SQueryEditor._generateTrashBin();
                html += '</div>';                
                html += SQueryEditor._generateAndOrChoiceSelect(condition, i, SQuery);
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
                html += SQueryEditor._generatePropertyTypeSelect(condition, i, SQuery);
                html += SQueryEditor._generateChoiceSelect(condition, i, SQuery);
                if (hcSQuery.SQueryCondition.convertEnumConditionToString(condition.conditionType) != "exists" && hcSQuery.SQueryCondition.convertEnumConditionToString(condition.conditionType) != "!exists") {
                    html += await SQueryEditor._generateInput(condition, i, SQuery);
                }
                else {
                    html += '<div style="position:relative;left:5px;top:0px;width:275px"></div>';
                }
                html += '</div>';
                html += '</div>';
            }        
        }
        html += '<button class="SQuerySearchButton" type="button" style="margin-top:2px;left:2px;bottom:2px;position:relative;" onclick=\'hcSQueryUI.SQueryEditor._addFilterFromUI(false,' +  SQuery.tempId + ')\'>Add condition</button>';
        if (!SQueryIn)
        {
            html += '<button class="SQuerySearchButton" type="button" style="left:4px;bottom:2px;position:relative;" onclick=\'hcSQueryUI.SQueryEditor._addFilterFromUI(true,' +  SQuery.tempId + ')\'>Add condition group</button>';
            html += '<button class="SQuerySearchButton" type="button" style="left:6px;bottom:2px;position:relative;" onclick=\'hcSQueryUI.SQueryEditor._convertToChildfilter(true,' +  SQuery.tempId + ')\'>Set condition group</button>';

        }
        else
        {           
            html += '</div>';    
        }       
        return html;
    }

}
