const SmartFilterConditionType = {
    contains:0,
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
    property:6,
    smartFilter:7,
    nodeParent:8,
};

import { SmartFilterCondition } from './SmartFilterCondition.js';
import { SmartFilterManager } from './SmartFilterManager.js';


export {SmartFilterPropertyType};

export class SmartFilter {

    static _propertyHash = [];
    static _allPropertiesHash = [];        

    static _containedInSpatialStructureHash = [];
    static _spaceBoundaryHash = [];
    static _modelHash = [];



    static convertEnumConditionToString(c) {
    
        switch (c) {
            case SmartFilterConditionType.contains:
                return "contains";
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
            case "contains":
                return SmartFilterConditionType.contains;
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

        if (c.indexOf("SmartFilter") > -1) {
            return SmartFilterPropertyType.smartFilter;
        }
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
            case "Smart Filter":
                 return SmartFilterPropertyType.smartFilter;
            case "Node Parent":
                      return SmartFilterPropertyType.nodeParent;
        
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

    static addModel(id,nodeid,savedHash) {
        for (let i=0;i<SmartFilter._modelHash.length;i++)
        {
            if (SmartFilter._modelHash[i].id == id)
            {
                SmartFilter._modelHash[i].nodeid = nodeid;
                return;
            }
        }
        SmartFilter._modelHash.push({id:id, nodeid: nodeid,savedHash:savedHash, ids: null, properties:null});
    }

    static _updateHashes(viewer, ids,res,layernames)
    {
        for (let i = 0; i < res.length; i++) {
            SmartFilter._propertyHash[ids[i]] = res[i];
            let layerid = viewer.model.getNodeLayerId(ids[i]);
            if (layerid != null && layernames.size > 1) {
                if (SmartFilter._propertyHash[ids[i]] == null) {
                    SmartFilter._propertyHash[ids[i]] = [];
                }
                if (viewer.model.getNodeType(ids[i]) == 3) {
                    let p = viewer.model.getNodeParent(ids[i]);
                    if (SmartFilter._propertyHash[p] == null) {
                        SmartFilter._propertyHash[p] = [];
                    }
                    SmartFilter._propertyHash[p]["LAYER"] = layernames.get(layerid);
                }
                else {
                    SmartFilter._propertyHash[ids[i]]["LAYER"] = layernames.get(layerid);
                }
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

    static parseSavedPropertyHash(savedPropertyHash) {

        let allprops = savedPropertyHash.allprops;
        let nodeprops = savedPropertyHash.nodeprops;
        let related = savedPropertyHash.related;

        let rprops = [];
        let ids = [];

        for (let i=0;i<nodeprops.length;i++) {
            let nprop = nodeprops[i];
            ids.push(nprop.i);
            let rprop = {};
            let pa = nprop.p;
            for (let j=0;j<pa.length;j+=2) {
                rprop[allprops[pa[j]].name] = allprops[pa[j]].values[pa[j+1]];
            }
            rprops.push(rprop);
        }
        let spaceBoundaryItems = [];
        let containedInItems = [];


        if (related) {
            for (let i=0;i<related.length;i++) {
                let item = related[i];
                if (item.e) {
                    spaceBoundaryItems[parseInt(item.i)] = item.e;
                }
                else {
                    spaceBoundaryItems[parseInt(item.i)] = [];
                }
                if (item.f) {
                    containedInItems[parseInt(item.i)] = item.f;
                }
                else {
                    containedInItems[parseInt(item.i)] = [];
                }
            }            
        }

        return {ids:ids, props:rprops, relatedSpaceBoundary:spaceBoundaryItems, relatedContainedIn:containedInItems};
    }


    static gatherRelatedDataHashesRecursive(viewer,nodeid, la) {

        let bimid = viewer.model.getBimIdFromNode(nodeid);

        let elements = viewer.model.getBimIdRelatingElements(nodeid, bimid, Communicator.RelationshipType.SpaceBoundary);

        let lao = {i:nodeid};
        let elements2 = viewer.model.getBimIdRelatingElements(nodeid, bimid, Communicator.RelationshipType.ContainedInSpatialStructure);
        if (elements && elements.length > 0) {
            lao.e = elements;
        }
        if (elements2 && elements2.length > 0) {
            lao.f = elements2;
        }
        la.push(lao);
        let children = viewer.model.getNodeChildren(nodeid);
        for (let i = 0; i < children.length; i++) {
            SmartFilter.gatherRelatedDataHashesRecursive(viewer, children[i], la);
        }
    }


    static exportPropertyHash(viewer) {
        let allpropsarray = [];
        let nodeproparray = [];

        let tempHash = [];

        for (let i in SmartFilter._allPropertiesHash) {
            let ppp = {name:i , values: Object.keys(SmartFilter._allPropertiesHash[i])};

            let thash1 = [];
            for (let j=0;j<ppp.values.length;j++) {
                thash1[ppp.values[j]] = j;
            }
            ppp.ehash= thash1;            
            allpropsarray.push(ppp);
            tempHash[i] = allpropsarray.length -1;
        }

        for (let i in SmartFilter._propertyHash) {
            let props = [];
            for (let j in SmartFilter._propertyHash[i]) {
                let prop = allpropsarray[tempHash[j]];
                props.push(tempHash[j], prop.ehash[SmartFilter._propertyHash[i][j]]);
              }
          
            nodeproparray.push({i: i, p: props});
        }

        for (let i= 0;i<allpropsarray.length;i++) {
            allpropsarray[i].ehash = undefined;
        }


         let relhash = [];
         SmartFilter.gatherRelatedDataHashesRecursive(viewer, viewer.model.getRootNode(), relhash);
       
        return {allprops: allpropsarray, nodeprops: nodeproparray};
    }

    static _consolidateBodies(viewer) {
        let lbs = [];
        for (let i in  SmartFilter._propertyHash) {
            if (viewer.model.getNodeType(parseInt(i)) == 3 && SmartFilter._propertyHash[i]["Volume"]) {
                let p = viewer.model.getNodeParent(parseInt(i));
                lbs[p] = true;
            }
        }

        for (let i in lbs) {
            let children = hwv.model.getNodeChildren(parseInt(i));
            let tv = 0;
            let sa = 0;
            for (let j = 0; j < children.length; j++) {
                let c = children[j];
                if (SmartFilter._propertyHash[c] && SmartFilter._propertyHash[c]["Volume"]) {
                    tv += parseFloat(SmartFilter._propertyHash[c]["Volume"]);
                }   
                if (SmartFilter._propertyHash[c] && SmartFilter._propertyHash[c]["Surface Area"]) {
                    sa += parseFloat(SmartFilter._propertyHash[c]["Surface Area"]);
                }                          
            }
            tv = tv + "mm³";
            sa = sa + "mm²";
            SmartFilter._propertyHash[i]["Volume"] = tv;
            SmartFilter._propertyHash[i]["Surface Area"] = sa;

            let nodename = viewer.model.getNodeName(parseInt(i));
            if (nodename.startsWith("Product")) {
                let parent = viewer.model.getNodeParent(parseInt(i));
                SmartFilter._propertyHash[parent]["Volume"] = tv;
                SmartFilter._propertyHash[parent]["Surface Area"] = sa;

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

            SmartFilter._consolidateBodies(viewer);
        }
        else {
            for (let i = 0; i < SmartFilter._modelHash.length; i++) {
                let model = SmartFilter._modelHash[i];
                let ids = [];
                let res = null;
                let offset = viewer.model.getNodeIdOffset(model.nodeid);
                if (!model.ids) {
                    let proms = [];
                    if (!model.savedHash) {
                        SmartFilter._getModelTreeIdsRecursive(model.nodeid, proms, ids, viewer);
                        res = await Promise.all(proms);
                    }
                    else {
                        let temp = SmartFilter.parseSavedPropertyHash(model.savedHash);
                        res = temp.props;
                        ids = temp.ids;
                        SmartFilter._containedInSpatialStructureHash = temp.relatedContainedIn;
                        SmartFilter._spaceBoundaryHash = temp.relatedSpaceBoundary;
                    }
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
        this._keepSearchingChildren = false;
        this._id = this._generateGUID();


            
        if (startnode)
            this._startnode = startnode;
        else
            this._startnode =  this._viewer.model.getRootNode();
    }

    setKeepSearchingChildren(keepSearchingChildren) {
        this._keepSearchingChildren = keepSearchingChildren;
    }

    getKeepSearchingChildren() {
        return this._keepSearchingChildren;
    }

    updateConditions(conditions) {
        this._conditions = conditions;
    }

    setName(name) {
        this._name = name;
        if (this._name == "") {
            this._name = this.generateString();
        }
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
        // if (this._conditions.length && this._conditions[0].childFilter) {
        //     let cf = this._conditions[0].childFilter;
        //     this._conditions.splice(0, 1);
        //     for (let i=0;i<cf._conditions.length;i++) {                
        //         this._conditions.unshift(cf._conditions[i]);
        //     }
        // }
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
    
        propsnames.unshift("Smart Filter");
        propsnames.unshift("Rel:SpaceBoundary");
        propsnames.unshift("Rel:ContainedIn");
        propsnames.unshift("Node Color");
        propsnames.unshift("Node Type");
        propsnames.unshift("Node Chain");
        propsnames.unshift("Node Parent");
        propsnames.unshift("Nodeid");
        propsnames.unshift("Node Name");


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
        if (json.keepSearchingChildren == undefined) {
            this._keepSearchingChildren = false;
        }
        else {
            this._keepSearchingChildren = json.keepSearchingChildren;
        }
        if (json.id) {
            this._id = json.id;
        }
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
        return {conditions:newconditions, name:this._name, id:this._id, keepSearchingChildren: this._keepSearchingChildren};        
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
  //      let t1 = new Date();
        let conditions = this._conditions;
        let limitlist = this._limitselectionlist;

        for (let i = 0; i < conditions.length; i++) {
            conditions[i].text = conditions[i].text.replace(/&quot;/g, '"');
        }
        let matchingnodes = [];
        if (limitlist.length == 0) {
            if (this._startnode == this._viewer.model.getRootNode())
                await this._gatherMatchingNodesRecursive(conditions, this._startnode, matchingnodes, this._startnode,"");
            else
                await this._gatherMatchingNodesRecursive(conditions, this._startnode, matchingnodes, this._viewer.model.getNodeParent(this._startnode),"");
        }
        else {
            for (let i = 0; i < limitlist.length; i++) {
                await this._gatherMatchingNodesRecursive(conditions, limitlist[i], matchingnodes, this._viewer.model.getNodeParent(limitlist[i]),"");
            }
        }
//        let t2 = new Date();
//        console.log("SmartFilter: " + (t2 - t1) + "ms");
        return matchingnodes;
    }

    createChainText(id, startid, chainskip) {
        let current = id;
        let chain = [];
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
        let conditions = this._conditions;
        for (let i = 0; i < conditions.length; i++) {
            conditions[i].text = conditions[i].text.replace(/&quot;/g, '"');
        }
        return await this._testNodeAgainstConditions(id,this._conditions,"");
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
                text += " " + (this._conditions[i].and ? "and" : "or") + " ";
            }
            if (this._conditions[i].childFilter) {
                text += "(" + this._conditions[i].childFilter.generateString() + ") ";
            }
            else
            {
                text += this._conditions[i].propertyName + " " + SmartFilter.convertEnumConditionToString(this._conditions[i].conditionType) + " " + this._conditions[i].text;
            }
        }
        text = text.replace(/&quot;/g, '"');
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
            elements = this._viewer.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.SpaceBoundary);
            SmartFilter._spaceBoundaryHash[id] = elements;
        }

        if (elements.length > 0) {
            let offset = this._viewer.model.getNodeIdOffset(id);
            let nameaggregate = "";
            for (let i = 0; i < elements.length; i++) {
                nameaggregate += this._viewer.model.getNodeName(parseInt(elements[i]) + offset);
            }
            let res = await this._checkFilter(parseInt(elements[i]) + offset, condition, nameaggregate);
            if (res)
                return true;
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
            elements = this._viewer.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.ContainedInSpatialStructure);
            SmartFilter._containedInSpatialStructureHash[id] = elements;
        }

        if (elements.length > 0) {
            let offset = this._viewer.model.getNodeIdOffset(id);
            let nameaggregate = "";
            for (let i = 0; i < elements.length; i++) {
                nameaggregate += this._viewer.model.getNodeName(parseInt(elements[i]) + offset);
            }
            let res = await this._checkFilter(parseInt(elements[i]) + offset, condition, nameaggregate);
            if (res)
                return true;
        }
        return false;
    }

    async _checkFilter(id, condition, chaintext) {
        if (condition.conditionType != SmartFilterConditionType.contains) {
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
            if (condition.propertyType == SmartFilterPropertyType.nodeName) {
                searchAgainst = this._viewer.model.getNodeName(id);
            }
            else if (condition.propertyType == SmartFilterPropertyType.relationship) {
                searchAgainst = chaintext;
            }
            else if (condition.propertyType == SmartFilterPropertyType.nodeChain) {
                if (chaintext) {
                    searchAgainst = chaintext;
                }
                else {
                    searchAgainst = this.createChainText(id, this._viewer.model.getRootNode(),0);

                }
            }
            else if (condition.propertyType == SmartFilterPropertyType.nodeParent) {
                searchAgainst = this._viewer.model.getNodeName(this._viewer.model.getNodeParent(id));                
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

    async _testNodeAgainstConditions(id,conditions,chaintext) {

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
            else if (conditions[i].propertyType == SmartFilterPropertyType.smartFilter) {

                if (!conditions[i].smartFilter) {
                    if (!conditions[i].smartFilterID) {
                        let f=  SmartFilterManager.getSmartFilterByName(conditions[i].text);
                        conditions[i].smartFilterID = f.filter._id;
                        conditions[i].smartFilter = f.filter;
                    }
                    else {
                        conditions[i].smartFilter = SmartFilterManager.getSmartFilterByID(conditions[i].smartFilterID);
                    }
                }
                res  = await this._testNodeAgainstConditions(id,conditions[i].smartFilter._conditions,chaintext);
            }
            else {
                if (conditions[i].childFilter)
                {
                    res  = await this._testNodeAgainstConditions(id,conditions[i].childFilter._conditions,chaintext);
                }    
                else
                {
                    res = await this._checkFilter(id, conditions[i], chaintext);
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
 
    async _gatherMatchingNodesRecursive(conditions, id, matchingnodes, startid, chaintext) {
        let nl = this._viewer.model.getNodeName(id);
        if (id != startid) {
            if (await this._testNodeAgainstConditions(id, conditions, chaintext)) {
                matchingnodes.push(id);
                if (!this._keepSearchingChildren) {
                    return;
                }
            }
        }
        let children = this._viewer.model.getNodeChildren(id);
        for (let i = 0; i < children.length; i++) {
            await this._gatherMatchingNodesRecursive(conditions, children[i], matchingnodes, startid, chaintext + nl);

        }
    }

    _generateGUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

}
