var config = require('./kumoapp-params').config
  , URL    = 'http://' + config.ipaddr + ':' + config.portno + '/';

var i, params, prop, props, type, types;

props = { name           : [ 12, 13, 32, 52, 53, 62, 72 ]
        , slaveId        : [ 12, 13, 32, 52, 53, 62, 72 ]
        , uuid           : [ 12, 13, 32, 52, 53, 62, 72 ]
        , eventState     : [ 12, 13,     52, 53,     72 ]
        , isClosed       : [ 12, 13,     52, 53         ]
        , isOpen         : [ 12, 13,     52, 53         ]
        , hasMoved       : [ 12, 13                     ]
        , tempEventState : [ 12,     32, 52,     62, 72 ]
        , moistureState  : [     13, 32, 52,     62, 72 ]
        , temperature    : [ 12, 13, 32, 52,     62, 72 ]
        , lowTh          : [ 12, 13, 32, 52,     62, 72 ]
        , highTh         : [ 12, 13, 32, 52,     62, 72 ]
        , moisture       : [     13, 32, 52,     62, 72 ]
        , target         : [                     62     ]
        , fanOn          : [                     62     ]
        , hvacOn         : [                     62     ]
        , rssi           : [ 12, 13, 32, 52, 53, 62, 72 ]
        , txpwr          : [ 12, 13, 32, 52, 53, 62, 72 ]
        , waterDetected  : [         32                 ]
        };

params = {};
for (prop in props) if (props.hasOwnProperty(prop)) {
  types = props[prop];
  for (i = 0; i < types.length; i++) {
    type = types[i];

    if (!params[type]) params[type] = '"type":+' + type;
    params[type] += ',"' + prop + '":+' + "'tag." + prop + "+'";
  }
}
for (type in params) if (params.hasOwnProperty(type)) {
  console.log('<#tags_' + type + '_N#>.forEach(function(tag) {');
  console.log('  tag.updated = function() {');
  console.log('    KumoApp.httpCall("' + URL + '", "PUT", ' + "'{" + params[type] + "}'" + ');');
  console.log('  };');
  console.log('});');
  console.log('');
}
