
$('.qt_simple .status').on('click', function (e) {
    var this_button = $(this);
    var id = getPanelID($(this).closest(".panel_layout"));
    if(id < 0) return; // exit if panel id not found
    console.log("status pressed: " + id);
    // console.log(getPanel(id));
    var qt_device = getPanel(id).devices[0];
    this_button.removeClass("btn-success");
    $.getJSON("/qtlbands/"+qt_device.id, null, function(json) {
        this_button.addClass("btn-success");
        qt_device = json;
    })
    .fail(function(error) {
        this_button.html(this_button.html().replace("(NO COMM)", "") + "(NO COMM)")
    })
});


// This allows the blur trigger to send the data update because by default changing a select will not blur
$('.qt_simple .output,.qt_simple .qt_input').on('change', function (e) {
    if($(this).is(":focus")){
        $(this).blur();
    }
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.qt_simple .output').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(!(valueSelected > 0) ) return; // value is not valid
    // console.log(getPanel(id));
    var qt_device = getPanel(id).devices[0];
    $.get("/qtlbands/"+qt_device.id+"/output/"+ valueSelected, null, function(json) {
        panel.find(".qt_input").val(json.input);
        // console.log(json)
    }, "json");
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.qt_simple .qt_input').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    // var qt_device = panels[id].devices[0];
    var qt_device = getPanel(id).devices[0];
    console.log(qt_device.name + " input changed to " + valueSelected )
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.qt_simple .take').on('click', function (e) {
    var panel = $(this).closest(".panel_layout");
    var outputValue = panel.find(".output").val();
    var inputValue = panel.find(".qt_input").val();
    // var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(!(outputValue > 0) ) return; // value is not valid
    if(!(inputValue > 0) ) return; // value is not valid
    // var qt_device = panels[id].devices[0];
    var qt_device = getPanel(id).devices[0];
    $.post("/qtlbands/"+qt_device.id+"/output/"+ outputValue, {input: inputValue}, function(json) {});
});

$('.qt_simple .output').focus().change().blur();