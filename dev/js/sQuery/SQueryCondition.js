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
    nodeChildren:9
};

export {SQueryPropertyType};

export class SQueryCondition {


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
            case "SQuery":
                 return SQueryPropertyType.SQuery;
            case "Node Parent":
                 return SQueryPropertyType.nodeParent;
            case "Node Children":
                return SQueryPropertyType.nodeChildren;        
            default:
                return SQueryPropertyType.property;
        }
    }

    constructor() {
        this.and = true;
        this.conditionType = SQueryConditionType.contains;
        this.propertyType = SQueryPropertyType.nodeName;
        this.propertyName = "";
        this.text =  "";
        this.childFilter = null;
        this.SQueryID = null;

    }

    toJSON(manager) {

        if (this.propertyType == SQueryPropertyType.SQuery &&
            !this.squeryFitlerID) {

            let f = manager.getSQueryByName(this.text);
            if (f) {
                this.SQueryID =  f.filter._id;
            }
        }

        return {
            and: this.and,
            conditionType: this.conditionType,
            propertyType: this.propertyType,
            propertyName: JSON.parse(JSON.stringify(this.propertyName)),
            text: this.text,
            childFilter: this.childFilter,
            SQueryID: this.SQueryID
        };
    }

    fromJSON(def) {
        this.and = def.and;
        this.conditionType = def.conditionType;
        this.propertyType = def.propertyType;
        this.propertyName = def.propertyName;
        this.text = def.text;
        this.childFilter = def.childFilter;
        this.SQueryID = def.SQueryID;

    }

    setSQueryID(id) {
        this.squeryFitlerID = id;
    }

    getSQueryID() {
        return this.SQueryID;
    }

    setAndOr(andor) {
        this.and = andor;
    }

    getAndOr() {
        return this.and;
    }

    setConditionType(conditionType) {
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