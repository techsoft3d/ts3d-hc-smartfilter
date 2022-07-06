const SmartFilterConditionType = {
    has:0,
    exists:1,
    notExists:2,
    greaterOrEqual:3,
    lessOrEqual:4,
    equals:5,
    unequal:6,
};

export {SmartFilterConditionType};

const SmartFilterPropertyType = {
    nodeName:0,
    nodeId:1,
    nodeChain:2,
    nodeType:3,
    nodeColor:4,
    relationship:5,
    property:6
};

import { SmartFilterCondition } from './SmartFilterCondition.js';


export {SmartFilterPropertyType};

export class SmartFilter {

    static _propertyHash = [];
    static _allPropertiesHash = [];        

    static _containedInSpatialStructureHash = [];
    static _spaceBoundaryHash = [];
    static _modelHash = [];



    static convertEnumConditionToString(c) {
    
        switch (c) {
            case SmartFilterConditionType.has:
                return "has";
            case SmartFilterConditionType.exists:
                return "exists";
            case SmartFilterConditionType.notExists:
                return "!exists";
            case SmartFilterConditionType.greaterOrEqual:
                return ">=";
            case SmartFilterConditionType.lessOrEqual:
                return "<=";
            case SmartFilterConditionType.equals:
                return "=";
            case SmartFilterConditionType.unequal:
                return "\u2260";
        }
    }

    static convertStringConditionToEnum(c) {
    
        switch (c) {
            case "has":
                return SmartFilterConditionType.has;
            case "exists":
                return SmartFilterConditionType.exists;
            case "!exists":
                return SmartFilterConditionType.notExists;
            case ">=":
                return SmartFilterConditionType.greaterOrEqual;
            case "<=":
                return SmartFilterConditionType.lessOrEqual;
            case "=":
                return SmartFilterConditionType.equals;
            case "\u2260":
                return SmartFilterConditionType.unequal;
        }
    }

    static convertStringPropertyTypeToEnum(c) {

        switch (c) {
            case "Node Name":
                return SmartFilterPropertyType.nodeName;
            case "Nodeid":
                return SmartFilterPropertyType.nodeId;
            case "Node Chain":
                return SmartFilterPropertyType.nodeChain;
            case "Node Type":
                return SmartFilterPropertyType.nodeType;
            case "Node Color":
                return SmartFilterPropertyType.nodeColor;
            case "Rel:ContainedIn":
            case "Rel:SpaceBoundary":
                return SmartFilterPropertyType.relationship;
            default:
                return SmartFilterPropertyType.property;
        }
    }

    static _getModelTreeIdsRecursive(nodeid,proms, ids, viewer) {

        proms.push(viewer.model.getNodeProperties(nodeid));
        ids.push(nodeid);
        let children = viewer.model.getNodeChildren(nodeid);
        for (let i = 0; i < children.length; i++) {
            SmartFilter._getModelTreeIdsRecursive(children[i],proms, ids, viewer);
        }
    }

    static addModel(id,nodeid) {
        for (let i=0;i<SmartFilter._modelHash.length;i++)
        {
            if (SmartFilter._modelHash[i].id == id)
            {
                SmartFilter._modelHash[i].nodeid = nodeid;
                return;
            }
        }
        SmartFilter._modelHash.push({id:id, nodeid: nodeid, ids: null, properties:null});
    }

    static _updateHashes(viewer, ids,res,layernames)
    {
        for (let i = 0; i < res.length; i++) {
            SmartFilter._propertyHash[ids[i]] = res[i];
            let layerid = viewer.model.getNodeLayerId(ids[i]);
            if (layerid != null && layernames.size > 1) {
                if (SmartFilter._propertyHash[ids[i]] == null)
                    SmartFilter._propertyHash[ids[i]] = [];
                SmartFilter._propertyHash[ids[i]]["LAYER"] = layernames.get(layerid);
            }
            for (let j in res[i]) {
                SmartFilter._allPropertiesHash[j] = [];
            }
        }

        for (let i in SmartFilter._propertyHash) {
            for (let j in SmartFilter._propertyHash[i]) {
                SmartFilter._allPropertiesHash[j][SmartFilter._propertyHash[i][j]] = true;
            }
        }
    }

