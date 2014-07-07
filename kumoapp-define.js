var params = require('./kumoapp-params')
  , config = params.config
  , props  = params.props
  , names  = params.names
  , URL    = 'http://' + config.ipaddr + ':' + config.portno + '/kumoapp';

var i, params, pass1, prop, type, s, types;

params = {};
pass1 = {};
for (prop in props) if (props.hasOwnProperty(prop)) {
  types = props[prop].types;
  for (i = 0; i < types.length; i++) {
    type = types[i];
    if ({ uuid: true, slaveId: true, name: true, rssi: true, txpwr: true }[prop]) {
        if (!pass1[type]) pass1[type] = '"0":' + type;
        pass1[type] += ',"' + props[prop].abbrev + '":' + "tag." + prop;
        if (prop !== 'uuid') continue;
    }

    if (!!params[type]) s = ','; else { params[type] = ""; s = ''; }
    params[type] += s + '"' + props[prop].abbrev + '":' + "tag." + prop;
    if ((prop === 'temperature') || (prop === 'moisture')) params[type] += '.toFixed(2)';
  }
}

for (type in params) if (params.hasOwnProperty(type)) {
  if (!names[type]) continue;

  console.log('<#' + names[type] + ' tags_[' + type + ']_N#>.forEach(function(tag) {');
  console.log('  tag.updated = function() {');
  console.log('    var json = JSON.stringify({' + pass1[type] + '});');
  console.log('    KumoApp.Log(json);');
  console.log('    KumoApp.httpCall("' + URL + '", "PUT", json, "' + config.tagManager + '");');
  console.log('    var json = JSON.stringify({' + params[type] + '});');
  console.log('    KumoApp.Log(json);');
  console.log('    KumoApp.httpCall("' + URL + '", "PUT", json, "' + config.tagManager + '");');
  console.log('  };');
  console.log('});');
  console.log('');
}
