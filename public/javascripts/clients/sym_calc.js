
var calc_symrate = function(panel_layout){
    var dataRate = parseFloat(panel_layout.find(".dataRate").val() || 0);
    var mod = parseFloat(panel_layout.find(".mod").val() || 0);
    var fec = parseFloat(panel_layout.find(".fec").val() || 0);
    var CRrs = 188 / 204
    var answer = dataRate/(mod*fec*CRrs);
    panel_layout.find(".symRate").val(Math.round(answer * 1000) / 1000);
}
$('.sym_calc .dataRate, .sym_calc .mod, .sym_calc .fec').on('input', function (e) {
    $(this).val($(this).val().replace(/[^0-9.]/g, ""))
    var id = getPanelID($(this).closest(".panel_layout"));
    if(id < 0) return; // exit if panel id not found
    calc_symrate($(this).closest(".panel_layout"));
});
