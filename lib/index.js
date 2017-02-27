import fs from 'fs';
import _ from 'underscore';
import doc from '../test-swagger.json';

let md = '';

// Creates the header section (top info)

const swaggerVersion = doc.swagger || '2.0';
const title = doc.info.title || 'No Title';
const description = doc.info.description || 'No description';
const version = doc.info.version || 'No version';

const host = doc.host || 'localhost:3000';
const schemes = doc.schemes || [];
const basePath = doc.basePath || '/';
const produces = doc.produces || [];

const paths = doc.paths || {};
const definitions = doc.definitions || {};

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
  const loopLimit = getHighest([schemes.length, produces.length]);
  for (let i = 0; i < loopLimit; i++) {
    let schemeItem = schemes[i];
    let producesItem = produces[i];
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
      let cLength = methodBody.consumes.length;
      let pLength = methodBody.produces.length;

      md += `\n| Consumes | Produces |\n`;
      md += `|---|---|\n`;
      for(let x = 0 ; x < getHighest([cLength, pLength]); x++) {
        let consumes = methodBody.consumes[x];
        let produces = methodBody.produces[x];
        md += `| ${consumes} | ${produces} |\n`;
      }
    }

    // Parameters
    // Loop through the parameters
    if (methodBody.parameters) {
      let paramCount = methodBody.parameters.length;

      md += '\n##### Parameters\n';
      md += '| Name | In | Description | Required | Schema |\n';
      md += '|---|---|---|---|---|\n';
      methodBody.parameters.map((param) => {
        const schema = param.type || getDefinitionLink(param.schema['$ref']);
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
        let description = '';
        let resSchema = 'None';
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


fs.writeFile('API-DOC.md', md, (err) => {
  if (err) {
    console.log(err);
    process.exit(1);
  } else {
    process.exit(0);
  }
});

function traverseObject(obj, indent, indentStr) {
  let str = '';
  let space = '';
  for(let x = 0; x < indent; x++){
    space += ' ';
  }

  _.each(obj, (val, key) => {
    if(_.isString(val)){
      if (key === '$ref'){
        let link = getDefinitionLink(val)
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
  let answer = '';
  _.map(string, (x, y) => {
    answer += x.toUpperCase();
  });
  return answer;
}

function makeLowerCase(string) {
  let answer = '';
  _.map(string, (x, y) => {
    answer += x.toLowerCase();
  });
  return answer;
}

function getHighest(array) {
  let highest = 0;
  array.map((x) => {
    if( x > highest) {
      highest = x;
    }
  });

  return highest;
}

function getDefinitionLink(string){
  const theName = string.slice(14);
  const allLowerCase = makeLowerCase(theName);
  return `[${theName}](#${allLowerCase})`;
}
