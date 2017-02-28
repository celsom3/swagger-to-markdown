# Swagger-To-Markdown

Convert your swagger files to markdown.

## How Use

First install the package in you project:

`npm install swagger-to-markdown`

Then create a file (let's call it `buildDoc.js`) with the following basic structure:

```javascript
var s2m = require('swagger-to-markdown');
var doc = require('./your-swagger.json');

s2m(doc, './');
```

Then all you need to do is run it from node:

`node buildDoc.js`

You can set this up as a script in `package.json`. Or run it from a gulp file.
