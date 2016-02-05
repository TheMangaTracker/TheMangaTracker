'use strict';

modules.define(async (require) => {
    let sites = { __proto__: null,
        *[Symbol.iterator]() {
            for (let id in this) {
                yield this[id];
            }
        },
    };
    
    await Promise.all([
      {{#paths}}
        '{{{.}}}',
      {{/paths}}
    ].map(async (path) => {
        let site = await require('./sites/' + path + '/site.js');

        let id = await site.getId();
        if (id in sites) {
            throw new Error('Site id conflict for id ' + id + ' for sites ' + 
                            await site.getName() + ' and ' + await sites[id].getName() + '.');
        }

        sites[id] = site;
    }));

    return sites;
});
