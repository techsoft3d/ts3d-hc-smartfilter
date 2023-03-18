var myLayout;


async function msready() {


    // let res = await fetch('models2/props.json');
    // let json = await res.json();
    // hcSQuery.SQuery.addModel("hospital",hwv.model.getRootNode(),json);


    hcSQueryUI.SQueryEditor.initialize("searchtools", hwv);
    hcSQueryUI.SQueryEditor.display();


    hcSQueryUI.SQueryManagerUI.initialize("squeryfilterscontainer",hwv, true);
    hcSQueryUI.SQueryPropertiesUI.initialize("squerypropertiescontainer",hwv);

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
                                componentName: 'SQueries',
                                isClosable: true,
                                height: 40,
                                componentState: { label: 'C' }
                            },
                            {
                                type: 'component',
                                componentName: 'SProperties',
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

    myLayout.registerComponent('SQueries', function (container, componentState) {
        $(container.getElement()).append($("#squeryfilterscontainer"));
    });

    myLayout.registerComponent('SProperties', function (container, componentState) {
        $(container.getElement()).append($("#squerypropertiescontainer"));
    });

    myLayout.on('stateChanged', function () {
        if (hwv != null) {
            hwv.resizeCanvas();
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
        hcSQueryUI.SQueryEditor.initialize("searchtools",hwv,hwv.selectionManager.getLast().getNodeId());
    else
        hcSQueryUI.SQueryEditor.initialize("searchtools",hwv);
    hcSQueryUI.SQueryEditor.display();
}