    static async initialize(viewer) {
        SmartFilter._propertyHash = [];
        SmartFilter._allPropertiesHash = [];
        SmartFilter._containedInSpatialStructureHash = [];
        SmartFilter._spaceBoundaryHash = [];
        let layernames = viewer.model.getLayers();

        if (SmartFilter._modelHash.length == 0) {
            let proms = [];
            let ids = [];

            SmartFilter._getModelTreeIdsRecursive(viewer.model.getRootNode(), proms, ids, viewer);
            let res = await Promise.all(proms);
            SmartFilter._updateHashes(viewer, ids, res, layernames);
        }
        else {
            for (let i = 0; i < SmartFilter._modelHash.length; i++) {
                let model = SmartFilter._modelHash[i];
                let ids = [];
                let res = null;
                let offset = viewer.model.getNodeIdOffset(model.nodeid);
                if (!model.ids) {
                    let proms = [];
                    SmartFilter._getModelTreeIdsRecursive(model.nodeid, proms, ids, viewer);
                    res = await Promise.all(proms);
                    model.properties = res;
                    model.ids = [];
                    for (let j = 0; j < ids.length; j++) {
                        model.ids.push(ids[j] - offset);
                    }
                }
                else {
                    for (let j = 0; j < model.ids.length; j++) {
                        ids.push(model.ids[j] + offset);
                    }
                    res = model.properties;

                }
                SmartFilter._updateHashes(viewer, ids, res, layernames);
            }
        }
    }

    constructor(viewer, startnode) {
        this._viewer = viewer;
        this._limitselectionlist = [];
        this._conditions = [];
        this._name = "";
            
        if (startnode)
            this._startnode = startnode;
        else
            this._startnode =  this._viewer.model.getRootNode();
    }

    setName(name) {
        this._name = name;
    }

    getName() {
        return this._name;
    }
    
    getNumConditions() {
        return this._conditions.length;
    }
    
    getCondition(conditionpos) {
        return this._conditions[conditionpos];
    }
    
    addCondition(condition)
    {
        this._conditions.push(condition);
    }

    removeCondition(conditionpos) {
        this._conditions.splice(conditionpos, 1);
    }

    getAllProperties() {

        let propsnames = [];
        let hasType = false;
        if (SmartFilter._allPropertiesHash["TYPE"])
        {
            hasType = true;
        }

        for (let i in SmartFilter._allPropertiesHash) {
            if (i != "TYPE") {
                propsnames.push(i);
            }
        }

        propsnames.sort();
        if (hasType) {
            propsnames.unshift("TYPE");
        }
        return propsnames;
    }

    getAllOptionsForProperty(propertyname) {

        return SmartFilter._allPropertiesHash[propertyname];
    }

    fromJSON(json) {
        this._conditions = [];
     
        for (let i=0;i<json.conditions.length;i++) {
            let condition =  new SmartFilterCondition();
            condition.fromJSON(json.conditions[i]);
            this._conditions.push(condition);
        }
        for (let i=0;i<this._conditions.length;i++)
        {
            if (this._conditions[i].childFilter)
            {
                let newfilter = new SmartFilter(this._viewer, this._conditions[i].childFilter.startnode);
                newfilter.fromJSON(this._conditions[i].childFilter);
                this._conditions[i].childFilter = newfilter;
            }
        }
        this._name = json.name;
    }

    toJSON() {

        let newconditions = [];
        for (let i=0;i<this._conditions.length;i++) {
            let fjson =this._conditions[i].toJSON();

            if (this._conditions[i].childFilter)
            {
                fjson.childFilter = this._conditions[i].childFilter.toJSON();
            }            
            newconditions.push(fjson);
        }
        return {conditions:newconditions, name:this._name};        
    }

    limitToNodes(nodeids) {
        this._limitselectionlist = [];
        for (let i = 0; i < nodeids.length; i++)
            this._limitselectionlist.push(nodeids[i]);

    }

