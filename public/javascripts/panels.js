//shared socket functions
var host = "http://"+window.location.hostname;
var socket = io(host+':3000');
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


$(".curtain").on('click', function(e){
    var curtain = $(".curtain").hide();
    $(".cPanel-full").removeClass("cPanel-full");
});
$('.menu-toggle').on('click', function (e) {
    console.log("toggle clicked");
    var cPanel = $(this).closest(".cPanel");
    var curtain = $(".curtain").show();
    cPanel.addClass("cPanel-full");
    cPanel.find(".get-next").click();
});

$('button.get-next').on('click', function (e) {
    var cell = $(this).closest("td");
    var row = $(this).closest("tr");
    var time = row.find("td.time").text();
    var nextRun = later.schedule( later.parse.cron(time, true) ).next(1)
    cell.find(".value").html(printDate(nextRun));
});