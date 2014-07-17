var events      = require('events')
  , mathjs      = (require('mathjs'))()
  , util        = require('util')
  ;


var DEFAULT_LOGGER = { error   : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , warning : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , notice  : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , info    : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     , debug   : function(msg, props) { console.log(msg); if (!!props) console.log(props);             }
                     };


var KumoAppTSRP = function(params) {
  var k;

  var self = this;

  if (!(self instanceof KumoAppTSRP)) return new KumoAppTSRP(params);

  if (!params) params = {};
  if (!params.types) throw new Error('parameters must include "types"');
  self.types = params.types;

  self.logger = params.logger  || {};
  for (k in DEFAULT_LOGGER) {
    if ((DEFAULT_LOGGER.hasOwnProperty(k)) && (typeof self.logger[k] === 'undefined'))  self.logger[k] = DEFAULT_LOGGER[k];
  }

  self.tags = {};
  self.reqNo = 0;

  setInterval(function() {
    var diff, now, uuid;

    now = new Date().getTime();
    for (uuid in self.tags) if ((self.tags.hasOwnProperty(uuid)) && (!!self.tags[uuid].packet)) {
      diff = now - self.tags[uuid].lastSeen;
      if (diff >= (32 * 60 * 1000)) {
        delete(self.tags[uuid].packet);
        continue;
      }

      self.emit('packet', new Buffer(JSON.stringify(self.tags[uuid].packet)));
    }
  }, 45 * 1000);
};
util.inherits(KumoAppTSRP, events.EventEmitter);


