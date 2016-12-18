"use strict";
var snmp = require("snmp-native");
var valueTypes = {
    3: "BITSTRING",
    65: "COUNTER32",
    70: "COUNTER64",
    130: "END_OF_MIB_VIEW",
    2: "INTEGER",
    64: "IPADDRESS",
    129: "NO_SUCH_INSTANCE",
    128: "NO_SUCH_OBJECT",
    5: "NULL",
    4: "OCTETSTRING",
    6: "OID",
    68: "OPAQUE",
    320: "PDU",
    67: "TIMETICKS",
    66: "UNSIGNED32",
    48: "VARBIND"
};

var INTEGER = 2;
var BITSTRING = 3;
var BITS = 4;
var OCTETSTRING = 4;
var NULL = 5;
var OID = 6;
var SEQUENCE = 48;
var SEQUENCEOF = 48;
var VARBIND = 48;
var IPADDRESS = 64;
var COUNTER32 = 65;
var GAUGE32 = 66;
var UNSIGNED32 = 66;
var TIMETICKS = 67;
var OPAQUE = 68;
var COUNTER64 = 70;
var NO_SUCH_OBJECT = 128;
var NO_SUCH_INSTANCE = 129;
var END_OF_MIB_VIEW = 130;
var PDU = 320;

// String oidGetLocked = "enterprises.1773.1.3.208.2.2.2.0";         //  1 get LOCKED
// String oidGetPower = "enterprises.1773.1.3.208.2.2.3.0";         //  2 get POWER
//
// String oidSetInput = "enterprises.1773.1.3.208.2.1.4.0";    //   interger: 1-4 input port source
// String oidSetLowFreq = "enterprises.1773.1.3.208.2.2.15.1.2." + port;  //   5 INTEGER: 27780000 lnb lo freq symbol rate
// String oidSetSatFreq = "enterprises.1773.1.3.208.2.2.15.1.3." + port;  //   4 INTEGER: 4080000 sat freq
// String oidSetSymRate = "enterprises.1773.1.3.208.2.2.15.1.4." + port;  //   3 INTEGER: 5150000 symbol rate
// String oidSetModulat = "enterprises.1773.1.3.208.2.2.15.1.5." + port;  //   6 INTEGER: 0 Modulation 0=DVB-S 2=DVB-S2 or 8PSK 1=DVB-S2??
//
// String oidSetService = "enterprises.1773.1.3.208.4.1.2.0";        //   7 INTEGER: service array
// String oidGetService = "enterprises.1773.1.3.208.4.1.1.1.2";      //  8 STRING: gets service array
// String oidSetAudioSer;
// String oidGetAudioSer;

var IRD8200 = function (addr, clr) {
    //variables that are not accessible outside this scope
    var address = addr,
        color = clr,
        session = new snmp.Session({
            host: addr
        }),
        lock = false;

    return {
        //public variables
        name: "New Device",

        //public functions
        getAddress: function () {
            return address;
        },
        setAddress: function (addr) {
            // pvar = "something";

            address = color;
            address = addr;
            session = new snmp.Session({
                host: address
            });
        },

        isLocked: function () {
            return lock;
        },
        getLock: function (callback) {
            var oid = "enterprises.1773.1.3.208.2.2.2.0";
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // interger: 1-4 input port source
        setPort: function (port) {
            var oid = "enterprises.1773.1.3.208.2.1.4.0";
            session.set({
                oid: oid,
                value: port,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getPort: function ( callback) {
            var oid = "enterprises.1773.1.3.208.2.1.4.0";
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 5150000 lnb lo freq
        setLOFreq: function (freq, port) {
            var oid = "enterprises.1773.1.3.208.2.2.15.1.2." + port;
            session.set({
                oid: oid,
                value: freq,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getLOFreq: function (port, callback) {
            var oid = "enterprises.1773.1.3.208.2.2.15.1.2." + port;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 4080000 sat freq
        setSatFreq: function (freq, port) {
            var oid = "enterprises.1773.1.3.208.2.2.15.1.3." + port;
            session.set({
                oid: oid,
                value: freq,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getSatFreq: function (port, callback) {
            var oid = "enterprises.1773.1.3.208.2.2.15.1.3." + port;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 27780000 symbol rate
        setSymRate: function (rate, port) {
            var oid = "enterprises.1773.1.3.208.2.2.15.1.4." + port;
            session.set({
                oid: oid,
                value: rate,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getSymRate: function (port, callback) {
            var oid = "enterprises.1773.1.3.208.2.2.15.1.4." + port;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: 0 Modulation 0=DVB-S 2=DVB-S2 or 8PSK 1=DVB-S2??
        setModulation: function (mod, port) {
            var oid = "enterprises.1773.1.3.208.2.2.15.1.5." + port;
            session.set({
                oid: oid,
                value: mod,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getModulation: function (port, callback) {
            var oid = "enterprises.1773.1.3.208.2.2.15.1.5." + port;
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        // INTEGER: service array
        setService: function (service) {
            var oid = "enterprises.1773.1.3.208.4.1.2.0";
            session.set({
                oid: oid,
                value: service,
                type: INTEGER
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        getServiceArray: function (callback) {
            var oid = "enterprises.1773.1.3.208.4.1.1.1.2";
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    callback(varbinds);
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },

        testSnmp: function () {
            var oid = ".1.3.6.1.2.1.25.1.1.0";
            session.get({
                oid: oid
            }, function (error, varbinds) {
                if (error) {
                    console.log(oid + ': ' + error);
                } else {
                    console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + valueTypes[varbinds[0].type] + ')');
                }
            });
        },
        goodbye: function () {
            return 'goodbye!';
        }
    };
};

module.exports = IRD8200;