    getStartNode() {
        return this._startnode;
    }

    async apply() {
        let conditions = this._conditions;
        let limitlist = this._limitselectionlist;

        for (let i = 0; i < conditions.length; i++) {
            conditions[i].text = conditions[i].text.replace(/&quot;/g, '"');
        }
        let matchingnodes = [];
        if (limitlist.length == 0)
            if (this._startnode == hwv.model.getRootNode())
                await this._gatherMatchingNodesRecursive(conditions, this._startnode, matchingnodes, this._startnode);
            else
                await this._gatherMatchingNodesRecursive(conditions, this._startnode, matchingnodes, hwv.model.getNodeParent(this._startnode));
        else
            for (let i = 0; i < limitlist.length; i++) {
                await this._gatherMatchingNodesRecursive(conditions, limitlist[i], matchingnodes, this._viewer.model.getNodeParent(limitlist[i]));
            }
        return matchingnodes;
    }

    createChainText(id, startid, chainskip) {
        let current = id;
        let chain = [];
        chain.push(this._viewer.model.getNodeName(id));
        while (1) {
            let newone = this._viewer.model.getNodeParent(current);
            if (newone == null || newone == startid)
                break;
            chain.push(this._viewer.model.getNodeName(newone));
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

    async testOneNodeAgainstConditions(id)
    {
        return await this._testNodeAgainstConditions(id,this._conditions);
    }

    async findAllPropertiesOnNode(id, conditionsIn, foundConditionsIn, alreadyDoneHashIn) {
        let conditions;
        let foundConditions;
        let alreadyDoneHash;
        if (!conditionsIn) {
            conditions = this._conditions;
            foundConditions = [];
            alreadyDoneHash = [];
        }
        else
        {
            conditions = conditionsIn;
            foundConditions = foundConditionsIn;
            alreadyDoneHash = alreadyDoneHashIn;
        }

        for (let i = 0; i < conditions.length; i++) {
            if (conditions[i].childFilter) {
                await this.findAllPropertiesOnNode(id, conditions[i].childFilter._conditions, foundConditions, alreadyDoneHash);
            }
            else {
                if (conditions[i].propertyType == SmartFilterPropertyType.property) {
                    let conditionsOnNode = SmartFilter._propertyHash[id];
                    if (conditionsOnNode[conditions[i].propertyName] && !alreadyDoneHash[conditions[i].propertyName]) {
                        alreadyDoneHash[conditions[i].propertyName] = true;
                        foundConditions.push({name: conditions[i].propertyName, value: conditionsOnNode[conditions[i].propertyName]});
                    }
                }
            }
        }
        return foundConditions;

    }

    generateString()
    {
        let text = "";
        for (let i = 0; i < this._conditions.length; i++) {
            if (i > 0) {
                text += " " + (this._conditions[i].and ? "AND" : "OR") + " ";
            }
            if (this._conditions[i].childFilter) {
                text += "(" + this._conditions[i].childFilter.generateString() + ") ";
            }
            else
            {
                text += this._conditions[i].propertyName + " " + SmartFilter.convertEnumConditionToString(this._conditions[i].conditionType) + " " + this._conditions[i].text;
            }
        }
        return text;
    }

    async _checkSpaceBoundaryFilter(id, condition) {
        let bimid = this._viewer.model.getBimIdFromNode(id);

        let elements;
        if (SmartFilter._spaceBoundaryHash[id])
        {
            elements = SmartFilter._spaceBoundaryHash[id];
        }
        else
        {
            elements = hwv.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.SpaceBoundary);
            SmartFilter._spaceBoundaryHash[id] = elements;
        }

        if (elements.length > 0) {
            let offset = this._viewer.model.getNodeIdOffset(id);
            for (let i = 0; i < elements.length; i++) {
                let res = await this._checkFilter(parseInt(elements[i]) + offset, condition);
                if (res)
                    return true;
            }
        }
        return false;

    }

    async _checkContainedInFilter(id, condition) {
        let bimid = this._viewer.model.getBimIdFromNode(id);

        let elements;
        if (SmartFilter._containedInSpatialStructureHash[id])
        {
            elements = SmartFilter._containedInSpatialStructureHash[id];
        }
        else
        {
            elements = hwv.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.ContainedInSpatialStructure);
            SmartFilter._containedInSpatialStructureHash[id] = elements;
        }

        if (elements.length > 0) {
            let offset = this._viewer.model.getNodeIdOffset(id);
            for (let i = 0; i < elements.length; i++) {
                let res = await this._checkFilter(parseInt(elements[i]) + offset, condition);
                if (res)
                    return true;
            }
        }
        return false;
    }

