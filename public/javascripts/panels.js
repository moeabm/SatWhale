//shared socket functions
var socket = io('http://10.40.10.67:3000');
socket.on('connect', function(){
    console.log("connected to socket io");
    $('.status').click();
});

socket.on('disconnect', function(){
    console.log("disconnected from socket io");
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

