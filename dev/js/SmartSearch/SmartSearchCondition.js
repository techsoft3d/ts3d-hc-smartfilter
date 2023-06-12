const SmartSearchOperatorType = {
    contains:0,
    exists:1,
    notExists:2,
    greaterOrEqual:3,
    lessOrEqual:4,
    equals:5,
    unequal:6,
    greaterOrEqualDate:7,
    lessOrEqualDate:8,
    evaluate:9,
    regex:10,
    notregex:11

};

export {SmartSearchOperatorType};

const SmartSearchPropertyType = {
    nodeName:0,
    nodeId:1,
    nodeChain:2,
    nodeType:3,
    nodeColor:4,
    relationship:5,
    property:6,
    SmartSearch:7,
    numChildren:8,
    ifcglobalid:9,
    bounding:10

};

export {SmartSearchPropertyType};


const SmartSearchRelationshipType = {
    none:0,
    nodeParent:1,
    nodeChildren:2,
    containedIn:3,
    spaceBoundary:4,
    aggregate:5
};

export {SmartSearchRelationshipType};



export class SmartSearchCondition {


    static convertEnumConditionToString(c) {
    
        switch (c) {
            case SmartSearchOperatorType.contains:
                return "contains";
            case SmartSearchOperatorType.exists:
                return "exists";
            case SmartSearchOperatorType.notExists:
                return "!exists";
            case SmartSearchOperatorType.greaterOrEqual:
                return ">=";
            case SmartSearchOperatorType.lessOrEqual:
                return "<=";
            case SmartSearchOperatorType.greaterOrEqualDate:
                return ">=(Date)";
            case SmartSearchOperatorType.lessOrEqualDate:
                return "<=(Date)";
            case SmartSearchOperatorType.equals:
                return "=";
            case SmartSearchOperatorType.evaluate:
                return "evaluate";                
            case SmartSearchOperatorType.unequal:
                return "\u2260";
            case SmartSearchOperatorType.regex:
                return "regex";      
            case SmartSearchOperatorType.notregex:
                return "!regex";                                  
        }
    }

    static convertStringConditionToEnum(c) {
    
        switch (c) {
            case "contains":
                return SmartSearchOperatorType.contains;
            case "exists":
                return SmartSearchOperatorType.exists;
            case "!exists":
                return SmartSearchOperatorType.notExists;
            case ">=":
                return SmartSearchOperatorType.greaterOrEqual;
            case "<=":
                return SmartSearchOperatorType.lessOrEqual;
            case "=":
                return SmartSearchOperatorType.equals;
            case "\u2260":
                return SmartSearchOperatorType.unequal;
            case ">=(Date)":
                return SmartSearchOperatorType.greaterOrEqualDate;
            case "<=(Date)":
                return SmartSearchOperatorType.lessOrEqualDate;
            case "evaluate":
                return SmartSearchOperatorType.evaluate;    
            case "regex":
                 return SmartSearchOperatorType.regex;      
             case "!regex":
                return SmartSearchOperatorType.notregex;                                                                         
        }
    }

    static convertStringPropertyTypeToEnum(c) {

        if (c.indexOf("SmartSearch") > -1) {
            return SmartSearchPropertyType.SmartSearch;
        }
        switch (c) {
            case "Node Name":
                return SmartSearchPropertyType.nodeName;
            case "Nodeid":
                return SmartSearchPropertyType.nodeId;
            case "Node Chain":
                return SmartSearchPropertyType.nodeChain;
            case "Node Type":
                return SmartSearchPropertyType.nodeType;
            case "Node Color":
                return SmartSearchPropertyType.nodeColor;
            case "Rel:IFC ContainedIn":
            case "Rel:IFC SpaceBoundary":
            case "Rel:IFC Aggregate":
            case "Rel:Node Parent":
            case "Rel:Node Children":
            case "Rel:Node Children":
                    return SmartSearchPropertyType.relationship;
            case "SmartSearch":
                 return SmartSearchPropertyType.SmartSearch;
            case "# Children":
                return SmartSearchPropertyType.numChildren;        
            case "IFC GlobalId":
                 return SmartSearchPropertyType.ifcglobalid;                        
            case "Bounding":
                return SmartSearchPropertyType.bounding;                        
            default:
                return SmartSearchPropertyType.property;
        }
    }

    static convertStringToRelationshipType(c) {

        switch (c) {
            case "Rel:IFC ContainedIn":
                return SmartSearchRelationshipType.containedIn;
            case "Rel:IFC SpaceBoundary":
                return SmartSearchRelationshipType.spaceBoundary;
            case "Rel:IFC Aggregate":
                    return SmartSearchRelationshipType.aggregate;
            case "Rel:Node Parent":
                return SmartSearchRelationshipType.nodeParent;
            case "Rel:Node Children":
                return SmartSearchRelationshipType.nodeChildren;                
            default:
                return false;
        }
    }

    
    static convertEnumRelationshipTypeToString(c) {

        switch(c) {
            case SmartSearchRelationshipType.containedIn:
                return "IFC ContainedIn";
            case SmartSearchRelationshipType.spaceBoundary:
                return "IFC SpaceBoundary";
            case SmartSearchRelationshipType.aggregate:
                return "IFC Aggregate";
            case SmartSearchRelationshipType.nodeParent:
                return "Node Parent";
            case SmartSearchRelationshipType.nodeChildren:
                return "Node Children";
        }
    };

    constructor() {
        this.and = true;
        this.conditionType = SmartSearchOperatorType.contains;
        this.propertyType = SmartSearchPropertyType.nodeName;
        this.propertyName = "";
        this.text =  "";
        this.childFilter = null;
        this.SmartSearchID = null;
        this.relationship = false;
    }

    toJSON(manager) {

        if (this.propertyType == SmartSearchPropertyType.SmartSearch &&
            !this.SmartSearchFitlerID) {

            let f = manager.getSmartSearchByName(this.text);
            if (f) {
                this.SmartSearchID =  f._id;
            }
        }

        return {
            and: this.and,
            conditionType: this.conditionType,
            propertyType: this.propertyType,
            propertyName: JSON.parse(JSON.stringify(this.propertyName)),
            text: this.text,
            childFilter: this.childFilter,
            SmartSearchID: this.SmartSearchID,
            relationship: this.relationship
        };
    }

    fromJSON(def) {
        this.and = def.and;
        this.conditionType = def.conditionType;
        this.propertyType = def.propertyType;
        this.propertyName = def.propertyName;
        this.text = def.text;
        this.childFilter = def.childFilter;
        this.SmartSearchID = def.SmartSearchID;
        this.relationship = def.relationship != undefined ? def.relationship : false;

    }


    setSmartSearchID(id) {
        this.SmartSearchFitlerID = id;
    }

    getSmartSearchID() {
        return this.SmartSearchID;
    }

    setAnd(andor) {
        this.and = andor;
    }

    getAnd() {
        return this.and;
    }

    setOperator(conditionType) {
        this.conditionType = conditionType;
    }

    getConditionType() {
        return this.conditionType;
    }

    
    setPropertyName(propertyName) {
        this.propertyName = propertyName;
    }

    getPropertyName() {
        return this.propertyName;
    }

    setPropertyType(propertyType) {
        this.propertyType = propertyType;
    }

    getPropertyType() {
        return this.propertyType;
    }

    setPropertyValue(propertyValue) {
        this.text = propertyValue;
    }

    setText(text) {
        this.text = text;
    }

    getText() {
        return this.text;
    }


    setChildFilter(childFilter) {
        this.childFilter = childFilter
    }

    
    getChildFilter() {
        return this.childFilter;
    }
}