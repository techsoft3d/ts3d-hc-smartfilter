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

    calculateAMT(property, ids, aggType) {
        if (aggType == "sum") {
            let amount = 0;
            for (let i = 0; i < ids.length; i++) {
                let res = this._manager._propertyHash[ids[i]][property];
                if (res != undefined) {
                    amount += parseFloat(res);
                }
            }
            return amount;
        }
        else {
            let numbers = [];
            for (let i = 0; i < ids.length; i++) {
                let res = SQueryResults._manager._propertyHash[ids[i]][property];
                if (res != undefined) {
                    numbers.push(parseFloat(res));
                }
            }

            if (numbers.length === 0) {
                return 0;
            }

            if (aggType == "avg") {

                const sum = numbers.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
                const avg = sum / numbers.length;
                return avg;
            }
            else if (aggType == "max") {
                return Math.max(...numbers);
            }
            else if (aggType == "min") {
                return Math.min(...numbers);
            }
            else if (aggType == "med") {
                numbers.sort((a, b) => a - b);
                const middle = Math.floor(numbers.length / 2);

                return numbers.length % 2 === 0
                    ? (numbers[middle - 1] + numbers[middle]) / 2
                    : numbers[middle];
            }
        }
    }

    getAMTUnit(propstring) {
        let prop = this._manager._allPropertiesHash[propstring];
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

    convertColor(color) {
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

    isNumberProp(ltextin) {
        let ltext = ltextin.toLowerCase();
        if (ltext.indexOf("version") != -1 || ltext.indexOf("globalid") != -1 || ltext.indexOf("name") != -1 || ltext.indexOf("date") != -1 || ltext.indexOf("persistentid") != -1) {
            return false;
        }

        let prop = this._manager._allPropertiesHash[ltextin];
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

     getAllProperties() {

        let searchresults = this._items;
        let propsnames = [];
        let thash = [];
        for (let i in this._manager._allPropertiesHash) {
            propsnames.push(i);
        }

        for (let j = 0; j < searchresults.length; j++) {
            let id = searchresults[j].id;
            for (let k in this._manager._propertyHash[id]) {
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
    
}