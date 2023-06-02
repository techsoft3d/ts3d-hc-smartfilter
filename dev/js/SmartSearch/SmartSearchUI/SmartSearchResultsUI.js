import { SmartSearchEditorUI } from './SmartSearchEditorUI.js';
import { SmartSearchReportsUI } from './SmartSearchReportsUI.js';
export class SmartSearchResultsUI {

    static initialize(maindiv, manager) {
        SmartSearchResultsUI._maindiv = maindiv;
        SmartSearchResultsUI._manager = manager;
        SmartSearchResultsUI._viewer = manager._viewer;
        SmartSearchResultsUI._enableReport = false;
        

        SmartSearchResultsUI._viewer.setCallbacks({
            selectionArray: function (selarray, removed) {
                    SmartSearchResultsUI.generateSearchResults(SmartSearchEditorUI._founditems);
            },
        });

    }

    static setPopulateReportCallback(callback) {
        SmartSearchResultsUI._populateReportCallback = callback;
    }

    static setEnableReport(enable) {
        SmartSearchResultsUI._enableReport = enable;
    }

    static async display() {
        let html = "";
        html += '<div id = "SmartSearchResultsUIFirstRow" style="position:relative;width:100%;height:15px;top:-8px">';
        html += '<div style="position:absolute; left:3px;top:5px; font-size:14px;background-color:white" id="' + SmartSearchResultsUI._maindiv + '_found"></div>';
        html += SmartSearchResultsUI._generateDropdown();
        html += '<button class="SmartSearchSearchButton" type="button" style="right:5px;top:3px;position:absolute;" onclick=\'hcSmartSearch.SmartSearchEditorUI.selectAll(this)\'>Select</button>';
        if (SmartSearchResultsUI._enableReport) {
            html += '<button id="SmartSearchToggleViewButton" class="SmartSearchSearchButton" type="button" style="right:90px;top:3px;position:absolute;" onclick=\'hcSmartSearch.SmartSearchResultsUI._populateReport()\'>Create Report</button>';
        }
        html += '</div>';

        html += '<div id="' + SmartSearchResultsUI._maindiv + '_searchitems" class="SmartSearchSearchItems">';
        html += '</div>';
        html += '<div style="position:absolute; right:20px;bottom:0px; font-size:12px;background-color:white" id="' + SmartSearchResultsUI._maindiv + '_found"></div>';

        $("#" + SmartSearchResultsUI._maindiv).empty();
        $("#" + SmartSearchResultsUI._maindiv).append(html);

        const SmartSearchDropdowButton = document.querySelector('#SmartSearchResultsUIDropdown');
        const SmartSearchDropdowContent = document.querySelector('#SmartSearchResultsUIDropdownContent');

        SmartSearchDropdowButton.addEventListener('click', function () {              
            if ($(SmartSearchDropdowContent).hasClass("SmartSearchDropdowShow")) {
                $(SmartSearchDropdowButton).append(SmartSearchDropdowContent);
                let os = $(SmartSearchDropdowContent).parent().offset();
            }
            else {
                $("body").append(SmartSearchDropdowContent);
                let os = $(SmartSearchDropdowButton).offset();
                let top = os.top;
                let left = os.left;
                let height = $(SmartSearchDropdowContent).height();
                let width = $(SmartSearchDropdowContent).width();
                if (top + height > $(window).height()) {
                    top = $(window).height() - height - 10;
                }

                if (left + width > $(window).width()) {
                    left = $(window).width() - width - 30;
                }

                $(SmartSearchDropdowContent).css("top", top + "px");
                $(SmartSearchDropdowContent).css("left", left + "px");

            }

            SmartSearchDropdowContent.classList.toggle('SmartSearchDropdowShow');
        });

        window.addEventListener('click', function (event) {
            if (!event.target.matches('.SmartSearchDropdow-button')) {
                if (SmartSearchDropdowContent.classList.contains('SmartSearchDropdowShow')) {
                    SmartSearchDropdowContent.classList.remove('SmartSearchDropdowShow');
                }
            }
        });

    }

    static _populateReport() {


        if (SmartSearchResultsUI._populateReportCallback != null) {
            SmartSearchResultsUI._populateReportCallback();
        }
        else {
            let report = new hcSmartSearch.SmartSearchReport(this._manager, SmartSearchEditorUI._founditems);
            SmartSearchReportsUI.generateReport(report);
        }      
    }
   
   

