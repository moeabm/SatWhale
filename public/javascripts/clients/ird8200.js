var socket = io('http://localhost:3000');
socket.on('connect', function(){
    console.log("connected");
    
});
socket.on('device', function(data){
    console.log(data);
    var panel = $("#panel_"+data.id);
    panel.find(".status").click();
});
socket.on('disconnect', function(){});

function fillPanel(panel, data){
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
    if(panel.find(".modulation").val() != data.modulation)
        panel.find(".modulation").filter("[value="+data.modulation+"]").prop('checked', true);
}

$('.status').on('click', function (e) {
    var this_button = $(this);
    this_button.removeClass("btn-success");
    this_button.removeClass("btn-danger");
    try{
        var id = parseInt($(this).closest(".panel_layout").attr('id').replace("panel_", "") );
        if(isNaN(id)) throw new Error("bad_id");
        // console.log(id);
    }
    catch(error){
        console.error($(this).closest(".panel_layout").attr('id') + " does not have the proper id syntax 'panel_<id>'");
        return;
    }
    $.getJSON("/ird8200s/"+id, null, function(json) {
        console.log(json);
        var panel = this_button.closest(".panel_layout");
        panel.data("device", json);
        this_button.html(this_button.html().replace("(NO COMM)", "") );

        if(json.lock == true){
            this_button.addClass("btn-success");
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
        else{
            this_button.addClass("btn-danger");
            panel.find('.service').find('option').remove().end().append('<option></option>');
        }
        fillPanel(panel, json);
    })
    .done(function() {
        // console.log( "second success" );
    })
    .fail(function() {
        this_button.removeClass("btn-success");
        this_button.removeClass("btn-danger");
        this_button.html(this_button.html().replace("(NO COMM)", "") + "(NO COMM)")
        // console.log( "error" );
    })
    .always(function() {
        // console.log( "complete" );
    });
});


$('.input').on('change', function (e) {
    var panel = $(this).closest(".panel_layout");
    var optionSelected = $("option:selected", this);
    var valueSelected = this.value;
    var selectedText = optionSelected.text().toLowerCase();
    var device = panel.data("device");
    device.input = valueSelected;
    try{
        var id = parseInt($(this).closest(".panel_layout").attr('id').replace("panel_", "") );
        if(isNaN(id)) throw new Error("bad_id");
        // console.log(id);
    }
    catch(error){
        console.error($(this).closest(".panel_layout").attr('id') + " does not have the proper id syntax 'panel_<id>'");
        return;
    }

    $.post("/ird8200s/"+id, device, function(json) {
        // fillPanel(panel, json);
        // console.log(json)
    }, "json");
});


$('.port').on('change', function (e) {
    var panel = $(this).closest(".panel_layout");
    var optionSelected = $("option:selected", this);
    var valueSelected = this.value;
    var selectedText = optionSelected.text().toLowerCase();
    var device = panel.data("device");
    device.port = valueSelected;
    try{
        var id = parseInt($(this).closest(".panel_layout").attr('id').replace("panel_", "") );
        if(isNaN(id)) throw new Error("bad_id");
        // console.log(id);
    }
    catch(error){
        console.error($(this).closest(".panel_layout").attr('id') + " does not have the proper id syntax 'panel_<id>'");
        return;
    }

    $.post("/ird8200s/"+id, device, function(json) {
        // fillPanel(panel, json);
        // console.log(json)
    }, "json");
});

$('.satFreq').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var device = panel.data("device");
    device.freq = valueSelected * 1000;
    try{
        var id = parseInt(panel.attr('id').replace("panel_", "") );
        if(isNaN(id)) throw new Error("bad_id");
        // console.log(id);
    }
    catch(error){
        console.error($(this).closest(".panel_layout").attr('id') + " does not have the proper id syntax 'panel_<id>'");
        return;
    }

    $.post("/ird8200s/"+id, device, function(json) {
        // fillPanel(panel, json);
    }, "json");
});

$('.symRate').on('blur', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var device = panel.data("device");
    device.symRate = valueSelected * 1000*1000;
    try{
        var id = parseInt(panel.attr('id').replace("panel_", "") );
        if(isNaN(id)) throw new Error("bad_id");
        console.log(id);
    }
    catch(error){
        console.error($(this).closest(".panel_layout").attr('id') + " does not have the proper id syntax 'panel_<id>'");
        return;
    }

    $.post("/ird8200s/"+id, device, function(json) {
        // fillPanel(panel, json);
    }, "json");
});

$('input.modulation[type=radio]').on('change', function (e) {
    var panel = $(this).closest(".panel_layout");
    var valueSelected = $(this).val();
    var device = panel.data("device");
    console.log(device);
    device.modulation = valueSelected;
    try{
        var id = parseInt(panel.attr('id').replace("panel_", "") );
        if(isNaN(id)) throw new Error("bad_id");
        console.log(id);
    }
    catch(error){
        console.error($(this).closest(".panel_layout").attr('id') + " does not have the proper id syntax 'panel_<id>'");
        return;
    }

    $.post("/ird8200s/"+id, device, function(json) {
        // fillPanel(panel, json);
    }, "json");
});

$('.status').click();
