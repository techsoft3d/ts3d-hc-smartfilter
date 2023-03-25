import { SQuery } from './SQuery.js';

export class SQueryManager {

    constructor(viewer) {
        this._viewer = viewer;
        this._SQuerys = [];
        this._modelHash = [];
        this._keepSearchingChildren = false;
    }

    addSQuery(SQuery) {
        this._SQuerys.push(SQuery);
    }

    async executeSQueries() {
        for (let i = 0; i < this._SQuerys.length; i++) {
            await this._SQuerys[i].performAction();
        }
    }

    setSQueries(SQuerys) {
        this._SQuerys = SQuerys;
    }

    setKeepSearchingChildren(keepSearchingChildren) {
        this._keepSearchingChildren = keepSearchingChildren;
    }

    getKeepSearchingChildren() {
        return this._keepSearchingChildren;
    }

    getSQuerys() {
        return this._SQuerys;

    }

    getSQueryByName(name) {
       for (let i=0;i<this._SQuerys.length;i++) {
            if (this._SQuerys[i].getName() == name)
                return this._SQuerys[i];
        }
    }

    getSQueryByID(id) {
        for (let i=0;i<this._SQuerys.length;i++) {
            if (this._SQuerys[i]._id == id)
                return this._SQuerys[i];
        }
    }
    getSQueryNum() {
        return this._SQuerys.length;
    }

    getSQuery(pos) {
        return this._SQuerys[pos];                
    }

    getSQueryID(pos) {
        return this._SQuerys[pos]._id;                
    }
   
    removeSQuery(id) {
        for (let i=0;i<this._SQuerys.length;i++) {
            if (this._SQuerys[i]._id == id) {
                return this._SQuerys.splice(i, 1);
            }
        }
    }

    updateSQuery(pos, SQuery) {
        this._SQuerys[pos] = SQuery;
    }

    updateSQueryIsProp(id,isProp) {
        for (let i=0;i<this._SQuerys.length;i++) {
            if (this._SQuerys[i]._id == id) {
                this._SQuerys[i].setProp(isProp);
            }
        }
    }

    toJSON() {
        let json = [];
        for (let i = 0; i < this._SQuerys.length; i++) {
            json.push(this._SQuerys[i].toJSON());
        }
        return json;
    }

    fromJSON(json) {
        this._SQuerys = [];
        for (let i = 0; i < json.length; i++) {
            let sf = new SQuery(this);
            sf.fromJSON(json[i]);
            this.addSQuery(sf);
        }
        return json;
    }

