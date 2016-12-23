
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
