
var shared_functions = {
  findPreset: function(presets, presetName){
    var i = 0;
    for(i = 0; i < presets.length; i++ ){
      if(presets[i].presetName === presetName ){
        return presets[i];
      }
    }
    return null;
  }
}

module.exports = shared_functions;
