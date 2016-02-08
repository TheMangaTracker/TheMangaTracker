'use strict';

let fsp = require('fs-promise');
let mustache = require('mustache');

async function renderTemplate(path, data) {
    let body = await fsp.readFile(path, { encoding: 'utf8' });
    body = mustache.render(body, data);
    await fsp.writeFile(path, body, { encoding: 'utf8' });
}

module.exports = renderTemplate;
