var params = require('./kumoapp-params')
  , config = params.config
  , types  = params.props
  , dgram  = require('dgram')
  , http   = require('http')
  , mathjs = (require('mathjs'))()
  , util   = require('util')
  ;


var portno = config.portno
  , tsrp   = { ipaddr: '224.0.9.1', portno: 22601 }
  ;


var tags  = {};

var reqNo = 0;

var maker = function(props) {
  var f, info, message, now, prop, protos, status, type;

  if (typeof props['0'] !== 'undefined') props.type = props['0'];
  for (type in types) if (types.hasOwnProperty(type)) if (typeof props[types[type].abbrev] !== 'undefined') {
    props[type] = props[types[type].abbrev];
  }

  if (!props.uuid) throw new Error('missing "uuid" parameter');
  if (!tags[props.uuid]) tags[props.uuid] = {};
  info = tags[props.uuid].info || {};
  for (prop in props) if (props.hasOwnProperty(prop)) {
    info[prop] = props[prop];
  }
  tags[props.uuid].info = info;
  for (prop in { type: true, name: true, rssi: true, txpwr: true }) {
    if (typeof props[prop] === 'undefined') props[prop] = info[prop];
    if (typeof props[prop] === 'undefined') throw new Error('missing "' + prop + '" parameter');
  }

  protos = { 12 : { deviceType : '/device/sensor/wirelesstag/motion'
                  , name       : 'Motion Sensor'
                  , status     : [ ]
                  , properties : { temperature : 'celcius'
                                 , armed       : [ 'true', 'false' ]
                                 , rssi        : 's8'
                                 }
                  }

           , 13 : { deviceType : '/device/climate/wirelesstag/meteo'
                  , name       : 'Temperature/Humidity Sensor'
                  , status     : [ ]
                  , properties : { temperature : 'celcius'
                                 , humidity    : 'percentage'
                                 , armed       : [ 'true', 'false' ]
                                 , rssi        : 's8'
                                 }
                  }

           , 32 : { deviceType : '/device/sensor/wirelesstag/moisture'
                  , name       : 'Water/Soil moisture sensor'
                  , status     : [ ]
                  , properties : { temperature : 'celcius'
                                 , humidity    : 'percentage'
                                 , water       : [ 'detected', 'absent' ]
                                 , rssi        : 's8'
                                 }
                  }

           , 52 : { deviceType : '/device/sensor/wirelesstag/reed'
                  , name       : 'Door/window KumoSensor'
                  , status     : [ 'open', 'closed', 'moving' ]
                  , properties : { temperature : 'celcius'
                                 , humidity    : 'percentage'
                                 , armed       : [ 'true', 'false' ]
                                 , rssi        : 's8'
                                 }
                  }

           , 62 : { deviceType : '/device/climate/kumostat/control'
                  , name       : 'Kumostat'
                  , status     : [ ]
                  , properties : { temperature     : 'celcius'
                                 , humidity        : 'percentage'
                                 , hvac            : [ 'cool', 'heat', 'fan', 'off' ]
                                 , goalTemperature : 'celsius'
                                 , rssi            : 's8'
                                 }
                  }

           , 72 : { deviceType : '/device/sensor/wirelesstag/motion'
                  , name       : 'PIR KumoSensor'
                  , status     : [ 'motion', 'quiet' ]
                  , properties : { temperature : 'celcius'
                                 , humidity    : 'percentage'
                                 , rssi        : 's8'
                                 }
                  }
           }[props.type];
  if (!protos) throw new Error('unknown type: ' + props.type);

  now = new Date().getTime();
  if (!tags[props.uuid].firstSeen) tags[props.uuid].firstSeen = now;
  tags[props.uuid].lastSeen = now;

  f = { eventState   : function() { var eventState = props.eventState.toString();

                                     if (!!protos.properties.armed) info.armed = eventState !== '0' ? 'true' : 'false';
                                     if (!!protos.properties.state) {
// state, motion
// moved=2, opened=3, closed=4, detected movement=5, timedout = 6
                                     status = { 2 : 'motion'
                                              , 3 : ''
                                              , 4 : ''
                                              , 5 : ''
                                              , 6 : 'recent'
                                              };
                                     }
                                   }

      , waterDetected : function() {
                                     info.water = 'detected';
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
  if (props.type === 32) info.water = 'absent';
  for (prop in props) if (props.hasOwnProperty(prop)) if (!!f[prop]) (f[prop])();
  for (prop in info) if ((info.hasOwnProperty(prop)) && (!isNaN(info[prop]))) info[prop] = parseFloat(info[prop]);

  reqNo++;
  message = { path: '/api/v1/thing/reporting', requestID: reqNo.toString(), things: {} };
  message.things[protos.deviceType] = { prototype                      :
                                        { device                       :
                                          { name                       : protos.name
                                          , maker                      : 'CAO Gadgets LLC'
                                          }
                                        , name                         : true
                                        , status                       : protos.status.concat([ 'present', 'absent', 'recent' ])
                                        , properties                   : protos.properties
                                        }
                                      , instances                      :
                                        [
                                          { name                       : props.name
                                          , status                     : status || 'present'
                                          , unit                       :
                                            { serial                   : props.uuid
                                            , udn                      : props.uuid
                                            }
                                          , info                       : info
                                          , uptime                     : now - tags[props.uuid].firstSeen
                                          }
                                        ]
                                      };

// console.log('PACKET');
// console.log(util.inspect(message, { depth: null }));
  tags[props.uuid].packet = message;
  return message;
};

setInterval(function() {
  var diff, now, packet, uuid;

  var retry = function(err, octets) {/* jshint unused: false */
      if (!!err) return console.log('TSRP retry: ' + err.message);

//    console.log('>>> sent ' + octets + ' octets');
  };

  now = new Date().getTime();
  for (uuid in tags) if (tags.hasOwnProperty(uuid)) {
    if (!tags[uuid].packet) continue;

    diff = now - tags[uuid].lastSeen;
    if (diff >= (32 * 60 * 1000)) {
//    console.log('>>> deleting packet for ' + uuid);

      delete(tags[uuid].packet);
      continue;
    }

    packet = new Buffer(JSON.stringify(tags[uuid].packet));
    tsrp.dgram.send(packet, 0, packet.length, tsrp.portno, tsrp.ipaddr, retry);
  }
}, 45 * 1000);


http.createServer(function(request, response) {
  var body = '';

  var done = function(code, s, ct) {
    if (code === 405) {
      response.writeHead(405, { Allow: 'PUT' });
      return response.end();
    }

    if (!s) return response.end();

    response.writeHead(code, { 'Content-Type': ct || 'application/json' });
    response.end(s);
  };

  var loser = function(err) {
    console.log(util.inspect(err, { depth: null }));
    return done(200, JSON.stringify({ error: err }));
  };

  if (request.method !== 'PUT') return done(405);

  request.on('data', function(data) {
    body += data.toString();
  }).on('close', function() {
    console.log('http request: premature close');
  }).on('end', function() {
    var packet;

    try { packet = new Buffer(JSON.stringify(maker(JSON.parse(body)))); } catch(ex) { return loser(ex); }
    if (!packet) return done(200);

    tsrp.dgram.send(packet, 0, packet.length, tsrp.portno, tsrp.ipaddr, function(err, octets) {/* jshint unused: false */
      if (!!err) return loser(err);

//    console.log('>>> sent ' + octets + ' octets');
    });

    done(200);
  });
}).on('listening', function() {
  console.log('listening on http://*:' + portno);
}).on('error', function(err) {
  console.log('http server: ' + err.message);
}).listen(portno);

tsrp.dgram = dgram.createSocket('udp4').on('error', function(err) {
  console.log('dgram sender: ' + err.message);
}).on('message', function(msg, rinfo) { /* jshint unused: false */
  console.log('>>> received ' + msg.length + ' octets from ' + JSON.stringify(rinfo));
}).on('listening', function() {
  var address = this.address();

  console.log('bound to multicast udp://' + (address.address !== '0.0.0.0' ? address.address : '*') + ':' + address.port);
  try { this.setMulticastLoopback(true); } catch(ex) { console.log('dgram loopback: ' + ex.message); }
});
tsrp.dgram.bind(0, function() {
  this.addMembership(tsrp.ipaddr);
});
