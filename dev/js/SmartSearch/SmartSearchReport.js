import { SmartSearchPropertyType } from './SmartSearchCondition.js';

export class SmartSearchReport {
    
    constructor(manager, result) {
        this._manager = manager;
        this._viewer = this._manager._viewer;
        this._result = result;
        this._orgProperties = [];
        this._tableParams = [];
    }

    getTableParams() {
        return this._tableParams;
    }

    getOrgString() {
        let orgString = "";
        for (let i=0;i<this._orgProperties.length;i++) {
            orgString += "[" + this._orgProperties[i] + "]";
        }
        return orgString;
    }


    _findPropValue(propname, searchResult) {
        if (propname == "Node Name") {
            return searchResult.name;
        }
        else if (propname == "Node Name (No :Ext)") {
            let name;
            let dindex = searchResult.name.lastIndexOf(":");
            if (dindex > -1) {
                name = searchResult.name.substring(0,dindex);
            }
            else {
                name = searchResult.name;
            }
            return name;
        }
        else if (propname == "Node Name (No -Ext)") {
            let name;
            let dindex = searchResult.name.lastIndexOf("-");
            if (dindex > -1) {
                name = searchResult.name.substring(0,dindex);
            }
            else {
                name = searchResult.name;
            }
            return name;
        }
        else if (propname == "Node Parent") {
             return this._viewer.model.getNodeName(this._viewer.model.getNodeParent(searchResult.id));
        }
        else if (propname == "Node Type") {
           return Communicator.NodeType[this._viewer.model.getNodeType(searchResult.id)];
        }
        else {
            let id = searchResult.id;
            return this._manager._propertyHash[id][propname] 
        }
    }

    _findPropValue2(propname, nodeid) {
        if (propname.indexOf("Node Name") != -1) {
            return this._viewer.model.getNodeName(nodeid);
        }
        else if (propname == "Node Parent") {
             return this._viewer.model.getNodeName(this._viewer.model.getNodeParent(searchResult.id));
        }
        else if (propname == "Node Type") {
           return Communicator.NodeType[this._viewer.model.getNodeType(nodeid)];
        }
        else {
            return this._manager._propertyHash[nodeid][propname] 
        }
    }
    

    generateTableHash() {

        let searchresults = this._result.getItems();

        this._categoryHash = [];

        for (let i = 0; i < searchresults.length; i++) {

            let propvalues = "";
            for (let j=0;j<this._orgProperties.length;j++) {
                let propname = this._orgProperties[j];
                let propvalue = this._findPropValue(propname, searchresults[i]);
                if (propvalue != undefined) {
                    propvalues += "[" + propvalue + "]";
                }
                else {
                    propvalues += "[]";
                }
            }
            if (this._categoryHash[propvalues] == undefined) {
                this._categoryHash[propvalues] = { ids: [] };
            }
            this._categoryHash[propvalues].ids.push(searchresults[i].id);
        }
    }
    _getTableParamData(propname, ids) {
        let isSame = true;
        let isNumber = true;
        let hasNumber = false;
        let lastValue = undefined;
        let sum = 0;
        for (let i=0;i<ids.length;i++) {
            let value = this._findPropValue2(propname, ids[i]);
            if (value != undefined) {
                let fValue = parseFloat(value);
                if (!isNaN(fValue)) {
                    sum += fValue;
                    hasNumber = true;
                }
                else {
                    isNumber = false;
                }
            }
            if (i>0 && lastValue != value) {
                isSame = false;
            }
            lastValue = value;
        }

        if (hasNumber && isNumber) {
            return sum;
        }
        if (isSame) {
            if (lastValue == undefined) {
                return "";
            }
            else {
                return lastValue;
            }
        }
        else {
            return "";
        }
    }


    getTableData() {
        let tdata = [];
        for (let i in this._categoryHash) {

            let data = { org: i, num: this._categoryHash[i].ids.length, color:""};
            for (let j=0;j<this._tableParams.length;j++) {
                let res = this._getTableParamData(this._tableParams[j],this._categoryHash[i].ids);
                data["tableParams" + j] = res;
            }
            tdata.push(data);
        }

        return tdata;
    }


    getTableProperty() {
        return this._tableProperty;

    }

