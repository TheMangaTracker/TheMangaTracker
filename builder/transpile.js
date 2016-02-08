'use strict';

let fsp = require('fs-promise');
let path = require('path');
let babel = require('babel-core');

async function transpile(target) {
    let code = await fsp.readFile(target, { encoding: 'utf8' });
    code = babel.transform(code, {
        extends: path.join(__dirname, './.babelrc'),
        filename: target,
    }).code;
    await fsp.writeFile(target, code, { encoding: 'utf8' });
}

module.exports = transpile;

