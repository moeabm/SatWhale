
module.exports = {

  valueTypes : {
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
  },
  getOid: function(session, oid, callback) {
      try{
          session.get({
              oid: oid
          }, callback);
      }
      catch (e){
          callback(e);
      }
  },

  setOid: function(session, oid, value, type, callback) {
      try{
          session.set({
              oid: oid,
              value: value,
              type: type
          }, callback );
      }
      catch (e){
          callback(e);
      }
  },
	INTEGER : 2,
	BITSTRING : 3,
	BITS : 4,
	OCTETSTRING : 4,
	NULL : 5,
	OID : 6,
	SEQUENCE : 48,
	SEQUENCEOF : 48,
	VARBIND : 48,
	IPADDRESS : 64,
	COUNTER32 : 65,
	GAUGE32 : 66,
	UNSIGNED32 : 66,
	TIMETICKS : 67,
	OPAQUE : 68,
	COUNTER64 : 70,
	NO_SUCH_OBJECT : 128,
	NO_SUCH_INSTANCE : 129,
	END_OF_MIB_VIEW : 130,
	PDU : 320
}