    setTableProperty(property) {
        this._tableProperty = property;
    }

    deleteOrgProperty(propname) {
        let index = this._orgProperties.indexOf(propname);
        if (index > -1) {
            this._orgProperties.splice(index, 1);
        }        
    }

    deleteTableParams(propname) {
        let index = this._tableParams.indexOf(propname);
        if (index > -1) {
            this._tableParams.splice(index, 1);
        }        
    }

    getCategoryHash() {
        return this._categoryHash;
    }
    

     findCategoryFromSearch() {
        let query = this._result.getQuery();
        let searchresults = this._result.getItems();
        this._categoryHash = [];

        if (this._tableProperty) {
            if (this._tableProperty.slice(-2) == "/*") { 
                this._tableProperty = "Node Name";
            }

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
                    if (SmartSearchResultsUI._categoryHash[name] == undefined) {
                        SmartSearchResultsUI._categoryHash[name] = { ids: [] };
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
                    if (this._manager._propertyHash[id][propname] != undefined) {
                        if (this._categoryHash[this._manager._propertyHash[id][propname]] == undefined) {
                            this._categoryHash[this._manager._propertyHash[id][propname]] = { ids: [] };
                        }
                        this._categoryHash[this._manager._propertyHash[id][propname]].ids.push(searchresults[j].id);
                    }
                }
            }
        }
        else {

            for (let i = 0; i < query.getNumConditions(); i++) {
                let condition = query.getCondition(i);
                if (condition.propertyType == SmartSearchPropertyType.nodeName || condition.wildcardString) {
                    for (let j = 0; j < searchresults.length; j++) {
                        if (this._categoryHash[searchresults[j].name] == undefined) {
                            this._categoryHash[searchresults[j].name] = { ids: [] };
                        }
                        this._categoryHash[searchresults[j].name].ids.push(searchresults[j].id);
                    }
                    this._tableProperty = "Node Name";
                    return;
                }
                else if (condition.relationship == SmartSearchPropertyType.nodeParent) {
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
                else if (condition.propertyType == SmartSearchPropertyType.nodeType) {
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
                else if (condition.propertyType == SmartSearchPropertyType.property) {
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
                let res = SmartSearchResultsUI._manager._propertyHash[ids[i]][property];
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

        let searchresults = this._result.getItems();
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

        for (let i=0;i<propnames2.length;i++) {
            if (propnames2[i].indexOf("Materials and Finishes/") != -1) {
                propnames2.splice(i,0,"Materials and Finishes/*");
                break;
            }
        }
        for (let i=0;i<propnames2.length;i++) {
            if (propnames2[i].indexOf("Other/") != -1) {
                propnames2.splice(i,0,"Other/*");
                break;
            }
        }
        return propnames2;
    }

    getCategoryTableData(tablePropertyAMT, aggType) {

        let tdata = [];
        let autoColors = this._result.getQuery().getAutoColors();
        if (autoColors) {
            for (let i in this._categoryHash) {
                if (!autoColors[i]) {
                    autoColors[i] = this._categoryHash[i].color;
                }
            }
        }

        for (let i in this._categoryHash) {
            let color = autoColors ? autoColors[i] : null;
            let column1name = i;
            if (this.isNumberProp(this.getTableProperty())) {
                column1name = parseFloat(i);
            }
            let data = { name: column1name, num: this._categoryHash[i].ids.length, color: color ? 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',1)' : "", id: i };
            if (tablePropertyAMT != "--EMPTY--") {
                let amount = this.calculateAMT(tablePropertyAMT,this._categoryHash[i].ids, aggType);
                data.amt = amount;
            }

            tdata.push(data);
        }

        return tdata;
    }

    getExpandedTableData(nodeids,tablePropertyExpanded0,tablePropertyExpanded1) {
        let tdata = [];
        for (let i=0;i<nodeids.length;i++) {
            let name = this._viewer.model.getNodeName(nodeids[i]);
            let prop1;
            if (tablePropertyExpanded0.indexOf("Node Name") != -1 || tablePropertyExpanded0.indexOf("Node Type") != -1) {
                prop1 = Communicator.NodeType[this._viewer.model.getNodeType(nodeids[i])];
            }
            else if (tablePropertyExpanded0.indexOf("Node Parent") != -1) {
                prop1 = this._viewer.model.getNodeName(this._viewer.model.getNodeParent(nodeids[i]));
            }
            else if (this.isNumberProp(tablePropertyExpanded0)) {
                prop1 = parseFloat(this._manager._propertyHash[nodeids[i]][tablePropertyExpanded0]);
                if (isNaN(prop1)) {
                    prop1 = "Not Defined";
                }
            }
            else {
                prop1 = this._manager._propertyHash[nodeids[i]][tablePropertyExpanded0];
            }
            if (prop1 == undefined) {
                prop1 = "Not Defined";
            }
            let data = { name:name , id: nodeids[i], prop1:prop1};
            if (tablePropertyExpanded1 != "--EMPTY--") {
                if (tablePropertyExpanded1.indexOf("Node Name") != -1 || tablePropertyExpanded1.indexOf("Node Type") != -1) {
                    data.prop2 = Communicator.NodeType[this._viewer.model.getNodeType(nodeids[i])];
                }
                else if (tablePropertyExpanded1.indexOf("Node Parent") != -1) {
                    data.prop2 = this._viewer.model.getNodeName(this._viewer.model.getNodeParent(nodeids[i]));
                }
                else if (this.isNumberProp(tablePropertyExpanded1)) {
                    data.prop2 = parseFloat(this._manager._propertyHash[nodeids[i]][tablePropertyExpanded1]);
                    if (isNaN(data.prop2)) {
                        data.prop2 = "Not Defined";
                    }
                }
                else {
                    data.prop2 = this._manager._propertyHash[nodeids[i]][tablePropertyExpanded1];
                    if (data.prop2 == undefined) {
                        data.prop2 = "Not Defined";
                    }
                }                    
            }
            tdata.push(data);
        }
        return tdata;
    }


    calculateGradientData(column,tablePropertyAMT,aggType) {
        let pname = column;
        let rows = this.getCategoryTableData(tablePropertyAMT, aggType);

        let min = Number.MAX_VALUE;
        let max = -Number.MAX_VALUE;
        for (let i = 0; i < rows.length; i++) {
            let num;
            if (pname == "num") {
                num = parseInt(rows[i].num);
            }
            else if (pname == "amt") {
                num = parseFloat(rows[i].amt);
            }
            else {
                num = parseFloat(rows[i].name);
            }

            if (num < min) min = num;
            
            if (num > max) max = num;
            
        }
        let tdist = (max - min);

        for (let i = 0; i < rows.length; i++) {
            let num;
            if (pname == "num") {
                num = parseInt(rows[i].num);
            }
            else if (pname == "amt") {
                num = parseFloat(rows[i].amt);
            }
            else {
                num = parseFloat(rows[i].name);
            }

            let m = (num - min) / tdist * 256;
            this._categoryHash[rows[i].id].color = new Communicator.Color(m, m, m);
        }

        let autoColors = [];
        for (let i in this._categoryHash) {
            autoColors[i] = this._categoryHash[i].color;
        }
        this._query.setAutoColors(autoColors,this._tableProperty);
    }

    caculateExpandedColorsGradient(column,nodeids,tablePropertyExpanded0,tablePropertyExpanded1) {
        let pname = column;
    
        let rows = this.getExpandedTableData(nodeids,tablePropertyExpanded0,tablePropertyExpanded1)
        let min = Number.MAX_VALUE;
        let max = -Number.MAX_VALUE;
        for (let i = 0; i < rows.length; i++) {
            let num;
            if (pname == "prop1") {
                num = parseFloat(rows[i].prop1);
            }
            else {
                num = parseFloat(rows[i].prop2);
            }

            if (num < min) min = num;
            
            if (num > max) max = num;
            
        }

        let tdist = (max - min);

        let tdata = [];
        for (let i = 0; i < rows.length; i++) {
            let num;
             if (pname == "prop1") {
                num = parseFloat(rows[i].prop1);
            }
            else {
                num = parseFloat(rows[i].prop2);
            }

            let m = (num - min) / tdist * 256;
            tdata.push({id: rows[i].id, colorsav:m,color: 'rgba(' + m + ',' + m + ',' + m + ',1)'});
        }
        return tdata;
    }
}