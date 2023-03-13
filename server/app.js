const imageservice = require('ts3d-hc-imageservice');
const fs = require('fs')

async function extractProperties() {

    let proms = [];
    let ids = [];
    let layernames = hwv.model.getLayers();
    let propertyHash = [];
    let allPropertiesHash = [];

    let la = [];
    let totals = 0;
    let totalc = 0;

    function gatherRelatedDataHashesRecursive(nodeid) {

        let bimid = hwv.model.getBimIdFromNode(nodeid);

        let elements = hwv.model.getBimIdRelatingElements(nodeid, bimid, Communicator.RelationshipType.SpaceBoundary);

        let lao = { i: nodeid };      
        let elements2 = hwv.model.getBimIdRelatingElements(nodeid, bimid, Communicator.RelationshipType.ContainedInSpatialStructure);
        if (elements && elements.length > 0) {
            lao.e = elements;
            totals++;
        }
        if (elements2 && elements2.length > 0) {
            lao.f = elements2;
            totalc++;
        }
        la.push(lao);
        let children = hwv.model.getNodeChildren(nodeid);
        for (let i = 0; i < children.length; i++) {
            gatherRelatedDataHashesRecursive(children[i]);
        }
    }

    function exportPropertyHash() {
        let allpropsarray = [];
        let nodeproparray = [];

        let tempHash = [];

        for (let i in allPropertiesHash) {
            let ppp = {name:i , values: Object.keys(allPropertiesHash[i])};

            let thash1 = [];
            for (let j=0;j<ppp.values.length;j++) {
                thash1[ppp.values[j]] = j;
            }
            ppp.ehash= thash1;            
            allpropsarray.push(ppp);
            tempHash[i] = allpropsarray.length -1;
        }

        for (let i in propertyHash) {
            let props = [];
            for (let j in propertyHash[i]) {
                let prop = allpropsarray[tempHash[j]];
                props.push(tempHash[j], prop.ehash[propertyHash[i][j]]);
              }
          
            nodeproparray.push({i: i, p: props});
        }

        for (let i= 0;i<allpropsarray.length;i++) {
            allpropsarray[i].ehash = undefined;
        }


        gatherRelatedDataHashesRecursive(hwv.model.getRootNode());
       
        return {allprops: allpropsarray, nodeprops: nodeproparray, related: la, totals: totals, totalc: totalc};
    }


    function updateHashes(res)
    {
        for (let i = 0; i < res.length; i++) {
            propertyHash[ids[i]] = res[i];
            let layerid = hwv.model.getNodeLayerId(ids[i]);
            if (layerid != null && layernames.size > 1) {
                if (propertyHash[ids[i]] == null) {
                    propertyHash[ids[i]] = [];
                }
                propertyHash[ids[i]]["LAYER"] = layernames.get(layerid);
            }
            for (let j in res[i]) {
                allPropertiesHash[j] = [];
            }
        }

        for (let i in propertyHash) {
            for (let j in propertyHash[i]) {
                allPropertiesHash[j][propertyHash[i][j]] = true;
            }
        }
    }

     function getModelTreeIdsRecursive(nodeid) {

        proms.push(hwv.model.getNodeProperties(nodeid));
        ids.push(nodeid);
        let children = hwv.model.getNodeChildren(nodeid);
        for (let i = 0; i < children.length; i++) {
            getModelTreeIdsRecursive(children[i]);
        }
    }
    getModelTreeIdsRecursive(hwv.model.getRootNode());
    let res = await Promise.all(proms);

    updateHashes(res);
    let fres = exportPropertyHash();
    return fres;
}

 (async () => {
        await imageservice.start();
        let t1 = new Date();
//        let res = await imageservice.generateImage("dev/models2/hospital.scs", 
        let res = await imageservice.generateImage("dev/models/arboleda.scs", 
        {callback:extractProperties,callbackParam:null,evaluate:true,cacheID:"arboleda"});
        console.log(res.allprops.length + " " +  res.nodeprops.length + " " + res.related.length + " " + res.totals + " " + res.totalc);
        let t2 = new Date();
        console.log("Time in seconds: " + (t2 - t1) / 1000);
        fs.writeFileSync("dev/models2/props.json", JSON.stringify(res));
        await imageservice.shutdown();

})();