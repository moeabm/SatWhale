//shared socket functions
var socket = io('http://10.40.10.67:3000');
socket.on('connect', function(){
    console.log("connected to socket io");
    $('.status').click();
});

socket.on('disconnect', function(){
    console.log("disconnected from socket io");
});


socket.on('ird8200', function(data){
    console.log("2got updated ird8200 id: "+ data.id);
});

//shared jquery listeners
$('.input').on('change', function (e) {
    var optionSelected = $("option:selected", this);
    var valueSelected = this.value;
    var selectedText = optionSelected.text().toLowerCase();
    if(["sat", "ip"].indexOf(selectedText) > -1 ){
        $(this).closest(".panel_layout").find(".hideable").hide();
        $(this).closest(".panel_layout").find("."+selectedText).show();
    }
    else{
        $(this).closest(".panel_layout").find(".hideable").hide();
    }
});

//shared functions
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