    async _checkFilter(id, condition) {
        if (condition.conditionType != SmartFilterConditionType.has) {
            if (condition.conditionType == SmartFilterConditionType.exists) {
                if (SmartFilter._propertyHash[id] && SmartFilter._propertyHash[id][condition.propertyName] != undefined)
                    return true;
                else
                    return false;
            }

            if (condition.conditionType == SmartFilterConditionType.notExists) {
                if (SmartFilter._propertyHash[id] && SmartFilter._propertyHash[id][condition.propertyName] == undefined)
                    return true;
                else
                    return false;
            }

            let searchAgainstNumber;
            if (condition.propertyType == SmartFilterPropertyType.nodeName) {      
                searchAgainstNumber = parseFloat(this._viewer.model.getNodeName(id));
            }
            else if (condition.propertyType == SmartFilterPropertyType.nodeId)
            {
                searchAgainstNumber = id;
            }
            else {
                let temp;
                if (SmartFilter._propertyHash[id]) 
                {
                    temp = SmartFilter._propertyHash[id][condition.propertyName];
                }
                if (temp == undefined) {
                    if (condition.conditionType == SmartFilterConditionType.unequal)
                        return true;
                    else
                        return false;
                }
                searchAgainstNumber = parseFloat(temp);
            }

            let searchNumber = parseFloat(condition.text);
            if (isNaN(searchNumber) || isNaN(searchAgainstNumber))
                return false;

            if (condition.conditionType == SmartFilterConditionType.greaterOrEqual) {
                if (searchAgainstNumber >= searchNumber)
                    return true;
            }
            else if (condition.conditionType == SmartFilterConditionType.lessOrEqual) {
                if (searchAgainstNumber <= searchNumber)
                    return true;
            }
            else if (condition.conditionType == SmartFilterConditionType.unequal) {
                if (searchAgainstNumber != searchNumber)
                    return true;
            }
            else {
                if (searchAgainstNumber == searchNumber)
                    return true;
            }
            return false;
        }
        else {
            let searchTerms = condition.text.split(",");
            let searchAgainst = "";
            if (condition.propertyType == SmartFilterPropertyType.nodeName || condition.propertyType == SmartFilterPropertyType.relationship) {
                searchAgainst = this._viewer.model.getNodeName(id);
            }
            else if (condition.propertyType == SmartFilterPropertyType.nodeChain) {
                searchAgainst = this.createChainText(id, this._viewer.model.getRootNode(),0);
            }
            else if (condition.propertyType == SmartFilterPropertyType.nodeType) {
                searchAgainst = Communicator.NodeType[this._viewer.model.getNodeType(id)];
            }
            else if (condition.propertyType == SmartFilterPropertyType.nodeColor) {
                let children = this._viewer.model.getNodeChildren(id);
                if (children.length>0)
                {
                    searchAgainst = "x";
                }
                else
                {
                    let colors = await this._viewer.model.getNodesEffectiveFaceColor([id]);      
                    if (colors.length>0)              
                        searchAgainst = colors[0].r + " " + colors[0].g + " " + colors[0].b;
                    else
                        searchAgainst = "x";

                }
            }

            else if (condition.propertyType == SmartFilterPropertyType.nodeId) {
                searchAgainst = id.toString();
            }
            else
            {   
                if (SmartFilter._propertyHash[id] == undefined || SmartFilter._propertyHash[id][condition.propertyName] == undefined) {                
                   searchAgainst = undefined;
                }
                else {
                   searchAgainst = SmartFilter._propertyHash[id][condition.propertyName];
                }
            }

            if (searchAgainst == undefined)
                searchAgainst = "";
            let foundmust = 0;
            let must = 0;
            let mustnot = 0;
            let foundmustnot = 0;
            let other = 0;

            for (let i = 0; i < searchTerms.length; i++) {
                let exactSearch;
                let term;
                if (searchTerms[i][0] == '"' || searchTerms[i][1] == '"') {
                    exactSearch = true;
                    if (searchTerms[i][0] == '"') {
                        term = searchTerms[i].substring(1, searchTerms[i].length - 1);
                    }
                    else {
                        let prefix = searchTerms[i][0];
                        term = searchTerms[i].substring(2, searchTerms[i].length - 1);
                        term = prefix + term;
                    }

                }
                else {
                    term = searchTerms[i];
                    exactSearch = false;
                }

                if (condition.propertyType == SmartFilterPropertyType.nodeId)
                {
                    exactSearch = true;
                }

                if (term == "" || (term.length == 1 && (term[0] == "+" || term[0] == "-")))
                    return;
                if (term[0] == "+") {
                    must++;
                    if (exactSearch) {
                        if (searchAgainst.toLowerCase() == term.substring(1).toLowerCase())
                            foundmust++;
                    }
                    else {
                        if (searchAgainst.toLowerCase().indexOf(term.substring(1).toLowerCase()) != -1)
                            foundmust++;
                    }
                }
                else if (term[0] == "-") {
                    mustnot++;
                    if (exactSearch) {
                        if (searchAgainst.toLowerCase() != term.substring(1).toLowerCase())
                            foundmustnot++;
                    }
                    else {
                        if (searchAgainst.toLowerCase().indexOf(term.substring(1).toLowerCase()) == -1)
                            foundmustnot++;
                    }
                }
                else {
                    if (exactSearch) {
                        if (searchAgainst.toLowerCase() == term.toLowerCase())
                            other++;
                    }
                    else {
                        if (searchAgainst.toLowerCase().indexOf(term.toLowerCase()) != -1)
                            other++;
                    }
                }

            }

            if (must == foundmust && mustnot == foundmustnot && (other > 0 || (foundmust + foundmustnot) == searchTerms.length))
                return true;
            else
                return false;
        }
    }

