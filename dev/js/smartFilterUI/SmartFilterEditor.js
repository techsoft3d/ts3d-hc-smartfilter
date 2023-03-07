export class SmartFilterEditor {
    
    static _chainSkip = 0;
    static _showLimitOption = true;
    static _showFirstRow = true;

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

    static initialize(maindiv, viewer, startnode) {
        SmartFilterEditor.ctrlPressed = false;

     
        $(document).on('keyup keydown', function(e){
            
            SmartFilterEditor.ctrlPressed = e.ctrlKey;
        } );

        SmartFilterEditor._maindiv = maindiv;
        SmartFilterEditor._viewer = viewer;
        SmartFilterEditor._mainFilter = new hcSmartFilter.SmartFilter(viewer, startnode);
        SmartFilterEditor._mainFilter.tempId = 0;
        
    }

    static setChainSkip(skip) {
        SmartFilterEditor._chainSkip = skip;

    }

    static showFirstRow(showFirstRow) {
        SmartFilterEditor._showFirstRow = showFirstRow;

    }

    
    static async display() {
        await hcSmartFilter.SmartFilter.initialize(SmartFilterEditor._viewer);
        let html = "";
        html += '<div class = "smartFilterMain" id="' + SmartFilterEditor._maindiv + '_main">';
        if (SmartFilterEditor._showFirstRow) {
            if (SmartFilterEditor._showLimitOption) {
                html += '<div style="position:relative;height:20px;"><label style="position:relative;">Limit to Selection:</label><input onclick=\'hcSmartFilterUI.SmartFilterEditor._limitSelection()\' style="position:relative;left:2px;top:2px;" type = "checkbox" id="' + SmartFilterEditor._maindiv + '_searchfromselection"></div>';
            }
            else {
                html += '<div style="position:relative;height:20px;"></div>';

            }

            html += '<button class="smartFilterSearchButton" type="button" style="right:65px;top:2px;position:absolute;" onclick=\'hcSmartFilterUI.SmartFilterEditor.selectAll(this)\'>Select All</button>';
            html += '<button class="smartFilterSearchButton" type="button" style="right:5px;top:2px;position:absolute;" onclick=\'hcSmartFilterUI.SmartFilterEditor.search()\'>Search</button>';
        }
        html += '<hr style="margin-bottom:0px;margin-top:3px" >';
        html += '<div id="' + SmartFilterEditor._maindiv + '_conditions">';
        html += await SmartFilterEditor._generateConditions();
        html += '</div><hr>';
        html += '<div id="' + SmartFilterEditor._maindiv + '_searchitems" class="smartFilterSearchItems"></div>';
        html += '<div style="position:absolute; right:20px;bottom:0px; font-size:12px;background-color:white" id="' + SmartFilterEditor._maindiv + '_found">Found:</div>';
        html += '</div>';
        $("#" + SmartFilterEditor._maindiv).empty();
        $("#" + SmartFilterEditor._maindiv).append(html);
        SmartFilterEditor._generateSearchResults();
        SmartFilterEditor._addFilterFromUI(false,0);

    }

    static getFilter() {
        return SmartFilterEditor._mainFilter;
    }

    static adjust() 
    {

        let newheight = $("#" + SmartFilterEditor._maindiv).parent().height() - ($("#" + SmartFilterEditor._maindiv + "_searchitems").offset().top - $("#" + SmartFilterEditor._maindiv).parent().offset().top);
        $("#" + SmartFilterEditor._maindiv + "_searchitems").css({ "height": newheight + "px" });
        
        let gap  = $("#" + SmartFilterEditor._maindiv).offset().top - $("#" + SmartFilterEditor._maindiv).parent().offset().top;
        $("#" + SmartFilterEditor._maindiv + "_found").css({ "bottom": gap + "px" });


    }

    static flush() {
        $("#" + SmartFilterEditor._maindiv).empty();
    }


    static async search() {

        SmartFilterEditor.updateFilterFromUI();
      
        let nodeids = await SmartFilterEditor._mainFilter.apply();

        let startnode = SmartFilterEditor._mainFilter.getStartNode();
        SmartFilterEditor._founditems = [];
        for (let i=0;i<nodeids.length;i++) {
            let chaintext = SmartFilterEditor._mainFilter.createChainText(nodeids[i], startnode, SmartFilterEditor._chainSkip);
            let item = {name: SmartFilterEditor._viewer.model.getNodeName(nodeids[i]), id: nodeids[i], chaintext: chaintext};            
            SmartFilterEditor._founditems.push(item);
        }    
        SmartFilterEditor._generateSearchResults();
    }


    static _getSmartFilterFromTempId(id) {

        if (id == 0) {
            return SmartFilterEditor._mainFilter;
        }

        for (let i=0;i<SmartFilterEditor._mainFilter.getNumConditions();i++)
        {
            let filter = SmartFilterEditor._mainFilter.getCondition(i);
            if (filter.childFilter && filter.childFilter.tempId == id)
            {
                return filter.childFilter;
            }
        }

    }

    static isolateAll() {        
                            
        let selections = [];
        for (let i = 0; i < SmartFilterEditor._founditems.length; i++) {
            selections.push(parseInt(SmartFilterEditor._founditems[i].id));
        }
        SmartFilterEditor._viewer.view.isolateNodes(selections);
    }

    static selectAll() {        
                     
        if (!SmartFilterEditor.ctrlPressed)
            SmartFilterEditor._viewer.selectionManager.clear();

        let selections = [];
        for (let i = 0; i < SmartFilterEditor._founditems.length; i++) {
            selections.push(new Communicator.Selection.SelectionItem(parseInt(SmartFilterEditor._founditems[i].id)));
        }
        SmartFilterEditor._viewer.selectionManager.add(selections);
        SmartFilterEditor._generateSearchResults();
    }

    static updateFilterFromUI(smartFilterIn) {
        let smartFilter;
        if (!smartFilterIn)
        {
            smartFilter = SmartFilterEditor._mainFilter;                 
        }
        else
        {
            smartFilter = smartFilterIn;
        }

        for (let i = 0; i < smartFilter.getNumConditions(); i++) {
            let filter = smartFilter.getCondition(i);
            if (filter.childFilter) {
                this.updateFilterFromUI(filter.childFilter);
            }
            else {
                filter.conditionType = hcSmartFilter.SmartFilter.convertStringConditionToEnum($("#" + SmartFilterEditor._maindiv + "_propertyChoiceSelect" + i + "-" + smartFilter.tempId)[0].value);
                filter.propertyType = hcSmartFilter.SmartFilter.convertStringPropertyTypeToEnum(filter.propertyName);

                if ($("#" + SmartFilterEditor._maindiv + "_modeltreesearchtext" + i + "-" + smartFilter.tempId)[0] != undefined) {
                    if (!filter.propertyType == hcSmartFilter.SmartFilterPropertyType.smartFilter) {
                        filter.text = SmartFilterEditor._htmlEncode($("#" + SmartFilterEditor._maindiv + "_modeltreesearchtext" + i + "-" + smartFilter.tempId)[0].value);
                    }
                    else {
                        filter.text = $("#" + SmartFilterEditor._maindiv + "_modeltreesearchtext" + i + "-" + smartFilter.tempId)[0].value;

                    }
                }
                filter.propertyName = $("#" + SmartFilterEditor._maindiv + "_propertyTypeSelect" + i + "-" + smartFilter.tempId)[0].value;

            }
            if (i == 1) {
                filter.and = ($("#" + SmartFilterEditor._maindiv + "_andOrchoiceSelect" + i + "-" + smartFilter.tempId)[0].value == "and") ? true : false;
            }
            else if (i > 1) {
                filter.and = ($("#" + SmartFilterEditor._maindiv + "_andOrchoiceSelect" + 1 + "-" + smartFilter.tempId)[0].value == "and") ? true : false;
            }    
        }
    }

    static async refreshUI() {     
        $("#" + SmartFilterEditor._maindiv + "_conditions").empty();
        $("#" + SmartFilterEditor._maindiv + "_conditions").append(await SmartFilterEditor._generateConditions());
        SmartFilterEditor.adjust();

    }
    
    static async _andorchangedFromUI() {
        SmartFilterEditor.updateFilterFromUI();
        await SmartFilterEditor.refreshUI();
    }


    static async _addFilterFromUI(createChildFilter, id) {
        let smartFilter;
        SmartFilterEditor._clearSearchResults();
        SmartFilterEditor.updateFilterFromUI();

        smartFilter = SmartFilterEditor._getSmartFilterFromTempId(id);
        let childFilter = null;
        if (createChildFilter) {
            childFilter = new hcSmartFilter.SmartFilter(SmartFilterEditor._viewer, SmartFilterEditor._mainFilter.getStartNode());
            childFilter.addCondition(new hcSmartFilter.SmartFilterCondition());
        }
            
        if (smartFilter.getNumConditions() <= 1) {
            let condition = new hcSmartFilter.SmartFilterCondition();
            condition.setChildFilter(childFilter);

            smartFilter.addCondition(condition);
        }
        else
        {
            let previousCondition = smartFilter.getCondition(smartFilter.getNumConditions() - 1);
            let condition = new hcSmartFilter.SmartFilterCondition();
            condition.setChildFilter(childFilter);
            condition.setAndOr(previousCondition.getAndOr());
            smartFilter.addCondition(condition);
        }

        await SmartFilterEditor.refreshUI();
    }


    static _select(id) {
        if (!SmartFilterEditor.ctrlPressed)
            SmartFilterEditor._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Set);
        else
            SmartFilterEditor._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Toggle);
       
        SmartFilterEditor._generateSearchResults();
    }

    static _deleteFilter(i,id) {
        SmartFilterEditor._clearSearchResults();
        SmartFilterEditor.updateFilterFromUI();
        let smartFilter = SmartFilterEditor._getSmartFilterFromTempId(id);
        smartFilter.removeCondition(i);

        SmartFilterEditor.refreshUI();

    }

    static _limitSelection() {
      
        if ($("#" + SmartFilterEditor._maindiv + "_searchfromselection")[0].checked) {
            let limitselectionlist = [];
            let r = SmartFilterEditor._viewer.selectionManager.getResults();
            for (let i = 0; i < r.length; i++) {
                limitselectionlist.push(r[i].getNodeId());
            }
            SmartFilterEditor._mainFilter.limitToNodes(limitselectionlist);
        }
        else
        {
            SmartFilterEditor._mainFilter.limitToNodes([]);
        }
    }

    static _clearSearchResults() {
        SmartFilterEditor._founditems = undefined; 
        SmartFilterEditor._generateSearchResults();
    }

    static _generateSearchResults() {
        $("#" + SmartFilterEditor._maindiv + "_searchitems").empty();
        $("#" +  SmartFilterEditor._maindiv + "_found").empty();
        if (SmartFilterEditor._founditems == undefined)
            return;

        $("#" +  SmartFilterEditor._maindiv + "_found").append("Found:" + SmartFilterEditor._founditems.length);
      
        let html = "";
        let y = 0;
        let toggle = true;    

        for (let i = 0; i < SmartFilterEditor._founditems.length; i++) {
            toggle = !toggle;
            if (SmartFilterEditor._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(SmartFilterEditor._founditems[i].id)))
                html += '<div onclick=\'hcSmartFilterUI.SmartFilterEditor._select("' + SmartFilterEditor._founditems[i].id + '")\' class="smartFilterSearchItemselected">';
            else {
                if (toggle)
                    html += '<div onclick=\'hcSmartFilterUI.SmartFilterEditor._select("' + SmartFilterEditor._founditems[i].id + '")\' class="smartFilterSearchItem1">';
                else
                    html += '<div onclick=\'hcSmartFilterUI.SmartFilterEditor._select("' + SmartFilterEditor._founditems[i].id + '")\' class="smartFilterSearchItem2">';
            }
            html += '<div class="smartFilterSearchItemText">' + SmartFilterEditor._htmlEncode(SmartFilterEditor._founditems[i].name) + '</div>';
            html += '<div class="smartFilterSearchItemChainText">' + SmartFilterEditor._htmlEncode(SmartFilterEditor._founditems[i].chaintext) + '</div>';
            html += '</div>';
            y++;
        }
        $("#" + SmartFilterEditor._maindiv + "_searchitems").append(html);

        SmartFilterEditor.adjust();
    }


    static _generateAndOrChoiceSelect(filter, filterpos, smartFilter) {
        let html = "";
        if (filterpos == 0 || filterpos > 1) {
            if (filterpos ==0) {        
                return '<span style="top:7px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;width:50px;max-width:50px;min-width:50px">Where:</span>';
            }
            else {
                return '<span style="top:7px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;max-width:50px;min-width:50px">' + (filter.and ? "and":"or") + '</span>';
            }
        }
        else {

            let html = '<span style="top:7px;left:6px;position:relative;font-size:14px; margin-top:2px;width:50px;max-width:50px;min-width:50px">';
            html += '<select class="smartFilterSearchSelect" onchange=\'hcSmartFilterUI.SmartFilterEditor._andorchangedFromUI()\' id="' +  
            SmartFilterEditor._maindiv + '_andOrchoiceSelect' + filterpos + "-" + smartFilter.tempId + '" value="">\n';

            if (filter.and) {
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

    static _generateChoiceSelect(filter, filterpos,smartFilter) {

        let html = '<select onchange=\'hcSmartFilterUI.SmartFilterEditor._andorchangedFromUI()\' class="smartFilterAndOrSelect" id="' +  
            SmartFilterEditor._maindiv + '_propertyChoiceSelect' + filterpos + "-" + smartFilter.tempId + '" value="">\n';

        let choices = ["equals", "exists","!exists", ">=", "<=", "=", "\u2260"];

        for (let i = 0; i < choices.length; i++) {
            if (choices[i] == hcSmartFilter.SmartFilter.convertEnumConditionToString(filter.conditionType)) {
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
        if ($("#" + SmartFilterEditor._maindiv + "_modeltreesearchtext" + filterpos + "-" + filterid)[0])
        {
            $("#" + SmartFilterEditor._maindiv + "_modeltreesearchtext" + filterpos + "-" + filterid)[0].value = "";
        }
    }

    static _generatePropertyTypeSelect(filter, filterpos, smartFilter) {
      

        let html = '<select onchange=\'hcSmartFilterUI.SmartFilterEditor._clearInputField(' + filterpos + "," + smartFilter.tempId + ');hcSmartFilterUI.SmartFilterEditor._andorchangedFromUI();\' class="propertyTypeSelect" id="' +  
            SmartFilterEditor._maindiv + '_propertyTypeSelect' + filterpos + "-" + smartFilter.tempId + '" value="">\n';       

        let sortedStrings = SmartFilterEditor._mainFilter.getAllProperties();
            
    

        let prefix = "";

        for (let i = 0; i < sortedStrings.length;i++) {
            if (filter.propertyName == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected>' + prefix + sortedStrings[i] + '</option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '">' + prefix + sortedStrings[i] + '</option>\n';
        }
        html += '</select>\n';
        return html;
    }

    static async _generateInput(filter,filterpos,smartFilter) {
      

        let html = '<input list="datalist' + filterpos + "-" + smartFilter.tempId +'" +  style="flex:1 1 auto; font-size:11px;min-width:100px" id="' + SmartFilterEditor._maindiv + 
            '_modeltreesearchtext' + filterpos + "-" + smartFilter.tempId + '" value="' + filter.text + '">\n';
        html += '<datalist id="datalist' + filterpos + "-" + smartFilter.tempId +'">\n';
        let sortedStrings = [];
        if (filter.propertyName == "Node Type") {
            for (const property in Communicator.NodeType) {
                if (isNaN(parseFloat(Communicator.NodeType[property])))
                    sortedStrings.push(Communicator.NodeType[property]);
            }

        }
        else if (filter.propertyName == "Node Color") {
            if (SmartFilterEditor._viewer.selectionManager.getLast()) {
                let nodeid = SmartFilterEditor._viewer.selectionManager.getLast().getNodeId();
                let children = SmartFilterEditor._viewer.model.getNodeChildren(nodeid);
                if (children.length > 0)
                    nodeid = children[0];
                let colors = await SmartFilterEditor._viewer.model.getNodesEffectiveFaceColor([nodeid]);
                sortedStrings.push(colors[0].r + " " + colors[0].g + " " + colors[0].b);
            }
        }        
        else if (filter.propertyName == "Smart Filter") {
            let smartFilters = hcSmartFilter.SmartFilterManager.getSmartFilters();
            for (let i=0;i<smartFilters.length;i++) {
                sortedStrings.push(smartFilters[i].filter.getName());
            }
        }        
        else {
            let options = SmartFilterEditor._mainFilter.getAllOptionsForProperty(filter.propertyName);
            for (let i in options) {
                sortedStrings.push(i);
            }
        }
        sortedStrings.sort();

        for (let i = 0; i < sortedStrings.length; i++) {
            if (filter.propertyName == sortedStrings[i])
                html += '<option value="' + sortedStrings[i] + '" selected></option>\n';
            else
                html += '<option value="' + sortedStrings[i] + '"></option>\n';
        }
        html += '</datalist>\n';
        return html;
    }

    static async _generateConditions(smartFilterIn,index) {                
        let html = "";
        let smartFilter;
        let tempId;
        if (!smartFilterIn)
        {
            SmartFilterEditor.tempId = 0;
            smartFilter = SmartFilterEditor._mainFilter;                 
        }
        else
        {
            smartFilter = smartFilterIn;
        }

        smartFilter.tempId = SmartFilterEditor.tempId;

        if (smartFilterIn)
        {
            if (index == 1)
            {
                html += '<div style = "position:relative;left:65px;top:-10px;background:#e6e8ea;border-radius:5px;">';
            }
            else
            {
                html += '<div style = "position:relative;left:50px;background:#e6e8ea;border-radius:5px;">';

            }
        }
        for (let i = 0; i < smartFilter.getNumConditions(); i++) {
            let filter = smartFilter.getCondition(i);
            if (filter.childFilter) {
                SmartFilterEditor.tempId++;
                html += '<div>';
                html += '<div style="position:relative;width:10px; height:10px;float:left;top:10px;left:-1px" onclick=\'hcSmartFilterUI.SmartFilterEditor._deleteFilter(' + i + "," + smartFilter.tempId + ')\'>';
                html += '<div class="cross"></div></div>';
                html += SmartFilterEditor._generateAndOrChoiceSelect(filter, i, smartFilter);
                html+= await this._generateConditions(filter.childFilter,i);
                html += '</div>';
            }
            else {
                html += '<div style="height:30px;margin-top:-3px">';
                html += '<div style="position:relative;width:10px; height:10px;float:left;top:10px;left:-1px" onclick=\'hcSmartFilterUI.SmartFilterEditor._deleteFilter(' + i + "," + smartFilter.tempId + ')\'>';
                html += '<div class="cross"></div></div>';
                html += SmartFilterEditor._generateAndOrChoiceSelect(filter, i, smartFilter);
                let offset = 66;
                if (smartFilterIn) {
                    offset*=2;
                }                
                if (i==1)
                {
                    html += '<div style="display:flex;position:relative;top:-11px;left:64px;margin-right: 1em;width:calc(100%  - ' + offset + 'px)">';
                }
                else
                {
                    html += '<div style="display:flex;position:relative;top:-10px;left:64px;margin-right: 1em;width:calc(100%  - ' + offset + 'px)">';
                }
                html += SmartFilterEditor._generatePropertyTypeSelect(filter, i, smartFilter);
                html += SmartFilterEditor._generateChoiceSelect(filter, i, smartFilter);
                if (hcSmartFilter.SmartFilter.convertEnumConditionToString(filter.conditionType) != "exists" && hcSmartFilter.SmartFilter.convertEnumConditionToString(filter.conditionType) != "!exists") {
                    html += await SmartFilterEditor._generateInput(filter, i, smartFilter);
                }
                else {
                    html += '<div style="position:relative;left:5px;top:0px;width:275px"></div>';
                }
                html += '</div>';
                html += '</div>';
            }        
        }
        html += '<button class="smartFilterSearchButton" type="button" style="margin-top:2px;left:2px;bottom:2px;position:relative;" onclick=\'hcSmartFilterUI.SmartFilterEditor._addFilterFromUI(false,' +  smartFilter.tempId + ')\'>Add Condition</button>';
        if (!smartFilterIn)
        {
            html += '<button class="smartFilterSearchButton" type="button" style="left:4px;bottom:2px;position:relative;" onclick=\'hcSmartFilterUI.SmartFilterEditor._addFilterFromUI(true,' +  smartFilter.tempId + ')\'>Add SubFilter</button>';
        }
        else
        {           
            html += '</div>';    
        }       
        return html;
    }

}
