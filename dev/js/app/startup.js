var myLayout;


async function msready() {

    SFUI.SmartFilterEditor.initialize("searchtools", hwv);
    SFUI.SmartFilterEditor.display();


    SFUI.SmartFilterManagerUI.initialize(hwv,"smartfilterscontainer");
    SFUI.SmartPropertiesUI.initialize(hwv,"smartpropertiescontainer");

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
                                height: 40,
                                componentState: { label: 'C' }
                            },
                            {
                                type: 'component',
                                componentName: 'Smart Filters',
                                isClosable: true,
                                height: 40,
                                componentState: { label: 'C' }
                            },
                            {
                                type: 'component',
                                componentName: 'Smart Properties',
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

    myLayout.registerComponent('Smart Filters', function (container, componentState) {
        $(container.getElement()).append($("#smartfilterscontainer"));
    });

    myLayout.registerComponent('Smart Properties', function (container, componentState) {
        $(container.getElement()).append($("#smartpropertiescontainer"));
    });

    myLayout.on('stateChanged', function () {
        if (hwv != null) {
            hwv.resizeCanvas();
            SmartFilterEditor.adjust();
        }
    });
    myLayout.init();

    var viewermenu = [
        {
            name: 'Toggle Allow Body Nodes',
            fun: function () {
                myMaterialTool.setDisallowBodyNodes(!myMaterialTool.getDisallowBodyNodes());
            }
        },
        {
            name: 'Display Stats',
            fun: function () {
                hwv.view.setStatisticsDisplayVisibility(true);
            }
        },            
    ];

    $('#viewermenu1button').contextMenu(viewermenu, undefined, {
        'displayAround': 'trigger',
        'containment': '#viewerContainer'
    });


}


function initializeSearch(){
    if(hwv.selectionManager.getLast())   
        SmartFilterEditor.initialize("searchtools",hwv,hwv.selectionManager.getLast().getNodeId());
    else
        SmartFilterEditor.initialize("searchtools",hwv);
    SmartFilterEditor.display();
}
