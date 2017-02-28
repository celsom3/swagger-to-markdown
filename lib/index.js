var fs = require('fs');
var _ = require('underscore');
var docs = require('../test-swagger.json');

function s2m(swaggerFile, newFileName) {
  var md = '';

  // Creates the header section (top info)

  var swaggerVersion = swaggerFile.swagger || '2.0';
  var title = swaggerFile.info.title || 'No Title';
  var description = swaggerFile.info.description || 'No description';
  var version = swaggerFile.info.version || 'No version';

  var host = swaggerFile.host || 'localhost:3000';
  var schemes = swaggerFile.schemes || [];
  var basePath = swaggerFile.basePath || '/';
  var produces = swaggerFile.produces || [];

  var paths = swaggerFile.paths || {};
  var definitions = swaggerFile.definitions || {};

  // Title Heading Section

  md += `# ${title}\n`;
  md += `#### ${description} v${version}\n`;
  md += `Using Swagger Version ${swaggerVersion}\n`;
  md += `\nHost: ${host}\n`;
  md += `\nbasePath: ${basePath}\n`;

  // Loop through and make a list of schemes

  md += `\n|Schemes|Produces|\n`;
  md += `|---|---|\n`;
  if (schemes || produces) {
    var loopLimit = getHighest([schemes.length, produces.length]);
    for (var i = 0; i < loopLimit; i++) {
      var schemeItem = schemes[i];
      var producesItem = produces[i];
      md += `| ${schemeItem} | ${producesItem} |\n`;
    }
  }

  // Paths

  // md += `\n## Paths\n`;
  md += `\n---\n`;

  // Looping through all paths
  _.each(paths, (routeInfo, route) => {
    // md += `\n### ${route}\n`;

    // Looping through all the paths
    _.each(routeInfo, (methodBody, method) => {

      md += `\n## ${makeAllCaps(method)} ${route}\n`;
      md += `*(${methodBody.summary})*\n\n`;
      md += `${methodBody.description}\n`;

      // Consumes & Produces
      if (methodBody.consumes || methodBody.produces) {
        var cLength = methodBody.consumes.length;
        var pLength = methodBody.produces.length;

        md += `\n| Consumes | Produces |\n`;
        md += `|---|---|\n`;
        for(var x = 0 ; x < getHighest([cLength, pLength]); x++) {
          var consumes = methodBody.consumes[x];
          var produces = methodBody.produces[x];
          md += `| ${consumes} | ${produces} |\n`;
        }
      }

      // Parameters
      // Loop through the parameters
      if (methodBody.parameters) {
        var paramCount = methodBody.parameters.length;

        md += '\n##### Parameters\n';
        md += '| Name | In | Description | Required | Schema |\n';
        md += '|---|---|---|---|---|\n';
        methodBody.parameters.map(function(param){
          var schema = param.type || getDefinitionLink(param.schema['$ref']);
          md += `| ${param.name} | ${param.in} | ${param.description} | ${param.required} | ${schema} |\n`;
        });
      }

      // Responses
      // Loop thorugh the responses
      if (methodBody.responses) {
        md += '\n##### Responses\n';
        md += `\n| Code | Description | Schema |\n`;
        md += `|---|---|---|\n`;
        _.each(methodBody.responses, (resDetails, res) => {
          var description = '';
          var resSchema = 'None';
          // Loops through description object
          _.each(resDetails, (details, item) => {

            if(item === 'description') {
              description = details;
            }
            if(item === 'schema') {

              if(details.type) {
                resSchema = details.items['$ref'];
                if (resSchema) {
                  resSchema = getDefinitionLink(resSchema);
                  resSchema = `[ ${resSchema} ]`;
                }
              } else {
                resSchema = details['$ref'];
                if (resSchema) {
                  resSchema = getDefinitionLink(resSchema);
                }
              }

            }
          });

          md += `| ${res} | ${description} | ${resSchema} |\n`;

        });
      }

      md += `\n---\n`;
    });

  });

  // End of looping through all paths

  // Now to loop through all definitions

  md += `# Definitions\n`;

  _.each(definitions, (definition, name) => {
    // Display the Definition name
    md += `### ${name}\n`;

    // Loop through the objects details
    md += traverseObject(definition, 0, '');

    md += '\n';
  });


  fs.writeFile(newFileName + '.md', md, (err) => {
    if (err) {
      console.log(err);
      process.exit(1);
    } else {
      process.exit(0);
    }
  });

}

function traverseObject(obj, indent, indentStr) {
  var str = '';
  var space = '';
  for(var x = 0; x < indent; x++){
    space += ' ';
  }

  _.each(obj, (val, key) => {
    if(_.isString(val)){
      if (key === '$ref'){
        var link = getDefinitionLink(val)
        str += `${indentStr}- **${key}**: ${link}\n`;
      } else {
        str += `${indentStr}- **${key}**: ${val}\n`;
      }
    }
    if(_.isObject(val)){
      str += `${indentStr}- **${key}**: \n`;
      str += indentStr + traverseObject(val, (indent + 2), space);
    }

  });

  // str +=' \n';

  return str;
}

function makeAllCaps(string) {
  var answer = '';
  _.map(string, function(x, y){
    answer += x.toUpperCase();
  });
  return answer;
}

function makeLowerCase(string) {
  var answer = '';
  _.map(string, function(x, y){
    answer += x.toLowerCase();
  });
  return answer;
}

function getHighest(array) {
  var highest = 0;
  array.map(function(x){
    if( x > highest) {
      highest = x;
    }
  });

  return highest;
}

function getDefinitionLink(string){
  var theName = string.slice(14);
  var allLowerCase = makeLowerCase(theName);
  return `[${theName}](#${allLowerCase})`;
}

module.exports = s2m;
