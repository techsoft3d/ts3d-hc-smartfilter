import { SmartFilter } from './SmartFilter.js';



export class SmartFilterManager {

    static _smartFilters = [];

    static initialize(viewer) {
        SmartFilterManager._viewer = viewer;
        SmartFilterManager._smartFilters = [];
    }

    static addSmartFilter(smartFilter,isProp) {
        SmartFilterManager._smartFilters.push({filter:smartFilter, isProp:isProp});
    }

    static getSmartFilterNum() {
        return SmartFilterManager._smartFilters.length;
    }

    static getSmartFilter(pos) {
        return SmartFilterManager._smartFilters[pos].filter;                
    }

    static getIsProp(pos) {
        return SmartFilterManager._smartFilters[pos].isProp;                
    }

    static removeSmartFilter(pos) {
        return SmartFilterManager._smartFilters.splice(pos, 1);                
    }

    static updateSmartFilter(pos, smartFilter) {
        SmartFilterManager._smartFilters[pos].filter = smartFilter;
    }

    static updateSmartFilterIsProp(pos,isProp) {
        SmartFilterManager._smartFilters[pos].isProp = isProp;
    }

    static toJSON() {
        let json = [];
        for (let i = 0; i < SmartFilterManager._smartFilters.length; i++) {
            json.push({filter:SmartFilterManager._smartFilters[i].filter.toJSON(), isProp:SmartFilterManager._smartFilters[i].isProp});
        }
        return json;
    }

    static fromJSON(json) {
        SmartFilterManager._smartFilters = [];
        for (let i = 0; i < json.length; i++) {
            let sf = new SmartFilter(SmartFilterManager._viewer);
            sf.fromJSON(json[i].filter);
            SmartFilterManager.addSmartFilter(sf,json[i].isProp);
        }
        return json;
    }

    static async evaluateProperties(nodeid)
    {
        let properties = [];
        for (let i = 0; i < SmartFilterManager._smartFilters.length; i++) {
            if (SmartFilterManager._smartFilters[i].isProp) {
                let smartFilter = SmartFilterManager._smartFilters[i].filter;
                let res = await smartFilter.testOneNodeAgainstConditions(nodeid);
                if (res)
                {
                    let allPropertiesOnNode = await smartFilter.findAllPropertiesOnNode(nodeid);
                    let text = smartFilter.getName();
                    if (text == "")
                    {
                        text = smartFilter.generateString();
                    }
                    properties.push({name:text, properties:allPropertiesOnNode});
                }
            }
        }
        return properties;
    }

}