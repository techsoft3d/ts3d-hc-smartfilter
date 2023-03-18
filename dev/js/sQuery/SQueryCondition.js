import { SQueryConditionType } from './SQuery.js';
import { SQueryPropertyType } from './SQuery.js';

export class SQueryCondition {


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