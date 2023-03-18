import { SQuery } from './SQuery.js';



export class SQueryManager {

    static _SQuerys = [];

    static initialize(viewer) {
        SQueryManager._viewer = viewer;
        SQueryManager._SQuerys = [];
    }

    static addSQuery(SQuery,isProp) {
        let filter = {filter:SQuery, isProp:isProp};
        SQueryManager._SQuerys.push({filter:SQuery, isProp:isProp});
    }

    static getSQuerys() {
        return SQueryManager._SQuerys;

    }

    static getSQueryByName(name) {
        for (let i=0;i<SQueryManager._SQuerys.length;i++) {
            if (SQueryManager._SQuerys[i].filter.getName() == name)
                return SQueryManager._SQuerys[i];
        }
    }

    static getSQueryByID(id) {
        for (let i=0;i<SQueryManager._SQuerys.length;i++) {
            if (SQueryManager._SQuerys[i].filter._id == id)
                return SQueryManager._SQuerys[i].filter;
        }
    }
    static getSQueryNum() {
        return SQueryManager._SQuerys.length;
    }

    static getSQuery(pos) {
        return SQueryManager._SQuerys[pos].filter;                
    }

    static getSQueryID(pos) {
        return SQueryManager._SQuerys[pos].filter._id;                
    }

    static getIsProp(pos) {
        return SQueryManager._SQuerys[pos].isProp;                
    }

    static removeSQuery(id) {
        for (let i=0;i<SQueryManager._SQuerys.length;i++) {
            if (SQueryManager._SQuerys[i].filter._id == id) {
                return SQueryManager._SQuerys.splice(i, 1);
            }
        }
    }

    static updateSQuery(pos, SQuery) {
        SQueryManager._SQuerys[pos].filter = SQuery;
    }

    static updateSQueryIsProp(id,isProp) {
        for (let i=0;i<SQueryManager._SQuerys.length;i++) {
            if (SQueryManager._SQuerys[i].filter._id == id) {
                SQueryManager._SQuerys[i].isProp = isProp;
            }
        }
    }

    static toJSON() {
        let json = [];
        for (let i = 0; i < SQueryManager._SQuerys.length; i++) {
            json.push({filter:SQueryManager._SQuerys[i].filter.toJSON(), isProp:SQueryManager._SQuerys[i].isProp});
        }
        return json;
    }

    static fromJSON(json) {
        SQueryManager._SQuerys = [];
        for (let i = 0; i < json.length; i++) {
            let sf = new SQuery(SQueryManager._viewer);
            sf.fromJSON(json[i].filter);
            SQueryManager.addSQuery(sf,json[i].isProp);
        }
        return json;
    }

    static async evaluateProperties(nodeid)
    {
        let properties = [];
        for (let i = 0; i < SQueryManager._SQuerys.length; i++) {
            if (SQueryManager._SQuerys[i].isProp) {
                let SQuery = SQueryManager._SQuerys[i].filter;

                let stop = false;
                if (!SQuery._keepSearchingChildren) {
                    let tnodeid = nodeid;
                    while (1) {
                        tnodeid = SQueryManager._viewer.model.getNodeParent(tnodeid);
                        if (tnodeid == SQueryManager._viewer.model.getRootNode()) {
                            break;
                        }
                        let res = await SQuery.testOneNodeAgainstConditions(tnodeid);
                        if (res) {
                            stop = true;
                            break;
                        }                        
                    }
                }
                if (stop) {
                    continue;
                }
                let res = await SQuery.testOneNodeAgainstConditions(nodeid);
                if (res)
                {
                    let allPropertiesOnNode = await SQuery.findAllPropertiesOnNode(nodeid);
                    let text = SQuery.getName();
                    if (text == "")
                    {
                        text = SQuery.generateString();
                    }
                    properties.push({name:text, properties:allPropertiesOnNode});
                }
            }
        }
        return properties;
    }
}