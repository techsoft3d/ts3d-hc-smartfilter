import { SQueryCondition } from './SQueryCondition.js';
import { SQueryConditionType } from './SQueryCondition.js';
import { SQueryPropertyType } from './SQueryCondition.js';

export class SQuery {
    constructor(manager, startnode) {
        this._manager = manager;
        this._viewer = this._manager._viewer;
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
        if (this._conditions.length == 1 && this._conditions[0].childFilter) {
            let cf = this._conditions[0].childFilter;
            this._conditions.splice(0, 1);
            for (let i=0;i<cf._conditions.length;i++) {                
                this._conditions.unshift(cf._conditions[i]);
            }
        }
        else {
            this._conditions.splice(conditionpos, 1);
        }
    }

   

    getAllOptionsForProperty(propertyname) {

        return this._manager._allPropertiesHash[propertyname];
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
                let newfilter = new SQuery(this._manager, this._conditions[i].childFilter.startnode);
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
            let fjson =this._conditions[i].toJSON(this._manager);

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
                if (conditions[i].propertyType == SQueryPropertyType.property) {
                    let conditionsOnNode = this._manager._propertyHash[id];
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
                text += this._conditions[i].propertyName + " " + SQueryCondition.convertEnumConditionToString(this._conditions[i].conditionType) + " " + this._conditions[i].text;
            }
        }
        text = text.replace(/&quot;/g, '"');
        return text;
    }

    async _checkSpaceBoundaryCondition(id, condition) {
        let bimid = this._viewer.model.getBimIdFromNode(id);

        let elements;
        if (this._manager._spaceBoundaryHash[id])
        {
            elements = this._manager._spaceBoundaryHash[id];
        }
        else
        {
            elements = this._viewer.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.SpaceBoundary);
            this._manager._spaceBoundaryHash[id] = elements;
        }

        if (elements.length > 0) {
            let offset = this._viewer.model.getNodeIdOffset(id);
            let nameaggregate = "";
            for (let i = 0; i < elements.length; i++) {
                nameaggregate += this._viewer.model.getNodeName(parseInt(elements[i]) + offset);
            }
            let res = await this._checkCondition(parseInt(elements[i]) + offset, condition, nameaggregate);
            if (res)
                return true;
        }
        return false;

    }

    async _checkContainedInCondition(id, condition) {
        let bimid = this._viewer.model.getBimIdFromNode(id);

        let elements;
        if (this._manager._containedInSpatialStructureHash[id])
        {
            elements = this._manager._containedInSpatialStructureHash[id];
        }
        else
        {
            elements = this._viewer.model.getBimIdRelatingElements(id, bimid, Communicator.RelationshipType.ContainedInSpatialStructure);
            this._manager._containedInSpatialStructureHash[id] = elements;
        }

        if (elements.length > 0) {
            let offset = this._viewer.model.getNodeIdOffset(id);
            let nameaggregate = "";
            for (let i = 0; i < elements.length; i++) {
                nameaggregate += this._viewer.model.getNodeName(parseInt(elements[i]) + offset);
            }
            let res = await this._checkCondition(parseInt(elements[i]) + offset, condition, nameaggregate);
            if (res)
                return true;
        }
        return false;
    }

    async _checkCondition(id, condition, chaintext) {
        if (condition.conditionType != SQueryConditionType.contains) {
            if (condition.conditionType == SQueryConditionType.exists) {
                if (this._manager._propertyHash[id] && this._manager._propertyHash[id][condition.propertyName] != undefined)
                    return true;
                else
                    return false;
            }

            if (condition.conditionType == SQueryConditionType.notExists) {
                if (this._manager._propertyHash[id] && this._manager._propertyHash[id][condition.propertyName] == undefined)
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
            else if (condition.propertyType == SQueryPropertyType.nodeChildren) {
                searchAgainstNumber = this._viewer.model.getNodeChildren(id).length;
            }
            else {
                let temp;
                if (this._manager._propertyHash[id]) {
                    temp = this._manager._propertyHash[id][condition.propertyName];
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
                if (this._manager._propertyHash[id]) {
                    temp = this._manager._propertyHash[id][condition.propertyName];
                }
                if (temp == undefined) {
                   return false;
                }

                if (temp.indexOf(" ") == -1 && !isNaN(parseInt(temp))) {
                    temp = parseInt(temp);
                }
                let searchAgainstDate = new Date(temp);

                if (isNaN(searchAgainstDate.getDate())) {
                    return false;
                }
                let ctext = condition.text;
                if (ctext.indexOf(" ") == -1 && !isNaN(parseInt(ctext))) {
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
            else if (condition.propertyType == SQueryPropertyType.nodeChildren) {
                let children = this._viewer.model.getNodeChildren(id);
                for (let i = 0; i < children.length; i++) {
                    searchAgainst += this._viewer.model.getNodeName(children[i]);
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
                if (this._manager._propertyHash[id] == undefined || this._manager._propertyHash[id][condition.propertyName] == undefined) {                
                   searchAgainst = undefined;
                }
                else {
                   searchAgainst = this._manager._propertyHash[id][condition.propertyName];
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
                    res = await this._checkSpaceBoundaryCondition(id, conditions[i]);
                }
                else if (conditions[i].propertyName == "Rel:ContainedIn") {
                    res = await this._checkContainedInCondition(id, conditions[i]);
                }
            }
            else if (conditions[i].propertyType == SQueryPropertyType.SQuery) {

                if (!conditions[i].SQuery) {
                    if (!conditions[i].SQueryID) {
                        let f=  this._manager.getSQueryByName(conditions[i].text);
                        conditions[i].SQueryID = f.filter._id;
                        conditions[i].SQuery = f.filter;
                    }
                    else {
                        conditions[i].SQuery = this._manager.getSQueryByID(conditions[i].SQueryID);
                    }
                }
                res  = await this._testNodeAgainstConditions(id,conditions[i].SQuery._conditions,chaintext);
                if (conditions[i].conditionType ==  SQueryConditionType.unequal) {
                    res = !res;
                }
            }
            else {
                if (conditions[i].childFilter)
                {
                    res  = await this._testNodeAgainstConditions(id,conditions[i].childFilter._conditions,chaintext);
                }    
                else
                {
                    res = await this._checkCondition(id, conditions[i], chaintext);
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
