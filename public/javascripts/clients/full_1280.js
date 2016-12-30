
$('.full_1280 .status').on('click', function (e) {
    var this_button = $(this);
    var id = getPanelID($(this).closest(".panel_layout"));
    if(id < 0) return; // exit if panel id not found

    $.each(panels[id].devices, function(k, v){
        $.getJSON("/ird1280s/"+v.id, null, function(json) {
            var panel = this_button.closest(".panel_layout");
            //update panel data
            panels[id].devices[0] = json;
            //clear no comm
            //fill form with data
            fill_1280_Panel(panel, json);
        })
        .fail(function() {
            this_button.removeClass("btn-success");
            this_button.removeClass("btn-danger");
            this_button.html(this_button.html().replace("(NO COMM)", "") + "(NO COMM)")
        })
    })
   
});


// This allows the blur trigger to send the data update because by default changing a select will not blur
$('.full_1280 .input,.full_1280  .port,.full_1280  .service').on('change', function (e) {
    if($(this).is(":focus")){
        $(this).blur();
    }
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.full_1280 .input').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    panels[id].devices[0].input = valueSelected;
    $.post("/ird1280s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {}, "json");
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.full_1280 .port').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(valueSelected == panels[id].devices[0].port) return; //dont update if field didnt change
    panels[id].devices[0].port = valueSelected;

    $.post("/ird1280s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {}, "json");
});

$('.full_1280 .satFreq').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(valueSelected * 1000 == panels[id].devices[0].freq) return; //dont update if field didnt change
    panels[id].devices[0].freq = valueSelected * 1000;
    $.post("/ird1280s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) { }, "json");
});

$('.full_1280 .symRate').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var id = getPanelID(panel);
    if(id < 0) return;
    if(valueSelected * 1000*1000 == panels[id].devices[0].symRate) return; //dont update if field didnt change
    panels[id].devices[0].symRate = valueSelected * 1000*1000;
    $.post("/ird1280s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {}, "json");
});

$('.full_1280 input.modulation[type=radio]').on('change', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(valueSelected  == panels[id].devices[0].modulation) return; //dont update if field didnt change
    panels[id].devices[0].modulation = valueSelected;
    $.post("/ird1280s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {  }, "json");
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.full_1280 .service').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    panels[id].devices[0].current_service = valueSelected;
    $.post("/ird1280s/"+panels[id].devices[0].id+"/services", panels[id].devices[0], function(json) {}, "json");
});