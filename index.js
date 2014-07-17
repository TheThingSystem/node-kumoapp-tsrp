var KumoAppTSRP = require('./kumoapp-tsrp')
  , params      = require('./kumoapp-params')
  , config      = params.config
  , dgram       = require('dgram')
  , http        = require('http')
  , util        = require('util')
  ;


var portno = config.portno
  , tsrp   = { ipaddr: '224.0.9.1', portno: 22601 }
  , kumo   = new KumoAppTSRP({ types: params.props })
  ;

kumo.on('message', function(message) {

  var packet = new Buffer(JSON.stringify(message));
  tsrp.dgram.send(packet, 0, packet.length, tsrp.portno, tsrp.ipaddr, function(err, octets) {/* jshint unused: false */
    if (!!err) return console.log(util.inspect(err, { depth: null }));
  });
});



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
    var message, packet;

    try { message = kumo.toTSRP(JSON.parse(body)); } catch(ex) { return loser(ex); }
    if (!message) return done(200);

    packet = new Buffer(JSON.stringify(message));
    tsrp.dgram.send(packet, 0, packet.length, tsrp.portno, tsrp.ipaddr, function(err, octets) {/* jshint unused: false */
      if (!!err) return loser(err);
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
