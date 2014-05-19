exports.config = { ipaddr         : '192.168.1.72'
                 , portno         : 8885
                 };

exports.props  = { uuid           : { types: [ 12, 13, 32, 52, 62, 72 ], abbrev: 'a' }
                 , slaveId        : { types: [ 12, 13, 32, 52, 62, 72 ], abbrev: 'b' }
                 , name           : { types: [ 12, 13, 32, 52, 62, 72 ], abbrev: 'c' }
                 , eventState     : { types: [ 12, 13,     52,     72 ], abbrev: 'd' }
                 , isClosed       : { types: [ 12, 13,     52,        ], abbrev: 'e' }
                 , isOpen         : { types: [ 12, 13,     52,        ], abbrev: 'f' }
                 , hasMoved       : { types: [ 12, 13                 ], abbrev: 'g' }
                 , tempEventState : { types: [ 12,     32, 52, 62, 72 ], abbrev: 'h' }
                 , moistureState  : { types: [     13, 32, 52, 62, 72 ], abbrev: 'i' }
                 , temperature    : { types: [ 12, 13, 32, 52, 62, 72 ], abbrev: 'j' }
                 , lowTh          : { types: [ 12, 13, 32, 52, 62, 72 ], abbrev: 'k' }
                 , highTh         : { types: [ 12, 13, 32, 52, 62, 72 ], abbrev: 'l' }
                 , moisture       : { types: [     13, 32, 52, 62, 72 ], abbrev: 'm' }
                 , target         : { types: [                 62     ], abbrev: 'n' }
                 , fanOn          : { types: [                 62     ], abbrev: 'o' }
                 , hvacOn         : { types: [                 62     ], abbrev: 'p' }
                 , rssi           : { types: [ 12, 13, 32, 52, 62, 72 ], abbrev: 'q' }
                 , txpwr          : { types: [ 12, 13, 32, 52, 62, 72 ], abbrev: 'r' }
                 , waterDetected  : { types: [         32             ], abbrev: 's' }
                 };
