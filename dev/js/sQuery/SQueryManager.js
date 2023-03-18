import { SQuery } from './SQuery.js';

export class SQueryManager {

    constructor(viewer) {
        this._viewer = viewer;
        this._SQuerys = [];
    }

    addSQuery(SQuery,isProp) {
        let filter = {filter:SQuery, isProp:isProp};
        this._SQuerys.push({filter:SQuery, isProp:isProp});
    }

    getSQuerys() {
        return this._SQuerys;

    }

    getSQueryByName(name) {
       for (let i=0;i<this._SQuerys.length;i++) {
            if (this._SQuerys[i].filter.getName() == name)
                return this._SQuerys[i];
        }
    }

    getSQueryByID(id) {
        for (let i=0;i<this._SQuerys.length;i++) {
            if (this._SQuerys[i].filter._id == id)
                return this._SQuerys[i].filter;
        }
    }
    getSQueryNum() {
        return this._SQuerys.length;
    }

    getSQuery(pos) {
        return this._SQuerys[pos].filter;                
    }

    getSQueryID(pos) {
        return this._SQuerys[pos].filter._id;                
    }

    getIsProp(pos) {
        return this._SQuerys[pos].isProp;                
    }

    removeSQuery(id) {
        for (let i=0;i<this._SQuerys.length;i++) {
            if (this._SQuerys[i].filter._id == id) {
                return this._SQuerys.splice(i, 1);
            }
        }
    }

    updateSQuery(pos, SQuery) {
        this._SQuerys[pos].filter = SQuery;
    }

    updateSQueryIsProp(id,isProp) {
        for (let i=0;i<this._SQuerys.length;i++) {
            if (this._SQuerys[i].filter._id == id) {
                this._SQuerys[i].isProp = isProp;
            }
        }
    }

    toJSON() {
        let json = [];
        for (let i = 0; i < this._SQuerys.length; i++) {
            json.push({filter:this._SQuerys[i].filter.toJSON(), isProp:this._SQuerys[i].isProp});
        }
        return json;
    }

    fromJSON(json) {
        this._SQuerys = [];
        for (let i = 0; i < json.length; i++) {
            let sf = new SQuery(this);
            sf.fromJSON(json[i].filter);
            this.addSQuery(sf,json[i].isProp);
        }
        return json;
    }

    async evaluateProperties(nodeid)
    {
        let properties = [];
        for (let i = 0; i < this._SQuerys.length; i++) {
            if (this._SQuerys[i].isProp) {
                let SQuery = this._SQuerys[i].filter;

                let stop = false;
                if (!SQuery._keepSearchingChildren) {
                    let tnodeid = nodeid;
                    while (1) {
                        tnodeid = this._viewer.model.getNodeParent(tnodeid);
                        if (tnodeid == this._viewer.model.getRootNode()) {
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