    async _testNodeAgainstConditions(id,conditions) {

        let foundtotal = 0;
        let isor = false;
        if (conditions.length > 1 && !conditions[1].and)
            isor = true;

        for (let i = 0; i < conditions.length; i++) {
            
            let res;
            if (conditions[i].propertyType == SmartFilterPropertyType.relationship) {
                if (conditions[i].propertyName == "Rel:SpaceBoundary") {
                    res = await this._checkSpaceBoundaryFilter(id, conditions[i]);
                }
                else if (conditions[i].propertyName == "Rel:ContainedIn") {
                    res = await this._checkContainedInFilter(id, conditions[i]);
                }
            }
            else {
                if (conditions[i].childFilter)
                {
                    res  = await this._testNodeAgainstConditions(id,conditions[i].childFilter._conditions, isor);
                }    
                else
                {
                    res = await this._checkFilter(id, conditions[i]);
                }
            }
            if (res == false) {
                if (!isor) {
                    break;
                }
            }
            else
            {
                foundtotal++;
            }
        }

        if ((!isor && foundtotal == conditions.length) || (isor && foundtotal > 0)) {
            return true;
        }
        return false;
    }
 
    async _gatherMatchingNodesRecursive(conditions, id, matchingnodes, startid) {
        if (id != startid) {        
            if (await this._testNodeAgainstConditions(id,conditions)) {
                matchingnodes.push(id);
            }           
        }
        let children = this._viewer.model.getNodeChildren(id);
        for (let i = 0; i < children.length; i++) {
            await this._gatherMatchingNodesRecursive(conditions, children[i], matchingnodes, startid);

        }
    }
}
