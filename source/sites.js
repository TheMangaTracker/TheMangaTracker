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
      {{#sites}}
        '{{{.}}}',
      {{/sites}}
    ].map(async (name) => {
        let path = './sites/' + name + '/sites.js';
        await Promise.all((await require(path)).map(async (site) => {
            let id = await site.getId();
            if (id in sites) {
                throw new Error('Site id conflict for id ' + siteId + ' for sites ' + 
                                await site.getName() + ' and ' + await sites[id].getName() + '.');
            }

            sites[id] = site;
        }));
    }));

    return sites;
});
