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
    let totala = 0;

    function gatherRelatedDataHashesRecursive(nodeid) {

        let bimid = hwv.model.getBimIdFromNode(nodeid);
        let lao = {i:nodeid};

        let elements  = hwv.model.getBimIdRelatingElements(nodeid, bimid, Communicator.RelationshipType.SpaceBoundary);
        let elements2 = hwv.model.getBimIdRelatingElements(nodeid, bimid, Communicator.RelationshipType.ContainedInSpatialStructure);
        let elements3 = hwv.model.getBimIdRelatingElements(nodeid, bimid, Communicator.RelationshipType.Aggregates);

        if (elements && elements.length > 0) {
            lao.e = elements;
            totals++;
        }
        if (elements2 && elements2.length > 0) {
            lao.f = elements2;
            totalc++;
        }
        if (elements3 && elements3.length > 0) {
            lao.g = elements3;
            totala++;
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
       
        return {allprops: allpropsarray, nodeprops: nodeproparray, related: la, totals: totals, totalc: totalc,totala:totala};
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
                if (hwv.model.getNodeType(ids[i]) == 3) {
                    let p = hwv.model.getNodeParent(ids[i]);
                    if (propertyHash[p] == null) {
                        propertyHash[p] = [];
                    }
                    propertyHash[p]["LAYER"] = layernames.get(layerid);
                }
                else {
                    propertyHash[ids[i]]["LAYER"] = layernames.get(layerid);
                }
            }
            for (let j in res[i]) {
                allPropertiesHash[j] = [];
            }
        }

        for (let i in propertyHash) {
            for (let j in propertyHash[i]) {
                propertyHash[i][j] = propertyHash[i][j].replace(/,/g, '');
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

    function consolidateBodies() {
        let lbs = [];
        for (let i in propertyHash) {
            if (hwv.model.getNodeType(parseInt(i)) == 3 && propertyHash[i]["Volume"]) {
                let p = hwv.model.getNodeParent(parseInt(i));
                lbs[p] = true;
            }
        }

        for (let i in lbs) {
            let children = hwv.model.getNodeChildren(parseInt(i));
            let tv = 0;
            let sa = 0;
            for (let j = 0; j < children.length; j++) {
                let c = children[j];
                if (propertyHash[c] && propertyHash[c]["Volume"]) {
                    tv+=parseFloat(propertyHash[c]["Volume"]);
                }   
                if (propertyHash[c] && propertyHash[c]["Surface Area"]) {
                    sa += parseFloat(propertyHash[c]["Surface Area"]);
                }                          
            }
            tv = tv + "mm³";
            sa = sa + "mm²";
            propertyHash[i]["Volume"] = tv;
            propertyHash[i]["Surface Area"] = sa;
            let nodename = hwv.model.getNodeName(parseInt(i));
            if (nodename.startsWith("Product")) {
                let parent = hwv.model.getNodeParent(parseInt(i));
                propertyHash[parent]["Volume"] = tv;
                propertyHash[parent]["Surface Area"] = sa;
            }                        
            allPropertiesHash["Volume"][tv] = true;
            allPropertiesHash["Surface Area"][sa] = true;
        }
    }

    getModelTreeIdsRecursive(hwv.model.getRootNode());
    let res = await Promise.all(proms);
    updateHashes(res);

    consolidateBodies();


    let fres = exportPropertyHash();
    return fres;
}


exports.generatePropData = async function (infile, outfile) {

    await imageservice.start();
    let t1 = new Date();
   let res = await imageservice.generateImage(infile, { callback: extractProperties, callbackParam: null, evaluate: true, cacheID: "xxx" });
    console.log(res.allprops.length + " " + res.nodeprops.length + " " + res.related.length + " " + res.totals + " " + res.totalc + " " + res.totala);
    let t2 = new Date();
    console.log("Time in seconds: " + (t2 - t1) / 1000);
    if (outfile) {
        fs.writeFileSync(outfile, JSON.stringify(res));
    }
    await imageservice.shutdown();
    return res;
};


//this.generatePropData("dev/models2/hospital.scs", "dev/models2/props.json");