KumoAppTSRP.prototype.toTSRP = function(props) {
  var f, info, message, now, prop, protos, type, types;

  var self = this;

  types = self.types;

  if (typeof props['0'] !== 'undefined') props.type = props['0'];
  for (type in types) if (types.hasOwnProperty(type)) if (typeof props[types[type].abbrev] !== 'undefined') {
    props[type] = props[types[type].abbrev];
  }

  if (!props.uuid) throw new Error('missing "uuid" parameter');
  if (!self.tags[props.uuid]) self.tags[props.uuid] = {};
  info = self.tags[props.uuid].info || {};
  for (prop in props) if (props.hasOwnProperty(prop)) {
    info[prop] = props[prop];
  }
  self.tags[props.uuid].info = info;
  for (prop in { type: true, name: true, rssi: true, txpwr: true }) {
    if (typeof props[prop] === 'undefined') props[prop] = info[prop];
    if (typeof props[prop] === 'undefined') throw new Error('missing "' + prop + '" parameter');
  }

  protos = { 12 : { deviceType : '/device/sensor/wirelesstag/motion'
                  , name       : 'Motion Sensor'
                  , properties : { temperature : 'celcius'
                                 , armed       : [ 'true', 'false' ]
                                 , motion      : [ 'detected', 'absent' ]
                                 , state       : [ 'opened', 'closed' ]
                                 , rssi        : 's8'
                                 }
                  }

           , 13 : { deviceType : '/device/climate/wirelesstag/meteo'
                  , name       : 'Temperature/Humidity Sensor'
                  , properties : { temperature : 'celcius'
                                 , humidity    : 'percentage'
                                 , armed       : [ 'true', 'false' ]
                                 , motion      : [ 'detected', 'absent' ]
                                 , state       : [ 'opened', 'closed' ]
                                 , rssi        : 's8'
                                 }
                  }

           , 32 : { deviceType : '/device/sensor/wirelesstag/water'
                  , name       : 'Water/Soil moisture sensor'
                  , properties : { temperature : 'celcius'
                                 , humidity    : 'percentage'
                                 , water       : [ 'detected', 'absent' ]
                                 , rssi        : 's8'
                                 }
                  }

           , 52 : { deviceType : '/device/sensor/wirelesstag/motion'
                  , name       : 'Door/window KumoSensor'
                  , properties : { temperature : 'celcius'
                                 , humidity    : 'percentage'
                                 , armed       : [ 'true', 'false' ]
                                 , motion      : [ 'detected', 'absent' ]
                                 , rssi        : 's8'
                                 }
                  }

           , 62 : { deviceType : '/device/climate/kumostat/control'
                  , name       : 'Kumostat'
                  , properties : { temperature     : 'celcius'
                                 , humidity        : 'percentage'
                                 , hvac            : [ 'cool', 'heat', 'fan', 'off' ]
                                 , goalTemperature : 'celsius'
                                 , rssi            : 's8'
                                 }
                  }

           , 72 : { deviceType : '/device/sensor/wirelesstag/motion'
                  , name       : 'PIR KumoSensor'
                  , properties : { temperature : 'celcius'
                                 , humidity    : 'percentage'
                                 , armed       : [ 'true', 'false' ]
                                 , motion      : [ 'detected', 'absent' ]
                                 , rssi        : 's8'
                                 }
                  }
           }[props.type];
  if (!protos) throw new Error('unknown type: ' + props.type);

  now = new Date().getTime();
  if (!self.tags[props.uuid].firstSeen) self.tags[props.uuid].firstSeen = now;
  self.tags[props.uuid].lastSeen = now;

  f = { eventState   : function() { var eventState = props.eventState.toString();

                                     if (!!protos.properties.armed) {
                                       info.armed = eventState === '0' ? 'false' : 'true';
                                       if ((!!protos.properties.motion) && (info.armed === 'true')) {
                                         info.motion = eventState == '5' ? 'detected' : 'absent';
                                         info.state = { '3': 'opened', '4': 'closed' }[eventState];
                                         if (typeof info.state === 'undefined') delete(info.state);
                                       }
                                     }
                                   }

      , waterDetected : function() {
                                     info.water = props.waterDetected ? 'detected' : 'absent';
                                   }

      , temperature   : function() { if ((!isNaN(props.temperature))
                                             && (props.temperature !== '0.00')
                                             && (!!protos.properties.temperature)) {
                                       info.temperature = props.temperature;
                                     }
                                   }

      , moisture      : function() { if ((!isNaN(props.moisture))
                                             && (props.moisture !== '0.00')
                                             && (!!protos.properties.humidity)) {
                                       info.humidity = props.moisture;
                                     }
                                   }

      , fanOn         : function() { if (!protos.properties.hvac) return;

                                          if (props.fanOn)             info.hvac = 'fan';
                                     else if (props.hvacOn === 'heat') info.hvac = 'heat';
                                     else if (props.hvacOn === 'cool') info.hvac = 'cool';
                                     else                              info.hvac = 'off';
                                   }

      , target        : function() { var target = parseInt(props.target, 10);

                                     if ((!isNaN(target)) && (!!protos.properties.goalTemperature)) {
                                       info.goalTemperature = target;
                                     }
                                   }


      , rssi          : function() { var rssi  = parseInt(props.rssi, 10)
                                       , txpwr = parseInt(props.txpwr, 10)
                                       ;

                                     if ((isNaN(rssi)) || (!protos.properties.rssi)) return;

                                     if (rssi < -127) rssi = 127; else if (rssi > 128) rssi = 128;
                                     if ((!isNaN(txpwr)) && (txpwr > 0) && (txpwr <= 255)) {
                                       rssi -= 20 * mathjs.log(txpwr / 255, 10);
                                     }
                                     info.rssi = rssi.toFixed(0);
                                   }
        };

  info = { lastSample: now };
  for (prop in props) if (props.hasOwnProperty(prop)) if (!!f[prop]) (f[prop])();
  for (prop in info) if ((info.hasOwnProperty(prop)) && (!isNaN(info[prop]))) info[prop] = parseFloat(info[prop]);

  self.reqNo++;
  message = { path: '/api/v1/thing/reporting', requestID: self.reqNo.toString(), things: {} };
  message.things[protos.deviceType] = { prototype                      :
                                        { device                       :
                                          { name                       : protos.name
                                          , maker                      : 'CAO Gadgets LLC'
                                          }
                                        , name                         : true
                                        , status                       : [ 'present', 'absent', 'recent' ]
                                        , properties                   : protos.properties
                                        }
                                      , instances                      :
                                        [
                                          { name                       : props.name
                                          , status                     : 'present'
                                          , unit                       :
                                            { serial                   : props.uuid
                                            , udn                      : props.uuid
                                            }
                                          , info                       : info
                                          , uptime                     : now - self.tags[props.uuid].firstSeen
                                          }
                                        ]
                                      };

  self.tags[props.uuid].packet = message;
  return message;
};


module.exports = KumoAppTSRP;
