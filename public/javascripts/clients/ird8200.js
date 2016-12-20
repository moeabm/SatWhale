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
            panel.find(".input").val(json.input).change();
            panel.find(".port").val(json.port).change();
        }
        else{
            this_button.addClass("btn-danger");

        }
    })
    .done(function() {
        // console.log( "second success" );
    })
    .fail(function() {
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
        console.log("posted")
    }, "json");
});
