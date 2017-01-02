
$('.full_8200_with_qt .status').on('click', function (e) {
    var this_button = $(this);
    var id = getPanelID($(this).closest(".panel_layout"));
    if(id < 0) return; // exit if panel id not found

    var irddevice = panels[id].devices[0];
    $.getJSON("/ird8200s/"+irddevice.id, null, function(json) {
        var panel = this_button.closest(".panel_layout");
        irddevice = json;
        fill_8200_Panel(panel, json);
    })
    .fail(function() {
        this_button.removeClass("btn-success");
        this_button.removeClass("btn-danger");
        this_button.html(this_button.html().replace("(NO COMM)", "") + "(NO COMM)")
    })
    var qt_device = panels[id].devices[1];
    $.getJSON("/qtlbands/"+qt_device.id+"/output/"+panels[id].controlled_output, null, function(json) {
        var panel = this_button.closest(".panel_layout");
        //update panel data
        qt_device = json;
        //clear no comm
        //fill form with data
        fill_qt_panel(panel, json);
    })
    .fail(function() {
        this_button.removeClass("btn-success");
        this_button.removeClass("btn-danger");
        this_button.html(this_button.html().replace("(NO COMM)", "") + "(NO COMM)")
    })
});


// This allows the blur trigger to send the data update because by default changing a select will not blur
$('.full_8200_with_qt .input, .full_8200_with_qt .qt_input,.full_8200_with_qt  .port,.full_8200_with_qt  .service').on('change', function (e) {
    if($(this).is(":focus")){
        $(this).blur();
    }
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.full_8200_with_qt .input').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(valueSelected == panels[id].devices[0].input) return; //dont update if field didnt change
    panels[id].devices[0].input = valueSelected;

    $.post("/ird8200s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {}, "json");
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.full_8200_with_qt .qt_input').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    panels[id].devices[0].input = valueSelected;
    console.log(panels[id].name + " input changed to " + valueSelected )
    var qt_device = panels[id].devices[1];
    // $.post("/ird8200s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {}, "json");
    $.post("/qtlbands/"+qt_device.id+"/output/"+ panels[id].controlled_output, {input: valueSelected}, function(json) {});
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.full_8200_with_qt .port').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(valueSelected == panels[id].devices[0].port) return; //dont update if field didnt change
    panels[id].devices[0].port = valueSelected;

    $.post("/ird8200s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {}, "json");
});

$('.full_8200_with_qt .satFreq').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(valueSelected * 1000 == panels[id].devices[0].freq) return; //dont update if field didnt change
    panels[id].devices[0].freq = valueSelected * 1000;
    $.post("/ird8200s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) { }, "json");
});

$('.full_8200_with_qt .symRate').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var id = getPanelID(panel);
    if(id < 0) return;
    if(valueSelected * 1000*1000 == panels[id].devices[0].symRate) return; //dont update if field didnt change
    panels[id].devices[0].symRate = valueSelected * 1000*1000;
    $.post("/ird8200s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {}, "json");
});

$('.full_8200_with_qt input.modulation[type=radio]').on('change', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(valueSelected  == panels[id].devices[0].modulation) return; //dont update if field didnt change
    panels[id].devices[0].modulation = valueSelected;
    $.post("/ird8200s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {  }, "json");
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.full_8200_with_qt .service').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    panels[id].devices[0].current_service = valueSelected;
    $.post("/ird8200s/"+panels[id].devices[0].id+"/services", panels[id].devices[0], function(json) {}, "json");
});

// $('.full_8200_with_qt .status').click();
