var myLayout;
var mySmartSearchManager;



function generateReportCallback() {

    let newItemConfig = {
        type: 'component',
        componentName: 'Search Report',
        isClosable: true,
        id: "Search Report",
        height: 20,
        componentState: { label: 'A' }
    };


    if (myLayout.root.getItemsById("Search Report").length == 0) {
        myLayout.root.contentItems[0].contentItems[0].addChild( newItemConfig ,1);
        $("#SmartSearchReportContainer").css("display", "block");
        topcontainer.setSize(100, 300);
    }
            
    let report = new hcSmartSearch.SmartSearchReport(mySmartSearchManager,   hcSmartSearch.SmartSearchEditorUI.getFoundItems());
    hcSmartSearch.SmartSearchReportsUI.generateReport(report);
}

async function msready() {


    // let res = await fetch('models2/props.json');
    // let json = await res.json();
    // mySmartSearchManager = new hcSmartSearch.SmartSearchManager(hwv);
    // mySmartSearchManager.addModel("hospital",hwv.model.getRootNode(),json);
    mySmartSearchManager = new hcSmartSearch.SmartSearchManager(hwv);

    hcSmartSearch.SmartSearchEditorUI.initialize("searchtools", mySmartSearchManager);
    hcSmartSearch.SmartSearchResultsUI.setEnableReport(true);
    hcSmartSearch.SmartSearchEditorUI.display();
    hcSmartSearch.SmartSearchManagerUI.initialize("SmartSearchfilterscontainer",mySmartSearchManager, true);
    hcSmartSearch.SmartSearchPropertiesUI.initialize("SmartSearchpropertiescontainer",mySmartSearchManager);
    hcSmartSearch.SmartSearchReportsUI.initialize("SmartSearchReportContainer",mySmartSearchManager);
    hcSmartSearch.SmartSearchResultsUI.setPopulateReportCallback(generateReportCallback);

    // hwv.selectionManager.setSelectionFilter(function (nodeid) {
    //     return nodeid;
    // }
    // );
}

function startup()
{   
    createUILayout();
} 

function createUILayout() {

    var config = {
        settings: {
            showPopoutIcon: false,
            showMaximiseIcon: true,
            showCloseIcon: false
        },
        content: [
            {
                type: 'row',
                content: [
                    {
                        type: 'column',
                        isClosable: false,
                        content: [{
                            type: 'component',
                            componentName: 'Viewer',
                            isClosable: false,
                            width: 80,
                            height:75,
                            componentState: { label: 'A' }
                        }
                        ],
                    },                 
                    {
                        type: 'column',
                        width: 25,
                        height: 35,
                        content: [                           
                            {
                                type: 'component',
                                componentName: 'Search',
                                isClosable: true,
                                height: 50,
                                componentState: { label: 'C' }
                            },
                            {
                                type: 'component',
                                componentName: 'Search Manager',
                                isClosable: true,
                                height: 30,
                                componentState: { label: 'C' }
                            },
                            {
                                type: 'component',
                                componentName: 'Search Properties',
                                isClosable: true,
                                height: 20,
                                componentState: { label: 'C' }
                            }
                        ]
                    },
                ],
            }]
    };



    myLayout = new GoldenLayout(config);
    myLayout.registerComponent('Viewer', function (container, componentState) {
        $(container.getElement()).append($("#content"));
    });


    myLayout.registerComponent('Search', function (container, componentState) {
        $(container.getElement()).append($("#searchtoolcontainer"));
    });

    myLayout.registerComponent('Search Manager', function (container, componentState) {
        $(container.getElement()).append($("#SmartSearchfilterscontainer"));
    });

    myLayout.registerComponent('Search Properties', function (container, componentState) {
        $(container.getElement()).append($("#SmartSearchpropertiescontainer"));
    });

    myLayout.registerComponent('Search Report', function (container, componentState) {
        topcontainer = container;
        topcontainer.on('destroy', function (a,b,c,d) {
            $("body").append($("#SmartSearchReportContainer"));
        });
        $(container.getElement()).append($("#SmartSearchReportContainer"));
    });


    myLayout.on('stateChanged', function () {
        if (hwv != null) {
            hwv.resizeCanvas();
        }
    });
   
    myLayout.init();
}


function initializeSearch(){
    if(hwv.selectionManager.getLast())   
        hcSmartSearch.SmartSearchEditorUI.initialize("searchtools",hwv,hwv.selectionManager.getLast().getNodeId());
    else
        hcSmartSearch.SmartSearchEditorUI.initialize("searchtools",hwv);
    hcSmartSearch.SmartSearchEditorUI.display();
}
