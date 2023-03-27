const SQueryConditionType = {
    contains:0,
    exists:1,
    notExists:2,
    greaterOrEqual:3,
    lessOrEqual:4,
    equals:5,
    unequal:6,
    greaterOrEqualDate:7,
    lessOrEqualDate:8,
    evaluate:9

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
    numChildren:8,
    ifcglobalid:9,
    bounding:10

};

export {SQueryPropertyType};


const SQueryRelationshipType = {
    none:0,
    nodeParent:1,
    nodeChildren:2,
    containedIn:3,
    spaceBoundary:4,
    aggregate:5
};

export {SQueryRelationshipType};



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
            case SQueryConditionType.evaluate:
                return "evaluate";                
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
            case "evaluate":
                return SQueryConditionType.evaluate;                
                    
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
            case "Rel:IFC ContainedIn":
            case "Rel:IFC SpaceBoundary":
            case "Rel:IFC Aggregate":
            case "Rel:Node Parent":
            case "Rel:Node Children":
            case "Rel:Node Children":
                    return SQueryPropertyType.relationship;
            case "SQuery":
                 return SQueryPropertyType.SQuery;
            case "# Children":
                return SQueryPropertyType.numChildren;        
            case "IFC GlobalId":
                 return SQueryPropertyType.ifcglobalid;                        
            case "Bounding":
                return SQueryPropertyType.bounding;                        
            default:
                return SQueryPropertyType.property;
        }
    }

    static convertStringToRelationshipType(c) {

        switch (c) {
            case "Rel:IFC ContainedIn":
                return SQueryRelationshipType.containedIn;
            case "Rel:IFC SpaceBoundary":
                return SQueryRelationshipType.spaceBoundary;
            case "Rel:IFC Aggregate":
                    return SQueryRelationshipType.aggregate;
            case "Rel:Node Parent":
                return SQueryRelationshipType.nodeParent;
            case "Rel:Node Children":
                return SQueryRelationshipType.nodeChildren;                
            default:
                return false;
        }
    }

    
    static convertEnumRelationshipTypeToString(c) {

        switch(c) {
            case SQueryRelationshipType.containedIn:
                return "IFC ContainedIn";
            case SQueryRelationshipType.spaceBoundary:
                return "IFC SpaceBoundary";
            case SQueryRelationshipType.aggregate:
                return "IFC Aggregate";
            case SQueryRelationshipType.nodeParent:
                return "Node Parent";
            case SQueryRelationshipType.nodeChildren:
                return "Node Children";
        }
    };

    constructor() {
        this.and = true;
        this.conditionType = SQueryConditionType.contains;
        this.propertyType = SQueryPropertyType.nodeName;
        this.propertyName = "";
        this.text =  "";
        this.childFilter = null;
        this.SQueryID = null;
        this.relationship = false;
    }

    toJSON(manager) {

        if (this.propertyType == SQueryPropertyType.SQuery &&
            !this.squeryFitlerID) {

            let f = manager.getSQueryByName(this.text);
            if (f) {
                this.SQueryID =  f._id;
            }
        }

        return {
            and: this.and,
            conditionType: this.conditionType,
            propertyType: this.propertyType,
            propertyName: JSON.parse(JSON.stringify(this.propertyName)),
            text: this.text,
            childFilter: this.childFilter,
            SQueryID: this.SQueryID,
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
        this.SQueryID = def.SQueryID;
        this.relationship = def.relationship != undefined ? def.relationship : false;

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