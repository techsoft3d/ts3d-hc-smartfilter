const SQueryConditionType = {
    contains:0,
    exists:1,
    notExists:2,
    greaterOrEqual:3,
    lessOrEqual:4,
    equals:5,
    unequal:6,
    greaterOrEqualDate:7,
    lessOrEqualDate:8

};

export {SQueryConditionType};

const SQueryPropertyType = {
    nodeName:0,
    nodeId:1,
    nodeChain:2,
    nodeType:3,
    nodeColor:4,
    relationship:5,
    property:6,
    SQuery:7,
    nodeParent:8,
};

import { SQueryCondition } from './SQueryCondition.js';
import { SQueryManager } from './SQueryManager.js';


export {SQueryPropertyType};

export class SQuery {

    static _propertyHash = [];
    static _allPropertiesHash = [];        

    static _containedInSpatialStructureHash = [];
    static _spaceBoundaryHash = [];
    static _modelHash = [];



    static convertEnumConditionToString(c) {
    
        switch (c) {
            case SQueryConditionType.contains:
                return "contains";
            case SQueryConditionType.exists:
                return "exists";
            case SQueryConditionType.notExists:
                return "!exists";
            case SQueryConditionType.greaterOrEqual:
                return ">=";
            case SQueryConditionType.lessOrEqual:
                return "<=";
            case SQueryConditionType.greaterOrEqualDate:
                return ">=(Date)";
            case SQueryConditionType.lessOrEqualDate:
                return "<=(Date)";
            case SQueryConditionType.equals:
                return "=";
            case SQueryConditionType.unequal:
                return "\u2260";
        }
    }

    static convertStringConditionToEnum(c) {
    
        switch (c) {
            case "contains":
                return SQueryConditionType.contains;
            case "exists":
                return SQueryConditionType.exists;
            case "!exists":
                return SQueryConditionType.notExists;
            case ">=":
                return SQueryConditionType.greaterOrEqual;
            case "<=":
                return SQueryConditionType.lessOrEqual;
            case "=":
                return SQueryConditionType.equals;
            case "\u2260":
                return SQueryConditionType.unequal;
            case ">=(Date)":
                return SQueryConditionType.greaterOrEqualDate;
            case "<=(Date)":
                return SQueryConditionType.lessOrEqualDate;
                    
        }
    }

    static convertStringPropertyTypeToEnum(c) {

        if (c.indexOf("SQuery") > -1) {
            return SQueryPropertyType.SQuery;
        }
        switch (c) {
            case "Node Name":
                return SQueryPropertyType.nodeName;
            case "Nodeid":
                return SQueryPropertyType.nodeId;
            case "Node Chain":
                return SQueryPropertyType.nodeChain;
            case "Node Type":
                return SQueryPropertyType.nodeType;
            case "Node Color":
                return SQueryPropertyType.nodeColor;
            case "Rel:ContainedIn":
            case "Rel:SpaceBoundary":
                return SQueryPropertyType.relationship;
            case "Smart Filter":
                 return SQueryPropertyType.SQuery;
            case "Node Parent":
                      return SQueryPropertyType.nodeParent;
        
            default:
                return SQueryPropertyType.property;
        }
    }

    static _getModelTreeIdsRecursive(nodeid,proms, ids, viewer) {

        proms.push(viewer.model.getNodeProperties(nodeid));
        ids.push(nodeid);
        let children = viewer.model.getNodeChildren(nodeid);
        for (let i = 0; i < children.length; i++) {
            SQuery._getModelTreeIdsRecursive(children[i],proms, ids, viewer);
        }
    }

    static addModel(id,nodeid,savedHash) {
        for (let i=0;i<SQuery._modelHash.length;i++)
        {
            if (SQuery._modelHash[i].id == id)
            {
                SQuery._modelHash[i].nodeid = nodeid;
                return;
            }
        }
        SQuery._modelHash.push({id:id, nodeid: nodeid,savedHash:savedHash, ids: null, properties:null});
    }