    async evaluateProperties(nodeid)
    {
        let properties = [];
        for (let i = 0; i < this._SQuerys.length; i++) {
            if (this._SQuerys[i].getProp()) {
                let SQuery = this._SQuerys[i];

                let stop = false;
                if (this._keepSearchingChildren != undefined ? !this._keepSearchingChildren : !SQuery._keepSearchingChildren) {
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

    _getModelTreeIdsRecursive(nodeid,proms, ids) {

        proms.push(this._viewer.model.getNodeProperties(nodeid));
        ids.push(nodeid);
        let children = this._viewer.model.getNodeChildren(nodeid);
        for (let i = 0; i < children.length; i++) {
            this._getModelTreeIdsRecursive(children[i],proms, ids);
        }
    }

    addModel(id,nodeid,savedHash) {
        for (let i=0;i<this._modelHash.length;i++)
        {
            if (this._modelHash[i].id == id)
            {
                this._modelHash[i].nodeid = nodeid;
                return;
            }
        }
        this._modelHash.push({id:id, nodeid: nodeid,savedHash:savedHash, ids: null, properties:null});
    }

    _updateHashes(ids,res,layernames)
    {
        for (let i = 0; i < res.length; i++) {
            this._propertyHash[ids[i]] = res[i];
            let layerid = this._viewer.model.getNodeLayerId(ids[i]);
            if (layerid != null && layernames.size > 1) {
                if (this._propertyHash[ids[i]] == null) {
                    this._propertyHash[ids[i]] = [];
                }
                if (this._viewer.model.getNodeType(ids[i]) == 3) {
                    let p = this._viewer.model.getNodeParent(ids[i]);
                    if (this._propertyHash[p] == null) {
                        this._propertyHash[p] = [];
                    }
                    this._propertyHash[p]["LAYER"] = layernames.get(layerid);
                }
                else {
                    this._propertyHash[ids[i]]["LAYER"] = layernames.get(layerid);
                }
            }
            for (let j in res[i]) {
                this._allPropertiesHash[j] = [];                
                if (this._allPropertiesHashNum[j] == undefined) {
                    this._allPropertiesHashNum[j] = 1;
                }
                else {
                    this._allPropertiesHashNum[j]++;
                }
            }
        }

        for (let i in this._propertyHash) {
            for (let j in this._propertyHash[i]) {
                this._propertyHash[i][j] = this._propertyHash[i][j].replace(/,/g, '.');
                this._allPropertiesHash[j][this._propertyHash[i][j]] = true;
            }
        }
    }

    parseSavedPropertyHash(savedPropertyHash) {

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


    gatherRelatedDataHashesRecursive(nodeid, la) {

        let bimid = this._viewer.model.getBimIdFromNode(nodeid);

        let elements = this._viewer.model.getBimIdRelatingElements(nodeid, bimid, Communicator.RelationshipType.SpaceBoundary);

        let lao = {i:nodeid};
        let elements2 = this._viewer.model.getBimIdRelatingElements(nodeid, bimid, Communicator.RelationshipType.ContainedInSpatialStructure);
        if (elements && elements.length > 0) {
            lao.e = elements;
        }
        if (elements2 && elements2.length > 0) {
            lao.f = elements2;
        }
        la.push(lao);
        let children = this._viewer.model.getNodeChildren(nodeid);
        for (let i = 0; i < children.length; i++) {
            this.gatherRelatedDataHashesRecursive(children[i], la);
        }
    }


     exportPropertyHash() {
        let allpropsarray = [];
        let nodeproparray = [];

        let tempHash = [];

        for (let i in this._allPropertiesHash) {
            let ppp = {name:i , values: Object.keys(this._allPropertiesHash[i])};

            let thash1 = [];
            for (let j=0;j<ppp.values.length;j++) {
                thash1[ppp.values[j]] = j;
            }
            ppp.ehash= thash1;            
            allpropsarray.push(ppp);
            tempHash[i] = allpropsarray.length -1;
        }

        for (let i in this._propertyHash) {
            let props = [];
            for (let j in this._propertyHash[i]) {
                let prop = allpropsarray[tempHash[j]];
                props.push(tempHash[j], prop.ehash[this._propertyHash[i][j]]);
              }
          
            nodeproparray.push({i: i, p: props});
        }

        for (let i= 0;i<allpropsarray.length;i++) {
            allpropsarray[i].ehash = undefined;
        }


         let relhash = [];
         this.gatherRelatedDataHashesRecursive(this._viewer, this._viewer.model.getRootNode(), relhash);
       
        return {allprops: allpropsarray, nodeprops: nodeproparray};
    }

    _consolidateBodies() {
        let lbs = [];
        for (let i in  this._propertyHash) {
            if (this._viewer.model.getNodeType(parseInt(i)) == 3 && this._propertyHash[i]["Volume"]) {
                let p = this._viewer.model.getNodeParent(parseInt(i));
                lbs[p] = true;
            }
        }

        for (let i in lbs) {
            let children = this._viewer.model.getNodeChildren(parseInt(i));
            let tv = 0;
            let sa = 0;
            for (let j = 0; j < children.length; j++) {
                let c = children[j];
                if (this._propertyHash[c] && this._propertyHash[c]["Volume"]) {
                    tv += parseFloat(this._propertyHash[c]["Volume"]);
                }   
                if (this._propertyHash[c] && this._propertyHash[c]["Surface Area"]) {
                    sa += parseFloat(this._propertyHash[c]["Surface Area"]);
                }                          
            }
            tv = tv + "mm³";
            sa = sa + "mm²";
            this._propertyHash[i]["Volume"] = tv;
            this._propertyHash[i]["Surface Area"] = sa;

            let nodename = this._viewer.model.getNodeName(parseInt(i));
            if (nodename.startsWith("Product")) {
                let parent = this._viewer.model.getNodeParent(parseInt(i));
                this._propertyHash[parent]["Volume"] = tv;
                this._propertyHash[parent]["Surface Area"] = sa;

            }            
        }
    }

    async initialize() {
        this._propertyHash = [];
        this._allPropertiesHash = [];
        this._allPropertiesHashNum = [];
        this._containedInSpatialStructureHash = [];
        this._spaceBoundaryHash = [];
        let layernames = this._viewer.model.getLayers();

        if (this._modelHash.length == 0) {
            let proms = [];
            let ids = [];

            this._getModelTreeIdsRecursive(this._viewer.model.getRootNode(), proms, ids);
            let res = await Promise.all(proms);
            this._updateHashes(ids, res, layernames);

            this._consolidateBodies();
        }
        else {
            for (let i = 0; i < this._modelHash.length; i++) {
                let model = this._modelHash[i];
                let ids = [];
                let res = null;
                let offset = this._viewer.model.getNodeIdOffset(model.nodeid);
                if (!model.ids) {
                    let proms = [];
                    if (!model.savedHash) {
                        this._getModelTreeIdsRecursive(model.nodeid, proms, ids);
                        res = await Promise.all(proms);
                    }
                    else {
                        let temp = this.parseSavedPropertyHash(model.savedHash);
                        res = temp.props;
                        ids = temp.ids;
                        this._containedInSpatialStructureHash = temp.relatedContainedIn;
                        this._spaceBoundaryHash = temp.relatedSpaceBoundary;
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
                this._updateHashes(ids, res, layernames);
            }
        }
    }

    getAllOptionsForProperty(propertyname) {

        return this._allPropertiesHash[propertyname];
    }

    getNumOptions(propertyname) {
        if (this._allPropertiesHash[propertyname] != undefined) {
            return  Object.keys(this._allPropertiesHash[propertyname]).length;
        }
    }

    getNumOptionsUsed(propertyname) {
        if (this._allPropertiesHash[propertyname] != undefined) {
            return this._allPropertiesHashNum[propertyname];
        }
    }

    getAllProperties() {

        let propsnames = [];
        let hasType = false;
        if (this._allPropertiesHash["TYPE"])
        {
            hasType = true;
        }

        let hasLayer = false;
        if (this._allPropertiesHash["LAYER"])
        {
            hasLayer = true;
        }

        let hasSurfaceArea = false;
        if (this._allPropertiesHash["Surface Area"])
        {
            hasSurfaceArea = true;
        }

        let hasVolume = false;
        if (this._allPropertiesHash["Volume"])
        {
            hasVolume = true;
        }


        for (let i in this._allPropertiesHash) {
            if (i != "TYPE" && i != "LAYER" && i != "Surface Area" && i != "Volume") {
                propsnames.push(i);                
            }
        }

        propsnames.sort();
        propsnames.unshift("---");
        propsnames.unshift("SQuery");

        if (hasLayer) {
            propsnames.unshift("LAYER");
        }


        if (hasType) {
            propsnames.unshift("TYPE");
        }

        if (hasSurfaceArea) {
            propsnames.unshift("Surface Area");
        }

        if (hasVolume) {
            propsnames.unshift("Volume");
        }
       
        propsnames.unshift("Rel:SpaceBoundary");
        propsnames.unshift("Rel:ContainedIn");
        propsnames.unshift("Node Color");
        propsnames.unshift("Node Type");
        propsnames.unshift("Node Children");
        propsnames.unshift("Node Chain");
        propsnames.unshift("Node Parent");
        propsnames.unshift("Nodeid");
        propsnames.unshift("Node Name");


        return propsnames;
    }

}