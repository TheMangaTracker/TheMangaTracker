'use strict';

let fsp = require('fs-promise');
let yaml = require('js-yaml');

async function readYaml(path) {
    let data = await fsp.readFile(path, { encoding: 'utf8' });
    return yaml.safeLoad(data);
}

module.exports = readYaml;
