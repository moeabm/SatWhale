
var shared_functions = {
  findPreset: function(presets, presetName){
    var i = 0;
    for(i = 0; i < presets.length; i++ ){
      if(presets[i].presetName === presetName ){
        return presets[i];
      }
    }
    return null;
    },
    freqToLO: function(freq) {
        if (freq < 12700000 && freq > 11700000) return 10750000; //Hz Ku range
        if (freq < 4200000 && freq > 3625000) return 5150000; //Hz C range
        console.log("Invalid frequency: " + freq + "Hz");
        return -1;
    }
}

module.exports = shared_functions;
