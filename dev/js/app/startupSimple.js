var myLayout;
var mySmartSearchManager;
let typeArray = [];

async function msready() {
    mySmartSearchManager = new hcSmartSearch.SmartSearchManager(hwv);
    await mySmartSearchManager.initialize();
    regenerateOptions();
}

function deleteFromButton(c) {
    let propname = $(c).prev()[0].innerHTML;

    for (let i=0;i<typeArray.length;i++) {
        if (typeArray[i] == propname) {
            typeArray.splice(i,1);
            break;
        }
    }
  
    regenerateOptions();

}

function generateTypeButton(text) {
    let html = "";
    html += '<button class="rectangular-button">';
    html += '<span>' + text + '</span><span onclick = "deleteFromButton(this)" class="x">&times;</span>';
    html += '</button>';
    return html;
}

function regenerateOptions() {
    
    if (typeArray.length > 0) {
        $("#typeSelect").css("top", "40px");
    }
    else {
        $("#typeSelect").css("top", "25px");

    }
    let options = mySmartSearchManager.getAllOptionsForProperty("TYPE");
    let sortedStrings = [];
    for (let i in options) {
        sortedStrings.push(i);
    }
    sortedStrings.sort();
//    sortedStrings.unshift("Choose Type");
    let html = '<option selected disabled>Choose Type</option>';
    for (let i = 0; i < sortedStrings.length; i++) {
            html += '<option value="' + sortedStrings[i] + '">' + sortedStrings[i] + '</option>\n';
    }
    $("#typeSelect").empty();
    $("#typeSelect").append(html);


    html = "";
    for (let i=0;i<typeArray.length;i++) {
        html += generateTypeButton(typeArray[i]);
    }
    $("#typeRow").empty();
    $("#typeRow").append(html);
}

function typeChanged() {
    typeArray.push($("#typeSelect")[0].value);
    regenerateOptions();
}

async function doSearch() {
    let search = new hcSmartSearch.SmartSearch(mySmartSearchManager, hwv.model.getRootNode());
    let condition;
    if (typeArray.length > 0) {
        condition = new hcSmartSearch.SmartSearchCondition();
        condition.setPropertyType(hcSmartSearch.SmartSearchPropertyType.property);
        condition.setPropertyName("TYPE");
        let typetext = "";
        for (let i = 0; i < typeArray.length; i++) {
            typetext += '"' + typeArray[i] + '"';
            //        typetext += typeArray[i];
            if (i < typeArray.length - 1) {
                typetext += ",";
            }
        }
        condition.setPropertyValue(typetext);
        search.addCondition(condition);
    }
    
    condition = new hcSmartSearch.SmartSearchCondition();
    condition.setPropertyType(hcSmartSearch.SmartSearchPropertyType.nodeName);
    if ($("#modeSelect")[0].value == "contains") {
        condition.setPropertyValue($("#searchInput").val());
    }
    else if ($("#modeSelect")[0].value == "exact") {
        condition.setPropertyValue('"' + $("#searchInput").val() + '"');
    }
    else if ($("#modeSelect")[0].value == "Starts With") {
        condition.setPropertyValue('^' + $("#searchInput").val());
        condition.setConditionType(hcSmartSearch.SmartSearchConditionType.regex);
    }
    else if ($("#modeSelect")[0].value == "Ends With") {
        condition.setPropertyValue($("#searchInput").val() + '$');
        condition.setConditionType(hcSmartSearch.SmartSearchConditionType.regex);
    }
    search.addCondition(condition);

    let results = await search.apply();

    let selections = [];
    for (let i = 0; i < results.length; i++) {
        selections.push(new Communicator.Selection.SelectionItem(results[i]));
    }
    hwv.selectionManager.set(selections);
}