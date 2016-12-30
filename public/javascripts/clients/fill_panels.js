
//===================================================================//
//                           Shared Functions                        //
//                                                                   //
//when new data comes in fill all panels with 8200 devices attached  //
//                                                                   //
//===================================================================//


function getPanel(id){
  var found_panel = null
  $.each(panels, function(index, panel){
    if(panel.id == id){
      found_panel = panel;
    }
    if(typeof panel.subpanels !== "undefined"){
      $.each(panel.subpanels, function(index, panel){
        if(panel.id == id){
        // console.log(panel.id);
        // console.log(id);
          found_panel = panel;
        }
      });
    }
  });
  if(found_panel == null)
    console.error( "no panels found with id " + id );
  return found_panel;
}

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

function getPanelsWithDevice(id){
  var found_panels = [];
  $.each(panels, function(index, panel){
    var panels_with_device = $.grep(panel.devices|| {id: null}, function(device){ return device.id == id; });
    if(panels_with_device.length > 0){
      found_panels.push(panel);
    }
    if(typeof panel.subpanels !== "undefined"){
      $.each(panel.subpanels, function(index, panel){
        var panels_with_device = $.grep(panel.devices|| {id: null}, function(device){ return device.id == id; });
        if(panels_with_device.length > 0){
        // console.log(panel.id);
        // console.log(id);
          found_panels.push(panel);
          // found_panels[id] = panel;
          // found_panel = panel;
        }
      });
    }
  });
  if(found_panels.length == 0)
    console.error( "no panels found with device id " + id );
  return found_panels;
}
//===================================================================//
//                           Ericsson 8200                           //
//                                                                   //
//when new data comes in fill all panels with 8200 devices attached  //
//                                                                   //
//===================================================================//
socket.on('ird8200', function(data){
    console.log("got updated ird8200 id: "+ data.id);
    var iPanels = getPanelsWithDevice(data.id);
    for(i = 0 ; i < iPanels.length; i++ ){
        var panel = iPanels[i];
        var panel_layout = $("#panel_"+panel.id);
        fill_8200_Panel(panel_layout, data);
    }
});

// fill 8200 panel with data  
function fill_8200_Panel(panel, data){
    panel.closest(".cPanel").css("background-color", getPanel(getPanelID(panel)).color);
    panel.find(".status").html(panel.find(".status").html().replace("(NO COMM)", "") );
    if(data.lock == true){
        panel.find(".status").addClass("btn-success");
        panel.find(".status").removeClass("btn-danger");
        getAndFill8200Services(panel, data.id);
    }
    else{
        panel.find(".status").addClass("btn-danger");
        panel.find(".status").removeClass("btn-success");
        panel.find('.service').find('option').remove().end().append('<option></option>');
    }
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
    if(panel.find(".modulation:checked").val() != data.modulation)
        panel.find(".modulation").filter("[value="+data.modulation+"]").prop('checked', true);
}


// fill 8200 panel with services  
function getAndFill8200Services(panel, id){
    console.log("getting services " + id);
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

//===================================================================//
//                           Quintech QRM2500                        //
//                                                                   //
// When new data comes in fill all panels with qt devices attached   //
//                                                                   //
//===================================================================//
socket.on('qt_lband', function(data){
    console.log("got updated qtlband id: "+ data.id);

    var iPanels = getPanelsWithDevice(data.id);
    for(i = 0 ; i < iPanels.length; i++ ){
        var panel = iPanels[i];
        var panel_layout = $("#panel_"+panel.id);
        fill_qt_panel(panel_layout, data)
    }
});


// fill qt panel with data  
function fill_qt_panel(panel, data){
    panel.closest(".cPanel").css("background-color", getPanel(getPanelID(panel)).color);
    if(panel.find(".output").val() != data.output && !panel.find(".output").attr('readonly') )
        panel.find(".output").val(data.output).change();
    if(panel.find(".output").val() == data.output && panel.find(".qt_input").val() != data.input)
        panel.find(".qt_input").val(data.input).change();
}
