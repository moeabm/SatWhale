
$(".set-preset").on('click', function(e){
  var deviceID = $(this).closest(".preset-table-inner").attr("value");
  var presetName = $(this).attr("name"); 
  var this_button = $(this); 
  console.log($(this).attr("name")) 
  $.ajax({
    url: '/presets/'+deviceID,
    "method": "PUT",
    "headers": {
      "accept": "application/vnd.api+json",
      "content-type": "application/json",
      "cache-control": "no-cache",
    },
    "processData": false,
    data: JSON.stringify({"presetName": presetName}),
    success: function(result) {
      this_button.closest(".cPanel").find("h4.presetName").html(presetName);
      this_button.closest(".cPanel").find("input.presetName").val(presetName);
      console.log(this_button.closest(".cPanel"));
    }
  });
});

$(".delete-preset").on('click', function(e){
  var row = $(this).closest("tr");
  var deviceID = $(this).closest(".preset-table-inner").attr("value");
  var presetName = $(this).attr("name"); 
  console.log($(this).attr("name")) 
  $.ajax({
    url: '/presets/'+deviceID,
    "method": "DELETE",
    "headers": {
      "accept": "application/vnd.api+json",
      "content-type": "application/json",
      "cache-control": "no-cache",
    },
    "processData": false,
    data: JSON.stringify({"presetName": presetName}),
    success: function(result) {
        row.remove();
    }
  });
});