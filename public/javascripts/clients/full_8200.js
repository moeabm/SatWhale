
socket.on('ird8200', function(data){
    console.log("got updated ird8200 id: "+ data.id);
    $.each(panels, function(index, panel){
        var panels_with_device = $.grep(panel.devices, function(device){ return device.id == data.id; });
        if(panels_with_device.length > 0){
            var panel_layout = $("#panel_"+panel.id);
            fill_8200_Panel(panel_layout, data)
        }
    })
});

function fill_8200_Panel(panel, data){
    panel.find(".status").html(panel.find(".status").html().replace("(NO COMM)", "") );
    if(data.lock == true){
        panel.find(".status").addClass("btn-success");
        panel.find(".status").removeClass("btn-danger");
        getAndFillServices(panel, data.id);
    }
    else{
        panel.find(".status").addClass("btn-danger");
        panel.find(".status").removeClass("btn-success");
        panel.find('.service').find('option').remove().end().append('<option></option>');
    }
    if(panel.find(".input").val() != data.input)
        panel.find(".input").val(data.input).change();
    if(panel.find(".port").val() != data.port)
        panel.find(".port").val(data.port).change();
    if(panel.find(".satFreq").val() != data.freq/1000)
        panel.find(".satFreq").val(data.freq/1000).change();
    if(panel.find(".symRate").val() != data.symRate/1000)
        panel.find(".symRate").val(data.symRate/1000000).change();
    if(panel.find(".symRate").val() != data.symRate/1000)
        panel.find(".symRate").val(data.symRate/1000000).change();
    if(panel.find(".modulation:checked").val() != data.modulation)
        panel.find(".modulation").filter("[value="+data.modulation+"]").prop('checked', true);
}

function getAndFillServices(panel, id){
    console.log("getting services " + id);
    $.getJSON("/ird8200s/"+id+"/services", function(json) {
        panel.find('.service').find('option').remove().end().append('<option></option>');
        $.each(json.services, function (i, item) {
            panel.find('.service').append($('<option>', { 
                value: i,
                text : item.value 
            }));
        });
        panel.find('.service').val(json.selected);
    });
}

function getPanelID(panel_layout){

    try{
        var id = parseInt(panel_layout.attr('id').replace("panel_", "") );
        if(isNaN(id)) throw new Error("bad_id");
        return id;
    }
    catch(error){
        console.error(panel_layout.attr('id') + " does not have the proper id syntax 'panel_<id>'");
        return -1;
    }
}

$('.full_8200 .status').on('click', function (e) {
    var this_button = $(this);
    var id = getPanelID($(this).closest(".panel_layout"));
    if(id < 0) return; // exit if panel id not found

    $.each(panels[id].devices, function(k, v){
        $.getJSON("/ird8200s/"+v.id, null, function(json) {
            var panel = this_button.closest(".panel_layout");
            //update panel data
            panels[id].devices[0] = json;
            //clear no comm
            //fill form with data
            fill_8200_Panel(panel, json);
        })
        .fail(function() {
            this_button.removeClass("btn-success");
            this_button.removeClass("btn-danger");
            this_button.html(this_button.html().replace("(NO COMM)", "") + "(NO COMM)")
        })
    })
   
});


// This allows the blur trigger to send the data update because by default changing a select will not blur
$('.full_8200 .input,.full_8200  .port,.full_8200  .service').on('change', function (e) {
    if($(this).is(":focus")){
        $(this).blur();
    }
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.full_8200 .input').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    panels[id].devices[0].input = valueSelected;
    $.post("/ird8200s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {}, "json");
});

// We use blur instead of change because change could be called programatically.
// We only want to trigger an update from users on this page and not from updates from the server.
$('.full_8200 .port').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(valueSelected == panels[id].devices[0].port) return; //dont update if field didnt change
    panels[id].devices[0].port = valueSelected;

    $.post("/ird8200s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {}, "json");
});

$('.full_8200 .satFreq').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    if(valueSelected * 1000 == panels[id].devices[0].freq) return; //dont update if field didnt change
    panels[id].devices[0].freq = valueSelected * 1000;
    $.post("/ird8200s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) { }, "json");
});

$('.full_8200 .symRate').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var id = getPanelID(panel);
    if(id < 0) return;
    if(valueSelected * 1000*1000 == panels[id].devices[0].symRate) return; //dont update if field didnt change
    panels[id].devices[0].symRate = valueSelected * 1000*1000;
    $.post("/ird8200s/"+panels[id].devices[0].id, panels[id].devices[0], function(json) {}, "json");
});

$('.full_8200 input.modulation[type=radio]').on('change', function (e) {
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
$('.full_8200 .service').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = this.value;
    var selectedText = $("option:selected", this).text().toLowerCase();
    var id = getPanelID(panel);
    if(id < 0) return; // exit if panel id not found
    panels[id].devices[0].current_service = valueSelected;
    $.post("/ird8200s/"+panels[id].devices[0].id+"/services", panels[id].devices[0], function(json) {}, "json");
});

// $('.full_8200 .status').click();