    static async generateSearchResults(founditems_in) {
        SmartSearchResultsUI._results = founditems_in;
        $("#SmartSearchResultsUIFirstRow").css("display", "block");
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").css("overflow", "auto");
        $("#" + SmartSearchResultsUI._maindiv + "_found").empty();
        if (founditems_in == undefined) {
            $("#" + SmartSearchResultsUI._maindiv + "_searchitems").empty();
            return;
        }

        let founditems = founditems_in.getItems();

        if (founditems.length == 1) {
            $("#" + SmartSearchResultsUI._maindiv + "_found").append(founditems.length + " item found / " + SmartSearchEditorUI._founditems.getTotalSearchCount() + " searched");
        }
        else {
            $("#" + SmartSearchResultsUI._maindiv + "_found").append(founditems.length + " items found / " + SmartSearchEditorUI._founditems.getTotalSearchCount() + " searched");
        }

        let html = "";
        let y = 0;
        let toggle = true;

        let more = false;
        let lend = founditems.length;
        if (founditems.length > 2000) {
            lend = 2000;
            more = true;
        }

        for (let i = 0; i < lend; i++) {
            if (i % 500 == 0) {
                await new Promise(r => setTimeout(r, 1));      
            }
            toggle = !toggle;
            if (SmartSearchResultsUI._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(founditems[i].id))) {
                let parent = SmartSearchResultsUI._viewer.model.getNodeParent(founditems[i].id);
                if (SmartSearchResultsUI._viewer.selectionManager.isSelected(Communicator.Selection.SelectionItem.create(parent))) {
                    if (toggle) {
                        html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItemselectedIndirect">';
                    }
                    else {
                        html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItemselectedIndirect2">';
                    }
                }
                else {
                    if (toggle) {
                        html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItemselected">';
                    }
                    else {
                        html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItemselected2">';
                    }
                }
            }
            else {
                if (toggle) {
                    html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItem1">';
                }
                else {
                    html += '<div onclick=\'hcSmartSearch.SmartSearchResultsUI._select("' + founditems[i].id + '")\' class="SmartSearchSearchItem2">';
                }
            }

            html += '<div class="SmartSearchSearchItemText">' + SmartSearchEditorUI._htmlEncode(founditems[i].name) + '</div>';
            html += '<div class="SmartSearchSearchItemChainText">' + SmartSearchEditorUI._htmlEncode(founditems[i].chaintext) + '</div>';
            html += '</div>';
            y++;
        }
        if (more) {
            html += '<div style="left:3px;" >More...</div>';
        }
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").empty();

        
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").append(html);
        SmartSearchResultsUI.adjust();
    }

    static adjust() {

        if ($("#" + SmartSearchResultsUI._maindiv + "_searchitems").length == 0) {
            return;
        }
        let newheight = $("#" + SmartSearchEditorUI._maindiv).height() - ($("#" + SmartSearchResultsUI._maindiv + "_searchitems").offset().top - $("#" + SmartSearchEditorUI._maindiv).parent().offset().top);
        $("#" + SmartSearchResultsUI._maindiv + "_searchitems").css({ "height": newheight + "px" });


        let gap = newheight + $("#" + SmartSearchEditorUI._maindiv + "_conditions").height() + 3;
        if (SmartSearchEditorUI._showFirstRow) {
            gap += $("#" + SmartSearchEditorUI._maindiv + "_firstrow").height();
        }
    }

    static _select(id) {
        if (!SmartSearchEditorUI.ctrlPressed)
            SmartSearchResultsUI._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Set);
        else
            SmartSearchResultsUI._viewer.selectionManager.selectNode(parseInt(id), Communicator.SelectionMode.Toggle);

        SmartSearchResultsUI.generateSearchResults(SmartSearchEditorUI._founditems);
    }

    static _generateDropdown() {
        let html = "";
        html += '<button id="SmartSearchResultsUIDropdown" style="right:56px;top:3px;position:absolute;" class="SmartSearchSearchButton SmartSearchDropdow-button">...</button>';
        html += '<ul  id="SmartSearchResultsUIDropdownContent" style="position:absolute;z-index:10000" class="SmartSearchDropdow-content">';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.selectAll(this)\'>Select</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().isolateAll(this)\'>Isolate</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().makeVisible(true)\'>Show</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().makeVisible(false)\'>Hide</li>';
        html += '<li >---</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(255,0,0))\'>Red</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(0,255,0))\'>Green</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(0,0,255))\'>Blue</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(255,255,0))\'>Yellow</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().colorize(new Communicator.Color(128,128,128))\'>Grey</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().setOpacity(0.7)\'>Transparent</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().setOpacity(1)\'>Opaque</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().setSelectable(false)\'>Not Selectable</li>';
        html += '<li onclick=\'hcSmartSearch.SmartSearchEditorUI.getFoundItems().setSelectable(true)\'>Selectable</li>';
        html += '</ul>';
        return html;
    }
}