import { SQueryPropertyType } from './SQueryCondition.js';

export class SQueryResult {
    
    static createChainText(viewer, id, startid, chainskip) {
        let current = id;
        let chain = [];
        while (1) {
            let newone = viewer.model.getNodeParent(current);
            if (newone == null || newone == startid)
                break;
            chain.push(viewer.model.getNodeName(newone));
            current = newone;
        }
        let chaintext = "";
        for (let j = chain.length - 1 - chainskip; j >= 0; j--) {
            if (j > 0)
                chaintext += chain[j] + "->";
            else
                chaintext += chain[j];
        }
        return chaintext;
    }
    
    constructor(manager, query) {
        this._manager = manager;
        this._viewer = this._manager._viewer;
        this._query = query;
    }

    getTableProperty() {
        return this._tableProperty;

    }

    setTableProperty(property) {
        this._tableProperty = property;
    }

    getCategoryHash() {
        return this._categoryHash;
    }
    
    generateItems(nodeids, startnode, chainSkip) {
        this._items = [];
        for (let i=0;i<nodeids.length;i++) {
            let chaintext = SQueryResult.createChainText(this._viewer, nodeids[i], startnode, chainSkip);
            let item = {name: this._viewer.model.getNodeName(nodeids[i]), id: nodeids[i], chaintext: chaintext};            
            this._items.push(item);
        }  
    }
    
    getItems() {
        return this._items;
    }

    makeVisible(onoff) {        
                            
        let selections = this._itemsToSelections();
     
        this._viewer.model.setNodesVisibility(selections, onoff);
    }

    async setOpacity(opacity) {        
                   
        let selections = this._itemsToSelections();

        this._viewer.model.setNodesOpacity(selections, opacity);
    }
    async colorize(color) {        
                   
        let selections = this._itemsToSelections();
        await this._viewer.model.setNodesFaceColor(selections, color);
    }

    isolateAll() {        
                            
        let selections = this._itemsToSelections();
        this._viewer.view.isolateNodes(selections);
    }

    selectAll() {        
                     
        let selections = [];
        for (let i = 0; i < this._items.length; i++) {
            selections.push(new Communicator.Selection.SelectionItem(parseInt(this._items[i].id)));
        }

        this._viewer.selectionManager.add(selections);
       
    }

    _itemsToSelections() {
        let selections = [];
        for (let i = 0; i < this._items.length; i++) {
            selections.push(parseInt(this._items[i].id));
        }
        return selections;
    }


     findCategoryFromSearch() {

        let query = this._query;
        let searchresults = this.getItems();
        this._categoryHash = [];

        if (this._tableProperty) {
            if (this._tableProperty == "Node Name") {
                for (let j = 0; j < searchresults.length; j++) {
                    if (this._categoryHash[searchresults[j].name] == undefined) {
                        this._categoryHash[searchresults[j].name] = { ids: [] };
                    }
                    this._categoryHash[searchresults[j].name].ids.push(searchresults[j].id);
                }
            }
            else if (this._tableProperty == "Node Name (No :Ext)") {
                for (let j = 0; j < searchresults.length; j++) {
                    let name;
                    let dindex = searchresults[j].name.lastIndexOf(":");
                    if (dindex > -1) {
                        name = searchresults[j].name.substring(0,dindex);
                    }
                    else {
                        name = searchresults[j].name;
                    }
                    if (this._categoryHash[name] == undefined) {
                        this._categoryHash[name] = { ids: [] };
                    }
                    this._categoryHash[name].ids.push(searchresults[j].id);
                }
            }
            else if (this._tableProperty == "Node Name (No -Ext)") {
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
                    this._categoryHash[name].ids.push(searchresults[j].id);
                }
            }
            else if (this._tableProperty == "Node Parent") {
                for (let j = 0; j < searchresults.length; j++) {
                    let nodename = this._viewer.model.getNodeName(this._viewer.model.getNodeParent(searchresults[j].id));
                    if (this._categoryHash[nodename] == undefined) {
                        this._categoryHash[nodename] = { ids: [] };
                    }
                    this._categoryHash[nodename].ids.push(searchresults[j].id);
                }
            }
            else if (this._tableProperty == "Node Type") {
                for (let j = 0; j < searchresults.length; j++) {
                    let nodetype = Communicator.NodeType[this._viewer.model.getNodeType(searchresults[j].id)];
                    if (this._categoryHash[nodetype] == undefined) {
                        this._categoryHash[nodetype] = { ids: [] };
                    }
                    this._categoryHash[nodetype].ids.push(searchresults[j].id);
                }
            }
            else {
                let propname = this._tableProperty
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
                if (condition.propertyType == SQueryPropertyType.nodeName) {
                    for (let j = 0; j < searchresults.length; j++) {
                        if (this._categoryHash[searchresults[j].name] == undefined) {
                            this._categoryHash[searchresults[j].name] = { ids: [] };
                        }
                        this._categoryHash[searchresults[j].name].ids.push(searchresults[j].id);
                    }
                    this._tableProperty = "Node Name";
                    return;
                }
                else if (condition.relationship == SQueryPropertyType.nodeParent) {
                    for (let j = 0; j < searchresults.length; j++) {
                        let nodename = this._viewer.model.getNodeName(this._viewer.model.getNodeParent(searchresults[j].id));
                        if (this._categoryHash[nodename] == undefined) {
                            this._categoryHash[nodename] = { ids: [] };
                        }
                        this._categoryHash[nodename].ids.push(searchresults[j].id);
                    }
                    this._tableProperty = "Node Parent";
                    return;
                }
                else if (condition.propertyType == SQueryPropertyType.nodeType) {
                    for (let j = 0; j < searchresults.length; j++) {
                        let nodetype = Communicator.NodeType[this._viewer.model.getNodeType(searchresults[j].id)];
                        if (this._categoryHash[nodetype] == undefined) {
                            this._categoryHash[nodetype] = { ids: [] };
                        }
                        this._categoryHash[nodetype].ids.push(searchresults[j].id);
                    }
                    this._tableProperty = "Node Type";
                    return;
                }
                else if (condition.propertyType == SQueryPropertyType.property) {
                    let propname = condition.propertyName;
                    for (let j = 0; j < searchresults.length; j++) {
                        let id = searchresults[j].id;
                        if (this._manager._propertyHash[id][condition.propertyName] != undefined) {
                            if (this._categoryHash[this._manager._propertyHash[id][condition.propertyName]] == undefined) {
                                this._categoryHash[this._manager._propertyHash[id][condition.propertyName]] = { ids: [] };
                            }
                            this._categoryHash[this._manager._propertyHash[id][condition.propertyName]].ids.push(searchresults[j].id);
                        }
                    }
                    this._tableProperty = propname;
                    return;
                }
            }
            this._tableProperty = "Node Name";
            this.findCategoryFromSearch();
        }
    }
}