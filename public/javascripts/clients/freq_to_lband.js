
var LoKuBand = 10750.0;
var LoCBand = 5150.0;

var calc_lband = function(panel_layout){
    var freq = parseFloat(panel_layout.find(".freq").val() || 0);
    var lbandFreq = 0;
    if(panel_layout.find(".band").val() == "Ku")
        lbandFreq  = Math.abs(freq - LoKuBand);
    else
        lbandFreq  = Math.abs(freq - LoCBand);

    panel_layout.find(".lfreq").val(Math.round(lbandFreq * 1000) / 1000);
}
$('.freq_to_lband .freq').on('input', function (e) {
    $(this).val($(this).val().replace(/[^0-9.]/g, ""))
    calc_lband($(this).closest(".panel_layout"));
});
// $('.freq_to_lband .band').on('input', function (e) {
//     $(this).closest(".panel_layout").find(".freq").val("");
// });

var calc_band = function(panel_layout){
    var lfreq = parseFloat(panel_layout.find(".lfreq").val() || 0);
    var freq = 0;
    if(panel_layout.find(".band").val() == "Ku")
        freq  = Math.abs(lfreq + LoKuBand);
    else
        freq  = Math.abs(lfreq + LoCBand);
    panel_layout.find(".freq").val(Math.round(freq * 1000) / 1000);
}
$('.freq_to_lband .lfreq').on('input', function (e) {
    $(this).val($(this).val().replace(/[^0-9.]/g, ""))
    calc_band($(this).closest(".panel_layout"));
});

$('.freq_to_lband .band').on('input', function (e) {
    calc_band($(this).closest(".panel_layout"));
});
