var myLayout;
var mySmartSearchManager;

async function msready() {


    // let res = await fetch('models2/props.json');
    // let json = await res.json();
    // mySmartSearchManager = new hcSmartSearch.SmartSearchManager(hwv);
    // mySmartSearchManager.addModel("hospital",hwv.model.getRootNode(),json);
    mySmartSearchManager = new hcSmartSearch.SmartSearchManager(hwv);

    hcSmartSearch.SmartSearchEditorUI.initialize("searchtools", mySmartSearchManager);
    hcSmartSearch.SmartSearchEditorUI.display();
    hcSmartSearch.SmartSearchManagerUI.initialize("SmartSearchfilterscontainer",mySmartSearchManager, true);
    hcSmartSearch.SmartSearchPropertiesUI.initialize("SmartSearchpropertiescontainer",mySmartSearchManager);
    hcSmartSearch.SmartSearchReportsUI.initialize("SmartSearchReportContainer",mySmartSearchManager);

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
                        content: [{
                            type: 'component',
                            componentName: 'Viewer',
                            isClosable: false,
                            width: 80,
                            componentState: { label: 'A' }
                        },
                        {
                            type: 'component',
                            componentName: 'Search Report',
                            isClosable: false,
                            height: 20,
                            componentState: { label: 'A' }
                        }],
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