    static _updateHashes(viewer, ids,res,layernames)
    {
        for (let i = 0; i < res.length; i++) {
            SQuery._propertyHash[ids[i]] = res[i];
            let layerid = viewer.model.getNodeLayerId(ids[i]);
            if (layerid != null && layernames.size > 1) {
                if (SQuery._propertyHash[ids[i]] == null) {
                    SQuery._propertyHash[ids[i]] = [];
                }
                if (viewer.model.getNodeType(ids[i]) == 3) {
                    let p = viewer.model.getNodeParent(ids[i]);
                    if (SQuery._propertyHash[p] == null) {
                        SQuery._propertyHash[p] = [];
                    }
                    SQuery._propertyHash[p]["LAYER"] = layernames.get(layerid);
                }
                else {
                    SQuery._propertyHash[ids[i]]["LAYER"] = layernames.get(layerid);
                }
            }
            for (let j in res[i]) {
                SQuery._allPropertiesHash[j] = [];
            }
        }

        for (let i in SQuery._propertyHash) {
            for (let j in SQuery._propertyHash[i]) {
                SQuery._allPropertiesHash[j][SQuery._propertyHash[i][j]] = true;
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
            SQuery.gatherRelatedDataHashesRecursive(viewer, children[i], la);
        }
    }


    static exportPropertyHash(viewer) {
        let allpropsarray = [];
        let nodeproparray = [];

        let tempHash = [];

        for (let i in SQuery._allPropertiesHash) {
            let ppp = {name:i , values: Object.keys(SQuery._allPropertiesHash[i])};

            let thash1 = [];
            for (let j=0;j<ppp.values.length;j++) {
                thash1[ppp.values[j]] = j;
            }
            ppp.ehash= thash1;            
            allpropsarray.push(ppp);
            tempHash[i] = allpropsarray.length -1;
        }

        for (let i in SQuery._propertyHash) {
            let props = [];
            for (let j in SQuery._propertyHash[i]) {
                let prop = allpropsarray[tempHash[j]];
                props.push(tempHash[j], prop.ehash[SQuery._propertyHash[i][j]]);
              }
          
            nodeproparray.push({i: i, p: props});
        }

        for (let i= 0;i<allpropsarray.length;i++) {
            allpropsarray[i].ehash = undefined;
        }


         let relhash = [];
         SQuery.gatherRelatedDataHashesRecursive(viewer, viewer.model.getRootNode(), relhash);
       
        return {allprops: allpropsarray, nodeprops: nodeproparray};
    }

    static _consolidateBodies(viewer) {
        let lbs = [];
        for (let i in  SQuery._propertyHash) {
            if (viewer.model.getNodeType(parseInt(i)) == 3 && SQuery._propertyHash[i]["Volume"]) {
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
                if (SQuery._propertyHash[c] && SQuery._propertyHash[c]["Volume"]) {
                    tv += parseFloat(SQuery._propertyHash[c]["Volume"]);
                }   
                if (SQuery._propertyHash[c] && SQuery._propertyHash[c]["Surface Area"]) {
                    sa += parseFloat(SQuery._propertyHash[c]["Surface Area"]);
                }                          
            }
            tv = tv + "mm³";
            sa = sa + "mm²";
            SQuery._propertyHash[i]["Volume"] = tv;
            SQuery._propertyHash[i]["Surface Area"] = sa;

            let nodename = viewer.model.getNodeName(parseInt(i));
            if (nodename.startsWith("Product")) {
                let parent = viewer.model.getNodeParent(parseInt(i));
                SQuery._propertyHash[parent]["Volume"] = tv;
                SQuery._propertyHash[parent]["Surface Area"] = sa;

            }            
        }
    }


    static async initialize(viewer) {
        SQuery._propertyHash = [];
        SQuery._allPropertiesHash = [];
        SQuery._containedInSpatialStructureHash = [];
        SQuery._spaceBoundaryHash = [];
        let layernames = viewer.model.getLayers();

        if (SQuery._modelHash.length == 0) {
            let proms = [];
            let ids = [];

            SQuery._getModelTreeIdsRecursive(viewer.model.getRootNode(), proms, ids, viewer);
            let res = await Promise.all(proms);
            SQuery._updateHashes(viewer, ids, res, layernames);

            SQuery._consolidateBodies(viewer);
        }
        else {
            for (let i = 0; i < SQuery._modelHash.length; i++) {
                let model = SQuery._modelHash[i];
                let ids = [];
                let res = null;
                let offset = viewer.model.getNodeIdOffset(model.nodeid);
                if (!model.ids) {
                    let proms = [];
                    if (!model.savedHash) {
                        SQuery._getModelTreeIdsRecursive(model.nodeid, proms, ids, viewer);
                        res = await Promise.all(proms);
                    }
                    else {
                        let temp = SQuery.parseSavedPropertyHash(model.savedHash);
                        res = temp.props;
                        ids = temp.ids;
                        SQuery._containedInSpatialStructureHash = temp.relatedContainedIn;
                        SQuery._spaceBoundaryHash = temp.relatedSpaceBoundary;
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
                SQuery._updateHashes(viewer, ids, res, layernames);
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
        if (SQuery._allPropertiesHash["TYPE"])
        {
            hasType = true;
        }

        for (let i in SQuery._allPropertiesHash) {
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

        return SQuery._allPropertiesHash[propertyname];
    }

    fromJSON(json) {
        this._conditions = [];
     
        for (let i=0;i<json.conditions.length;i++) {
            let condition =  new SQueryCondition();
            condition.fromJSON(json.conditions[i]);
            this._conditions.push(condition);
        }
        for (let i=0;i<this._conditions.length;i++)
        {
            if (this._conditions[i].childFilter)
            {
                let newfilter = new SQuery(this._viewer, this._conditions[i].childFilter.startnode);
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
//        console.log("SQuery: " + (t2 - t1) + "ms");
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
        for (let j = chainskip;j<chain.length; j++) {
            if (j < chain.length-1)
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
                if (conditions[i].propertyType == SQueryPropertyType.property) {
                    let conditionsOnNode = SQuery._propertyHash[id];
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
                text += this._conditions[i].propertyName + " " + SQuery.convertEnumConditionToString(this._conditions[i].conditionType) + " " + this._conditions[i].text;
            }
        }
        text = text.replace(/&quot;/g, '"');
        return text;
    }

    async _checkSpaceBoundaryFilter(id, condition) {
        let bimid = this._viewer.model.getBimIdFromNode(id);

        let elements;
        if (SQuery._spaceBoundaryHash[id])
        {
            elements = SQuery._spaceBoundaryHash[id];
        }
        else
        {
            elements = this._viewer.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.SpaceBoundary);
            SQuery._spaceBoundaryHash[id] = elements;
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
        if (SQuery._containedInSpatialStructureHash[id])
        {
            elements = SQuery._containedInSpatialStructureHash[id];
        }
        else
        {
            elements = this._viewer.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.ContainedInSpatialStructure);
            SQuery._containedInSpatialStructureHash[id] = elements;
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
        if (condition.conditionType != SQueryConditionType.contains) {
            if (condition.conditionType == SQueryConditionType.exists) {
                if (SQuery._propertyHash[id] && SQuery._propertyHash[id][condition.propertyName] != undefined)
                    return true;
                else
                    return false;
            }

            if (condition.conditionType == SQueryConditionType.notExists) {
                if (SQuery._propertyHash[id] && SQuery._propertyHash[id][condition.propertyName] == undefined)
                    return true;
                else
                    return false;
            }

            let searchAgainstNumber;
            if (condition.propertyType == SQueryPropertyType.nodeName) {
                searchAgainstNumber = parseFloat(this._viewer.model.getNodeName(id));
            }
            else if (condition.propertyType == SQueryPropertyType.nodeId) {
                searchAgainstNumber = id;
            }
            else {
                let temp;
                if (SQuery._propertyHash[id]) {
                    temp = SQuery._propertyHash[id][condition.propertyName];
                }
                if (temp == undefined) {
                    if (condition.conditionType == SQueryConditionType.unequal)
                        return true;
                    else
                        return false;
                }
                searchAgainstNumber = parseFloat(temp);
            }

            if (condition.conditionType == SQueryConditionType.greaterOrEqualDate || condition.conditionType == SQueryConditionType.lessOrEqualDate) {
                let temp;
                if (SQuery._propertyHash[id]) {
                    temp = SQuery._propertyHash[id][condition.propertyName];
                }
                if (temp == undefined) {
                   return false;
                }
                if (!isNaN(parseInt(temp))) {
                    temp = parseInt(temp);
                }
                let searchAgainstDate = new Date(temp);

                if (isNaN(searchAgainstDate.getDate())) {
                    return false;
                }
                let ctext = condition.text;
                if (!isNaN(parseInt(ctext))) {
                    ctext = parseInt(ctext);
                }
                let searchDate = new Date(ctext);
                if (condition.conditionType == SQueryConditionType.greaterOrEqualDate) {
                    if (searchAgainstDate >= searchDate)
                        return true;
                }
                else if (condition.conditionType == SQueryConditionType.lessOrEqualDate) {
                    if (searchAgainstDate <= searchDate)
                        return true;
                }
                return false;
            }
            else {

                let searchNumber = parseFloat(condition.text);
                if (isNaN(searchNumber) || isNaN(searchAgainstNumber))
                    return false;

                if (condition.conditionType == SQueryConditionType.greaterOrEqual) {
                    if (searchAgainstNumber >= searchNumber)
                        return true;
                }
                else if (condition.conditionType == SQueryConditionType.lessOrEqual) {
                    if (searchAgainstNumber <= searchNumber)
                        return true;
                }
                else if (condition.conditionType == SQueryConditionType.unequal) {
                    if (searchAgainstNumber != searchNumber)
                        return true;
                }
                else {
                    if (searchAgainstNumber == searchNumber)
                        return true;
                }
                return false;
            }
        }
        else {
            let searchTerms = condition.text.split(",");
            let searchAgainst = "";
            if (condition.propertyType == SQueryPropertyType.nodeName) {
                searchAgainst = this._viewer.model.getNodeName(id);
            }
            else if (condition.propertyType == SQueryPropertyType.relationship) {
                searchAgainst = chaintext;
            }
            else if (condition.propertyType == SQueryPropertyType.nodeChain) {
                if (chaintext) {
                    searchAgainst = chaintext;
                }
                else {
                    searchAgainst = this.createChainText(id, this._viewer.model.getRootNode(),0);

                }
            }
            else if (condition.propertyType == SQueryPropertyType.nodeParent) {
                searchAgainst = this._viewer.model.getNodeName(this._viewer.model.getNodeParent(id));                
            }
            else if (condition.propertyType == SQueryPropertyType.nodeType) {
                searchAgainst = Communicator.NodeType[this._viewer.model.getNodeType(id)];
            }
            else if (condition.propertyType == SQueryPropertyType.nodeColor) {
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

            else if (condition.propertyType == SQueryPropertyType.nodeId) {
                searchAgainst = id.toString();
            }
            else
            {   
                if (SQuery._propertyHash[id] == undefined || SQuery._propertyHash[id][condition.propertyName] == undefined) {                
                   searchAgainst = undefined;
                }
                else {
                   searchAgainst = SQuery._propertyHash[id][condition.propertyName];
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

                if (condition.propertyType == SQueryPropertyType.nodeId)
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
            if (conditions[i].propertyType == SQueryPropertyType.relationship) {
                if (conditions[i].propertyName == "Rel:SpaceBoundary") {
                    res = await this._checkSpaceBoundaryFilter(id, conditions[i]);
                }
                else if (conditions[i].propertyName == "Rel:ContainedIn") {
                    res = await this._checkContainedInFilter(id, conditions[i]);
                }
            }
            else if (conditions[i].propertyType == SQueryPropertyType.SQuery) {

                if (!conditions[i].SQuery) {
                    if (!conditions[i].SQueryID) {
                        let f=  SQueryManager.getSQueryByName(conditions[i].text);
                        conditions[i].SQueryID = f.filter._id;
                        conditions[i].SQuery = f.filter;
                    }
                    else {
                        conditions[i].SQuery = SQueryManager.getSQueryByID(conditions[i].SQueryID);
                    }
                }
                res  = await this._testNodeAgainstConditions(id,conditions[i].SQuery._conditions,chaintext);
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
