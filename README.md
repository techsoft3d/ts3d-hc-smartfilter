# SmartFilters


## Advanced Search for HOOPS Communicator
This library provides adanced search capabilities for HOOPS Communicator. It is split into the two main components, the core search and filter functionality as well as an UI component utilizing those classes.

For questions/feedback please send an email to guido@techsoft3d.com or post in our [forum](https://forum.techsoft3d.com/). For a 90 day trial of the HOOPS Web Platform go to [Web Platform](https://www.techsoft3d.com/products/hoops/web-platform).



## Install
Add dist/smartFilter.min.js to your project for the core search functionality without any UI. If you include only this library into your project, you need to provide your own search UI.
```
    <script src="./js/smartFilter.min.js"></script>
```

Add dist/smartFilterUI.min.js for the optional UI component. 
```
    <script src="./js/smartFilterUI.min.js"></script>
```

If you are using the UI library you also need to add the provided css file:
```
    <link rel="stylesheet" href="./css/smartFilterUI.css">
```


## Search Editor UI 
### Initialization

```
SFUI.SmartFilterEditor.initialize("searcheditor", hwv);
SFUI.SmartFilterEditor.display();
```
Initializes the Editor UI and displays it. The first parameter is the id of the div that the UI should be created in. The second parameter is the webviewer object. A third (optional) parameter is the startnode. It is the node from which the search will be performed.

Before the search window is initially displayed all model properties are extracted and put into an internal hash. That can take a few seconds for large models.

```
 SFUI.SmartFilterEditor.adjust();
```
Call this function when the size of the surrounding div changes. 

The editor is somewhat reactive and will adjust to various sizes though the parent div should be at least 300px wide and 400px high. Through a separate CSS file you can modify some aspect of its styling but if you need more customization I suggest delving into the source code.

### Usage

 The functionality of this class should be largely self-explanatory. You can combine multiple search filters with either an “and” or “or” (but not mixed). However you can also add a single level of subfilters for more flexibility. In addition the user can first perform a search and then click on the “Sel:” checkbox which will limit all future searches to the selected entities.

**Searching with "HAS"**

When searching for text with “has” the default is a substring search so a search for “screw” will find “front screw” as well as “back screw”. If you need a precise search surround the search string in double quotes. If you want to find all nodes that “do not” have the search string put a “-“ in front of the search term. You can also combine multiple text searches by putting a “,” between them.

**Example "HAS" Searches:**  
*Type has wall,-curtainwall*  
This will find all walls except for curtain walls.

*Type has wall,door*  
This will find all elements where the type name has either wall or door in it

*Type has "IFCWALL"  
This will find all elements where the type name is exactly “IFCWALL”


**Nodeid Property**  
You can search for specific nodeids (separated by comma) with this property

**Node Chain**  
“Node Chain” performs the text search on the complete path to a node. Its an easy way to filter the search by a certain floor in a building for example.


**Node Type**  
Performs the search on the HOOPS Communicator internal type of the node (the value returned by model.getNodeTyp())


**Node Color**  
Performs the search on the color of a node. You can specify your own color as 3 RGB integers (e.g. “255 0 0”) or if you select a node before adding the search item the color of that node will be a preset option.

**Rel: Space Boundary**  
If this option is selected the search will be performed on the relating SpaceBoundary elements of the nodes with the specified text.

**Rel: Contained**  
If this option is selected the search will be performed on the elements "contained in" the nodes with the specified text.

### Advanced Usage:


```
 SFUI.SmartFilterEditor.setChainSkip(1);
```
When displaying the search results you can optionally skip over the first "n" levels when displaying the parent hierachy of a node. THis is useful if you loaded your model into a node other than the root node.


```
 SFUI.SmartFilterEditor.setShowLimitOption(true);
```
You can control if the Limit checkbox should be visible in the UI.



## SmartfilterManager UI
### Initialization

```
    SFUI.SmartFilterManagerUI.initialize("smartfiltermanagercontainer",hwv, true);
```

Initializes the Manager UI and displays it. The first parameter is the id of the div that the UI should be created in. The second parameter is the webviewer object. If the third parameter is set to true the import/export buttons will be visible in the UI. 




### Usage

This class essentially keeps a list of filters that can be applied to the model. The user can add a new filter by pressing the add button which adds the current editor search to the filter list.

After the search has been added it can be executed via the "Select" button which will highlight all found nodes and update the search editor window. The user can also edit the generated text describing the search, update the filter from the current editor search or delete the filter from the list. The final colum in the list indicates if the filter should become a smart property. See below for more information on this functionality.
  
With the optional Load/Export buttons the user can load and save the current list of smartfilters to a file.


### Advanced Usage:

You can provide a callback function that gets triggered on any change of the list of smartfilters. You can then retrieve the smartfilterlist from the SmartFilterManager object and push it to your server as in the example below:
```
    SFUI.SmartFilterManagerUI.setUpdatedCallback(smartFiltersUpdated);        
    async function smartFiltersUpdated() {
        let text = JSON.stringify({filtersarray:SF.SmartFilterManager.toJSON()});

        var res = await fetch(serveraddress + '/api/smartFilters', {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
            'Content-Type': 'application/json'      
            },
            body: text
        });

}
```

After a retrieving an existing list of smartfilters you can add it to the smartfiltermanager after initialization as in the code below:

```
    SF.SmartFilterManager.fromJSON(data.filtersarray);
    SFUI.SmartFilterManagerUI.refreshUI();
```



## SmartfilterProperties UI
### Initialization


```
  SFUI.SmartPropertiesUI.initialize("smartpropertiescontainer",hwv);
```


Initializes the SmartProperties UI and displays it. The first parameter is the id of the div that the UI should be created in. The second parameter is the webviewer object. 


### Usage

Via the SmartFilterManager each smartfilter can be turned into a smart property which means that it will be evaluated whenever the user clicks on that object. It basically becomes a user defined property. 


## Performance and handling of Federated Models
In order to ensure fast client-side search performance, the SmartFilter generates an initial acceleration structure for the loaded model. This can take a few seconds for large models. This structure also needs to be regenerated whenever a new model is added to the scene. To improve the performance for this workflow it is possible to provide the startnode of the newly loaded model as well as a unique identifier (e.g. its unique name) to the SmartFilter after the model has been loaded (make sure that the provided nodeid is part of the new model, in most cases this will be the child node of the node you loaded the model into)

```
  SF.SmartFilter.addModel("arboleda",nodeid);
```

Now, if a new model is added to the viewer the acceleration structure only has to be generated for the newly added model and not the already existing models which should significantly improve performance.



## TODO:
* Document SmartFilter and SmartFilterManager classes


## Disclaimer
**This library is not an officially supported part of HOOPS Communicator and provided as-is.**

## Acknowledgments

* [GoldenLayout](https://golden-layout.com/)
* [Tabulator](http://tabulator.info/)


