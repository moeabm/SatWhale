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
    $.getJSON("/ird8200s/"+id, {data: "status"}, function(json) {
        console.log(json);
        this_button.html(this_button.html().replace("(NO COMM)", "") );

        if(json.lock == true){
            this_button.addClass("btn-success");
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
