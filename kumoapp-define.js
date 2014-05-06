var params = require('./kumoapp-params')
  , config = params.config
  , props  = params.props
  , URL    = 'http://' + config.ipaddr + ':' + config.portno + '/kumoapp';

var i, params, prop, type, types;

params = {};
for (prop in props) if (props.hasOwnProperty(prop)) {
  types = props[prop].types;
  for (i = 0; i < types.length; i++) {
    type = types[i];

    if (!params[type]) params[type] = '"0":' + type;
    params[type] += ',"' + props[prop].abbrev + '":' + "this." + prop;
    if ((prop === 'temperature') || (prop === 'moisture')) params[type] += '.toFixed(2)';
  }
}

console.log('var tags = <#tags_[12|13|32|52|62|72]_N#>;');
for (type in params) if (params.hasOwnProperty(type)) {
  console.log('<#tags_[' + type + ']_N#>.forEach(function(tag) {');
  console.log('  tag.updated = function() {');
  console.log('    var json = JSON.stringify({' + params[type] + '});');
  console.log('    KumoApp.Log(json);');
  console.log('    KumoApp.httpCall("' + URL + '", "PUT", json);');
  console.log('  };');
  console.log('});');
  console.log('');
}
