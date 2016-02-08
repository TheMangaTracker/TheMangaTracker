'use strict';

let fsp = require('fs-promise');
let path = require('path');
let url = require('url');
let jimp = require('jimp');
let glob = require('glob');
let readYaml = require('./readYaml');
let renderTemplate = require('./renderTemplate');
let transpile = require('./transpile');

(async () => {
    let args = require('minimist')(process.argv.slice(2), {
        string: ['dir'],
        default: {
            dir: '../build',
        },
    });
     
    console.log('building ' + args.dir);

    await fsp.remove(args.dir);
    await fsp.copy('../extension', args.dir);
    process.chdir(args.dir);

    let extension = await readYaml('extension.yaml');

    for (let view of ['search.html', 'chapters.html', 'pages.html']) {
        await renderTemplate(view, { extension });
    }

    let sitePaths = (await fsp.readdir('sites'))
      .map(sn => path.join('sites', sn))
      .filter(sp => fsp.statSync(sp).isDirectory());
    for (let i = 0; i < sitePaths.length;) {
        let sitePath = sitePaths[i];

        if (await fsp.exists(path.join(sitePath, 'site.js'))) {
            sitePaths[i] = path.relative('sites', sitePath);
            ++i;
        } else {
            sitePaths.splice(i, 1);
        }

        if (await fsp.exists(path.join(sitePath, 'nestedSites.yaml'))) {
            for (let nestedSitePath of await readYaml('nestedSites.yaml')) {
                sitePaths.push(nestedSitePath);
            }
        }
    }

    await renderTemplate('sites.js', { paths: sitePaths });

    let thirdparty = await readYaml('thirdparty.yaml');
    let thirdpartyModules = [];
    for (let id in thirdparty) {
        let uri = thirdparty[id];
        thirdpartyModules.push({ id, uri });
    }
    renderTemplate('thirdparty.js', { modules: thirdpartyModules });

    let manifest = await fsp.readJson('manifest.json');
    manifest.name = extension.name;
    manifest.version = extension.version;
    manifest.description = extension.description;
    manifest.icons = {};
    for (let icon of ['icon.png']) {
        let bitmap = (await jimp.read('icon.png')).bitmap;
        let size = bitmap.width;
        if (bitmap.height !== size) {
            throw new Error(`Icon ${icon} is not square (${bitmap.width}x${bitmap.height}).`);
        }

        manifest.icons[size] = '/' + icon;
    }
    for (let sitePath of sitePaths) {
        for (let accessedUri of await readYaml(path.join('sites', sitePath, 'accessedUris.yaml'))) {
            if (!manifest.permissions.includes(accessedUri)) {
                manifest.permissions.push(accessedUri);
            }
        }
    }
    manifest.content_security_policy = `script-src 'self' ${
        [...new Set(
            thirdpartyModules
              .map(tm => url.parse(tm.uri))
              .map(u => url.format({
                protocol: u.protocol,
                slashes: u.slashes,
                auth: u.auth,
                host: u.host,
              }))
        )].join(' ')
    }; object-src 'self'`;
    await fsp.writeJson('manifest.json', manifest, { spaces: 4 });

    for (let source of glob.sync('**/*.js')) {
        await transpile(source);
    }

    for (let yaml of glob.sync('**/*.yaml')) {
        await fsp.remove(yaml);
    }

})().catch(e => {
    console.error(e.stack);
});
