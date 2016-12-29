socket.on('qt_lband', function(data){
    console.log("got updated qtlband id: "+ data.id);
    console.log(data);
    $.each(panels, function(index, panel){
        var panels_with_device = $.grep(panel.devices, function(device){ return device.id == data.id; });
        if(panels_with_device.length > 0){
            var panel_layout = $("#panel_"+panel.id);
            fill_qt_panel(panel_layout, data)
        }
    })
});


function fill_qt_panel(panel, data){
    if(panel.find(".output").val() != data.output && !panel.find(".output").attr('readonly') )
        panel.find(".output").val(data.output).change();
    if(panel.find(".output").val() == data.output && panel.find(".qt_input").val() != data.input)
        panel.find(".qt_input").val(data.input).change();
}

$('.qt_simple .status').on('click', function (e) {
    var this_button = $(this);
    var id = getPanelID($(this).closest(".panel_layout"));
    if(id < 0) return; // exit if panel id not found
    console.log("status pressed: " + id);
    console.log(panels[id]);
    var qt_device = panels[id].devices[0];
    this_button.removeClass("btn-success");
    $.getJSON("/qtlbands/"+qt_device.id, null, function(json) {
        this_button.addClass("btn-success");
        panels[id].devices[0] = json;
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
    var qt_device = panels[id].devices[0];
    $.get("/qtlbands/"+qt_device.id+"/output/"+ valueSelected, null, function(json) {
        panel.find(".qt_input").val(json.input);
        console.log(json)
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
    var qt_device = panels[id].devices[0];
    console.log(panels[id].name + " input changed to " + valueSelected )
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
    var qt_device = panels[id].devices[0];
    $.post("/qtlbands/"+qt_device.id+"/output/"+ outputValue, {input: inputValue}, function(json) {});
});

$('.qt_simple .output').focus().change().blur();