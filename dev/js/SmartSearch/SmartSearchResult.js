export class SmartSearchResult {
    
    static createChainText(viewer, id, startid, chainskip) {
        let current = id;
        let chain = [];
        while (1) {
            let newone = viewer.model.getNodeParent(current);
            if (newone == null || newone == startid)
                break;
            chain.push(viewer.model.getNodeName(newone));
            current = newone;
        }
        let chaintext = "";
        for (let j = chain.length - 1 - chainskip; j >= 0; j--) {
            if (j > 0)
                chaintext += chain[j] + "->";
            else
                chaintext += chain[j];
        }
        return chaintext;
    }
    
    constructor(manager, query) {
        this._manager = manager;
        this._viewer = this._manager._viewer;
        this._query = query;
    }

  
    getTotalSearchCount() {
        return this._query.getSearchCounter();
    }

    getQuery() {
        return this._query;
    }
    
    generateItems(nodeids, startnode, chainSkip) {
        this._items = [];
        for (let i=0;i<nodeids.length;i++) {
            let chaintext = SmartSearchResult.createChainText(this._viewer, nodeids[i], startnode, chainSkip);
            let item = {name: this._viewer.model.getNodeName(nodeids[i]), id: nodeids[i], chaintext: chaintext};            
            this._items.push(item);
        }  
    }
    
    getItems() {
        return this._items;
    }

    makeVisible(onoff) {        
                            
        let selections = this._itemsToSelections();
     
        this._viewer.model.setNodesVisibility(selections, onoff);
    }

    async setOpacity(opacity) {        
                   
        let selections = this._itemsToSelections();

        this._viewer.model.setNodesOpacity(selections, opacity);
    }

    async setSelectable(isSelectable) {        
                   
        let selections = this._itemsToSelections();

        this._viewer.model.setInstanceModifier(Communicator.InstanceModifier.DoNotSelect, selections, !isSelectable);
    }

    async colorize(color) {        
                   
        let selections = this._itemsToSelections();
        await this._viewer.model.setNodesFaceColor(selections, color);
    }

    isolateAll() {        
                            
        let selections = this._itemsToSelections();
        this._viewer.view.isolateNodes(selections);
    }

    selectAll() {        
                     
        let selections = [];
        for (let i = 0; i < this._items.length; i++) {
            selections.push(new Communicator.Selection.SelectionItem(parseInt(this._items[i].id)));
        }

        this._viewer.selectionManager.add(selections);
       
    }

    _itemsToSelections() {
        let selections = [];
        for (let i = 0; i < this._items.length; i++) {
            selections.push(parseInt(this._items[i].id));
        }
        return selections;
    }


     

    convertColor(color) {
        switch (color) {
            case "red":
                return new Communicator.Color(255, 0, 0);
            case "green":
                return new Communicator.Color(0, 255, 0);
            case "blue":
                return new Communicator.Color(0, 0, 255);
            case "yellow":
                return new Communicator.Color(255, 255, 0);
            case "brown":
                return new Communicator.Color(150, 75, 0);
            case "black":
                return new Communicator.Color(0, 0, 0);
            case "white":
                return new Communicator.Color(255, 255, 255);
            case "orange":
                return new Communicator.Color(255, 165, 0);
            case "grey":
                return new Communicator.Color(128, 128, 128);
        }
    }
}