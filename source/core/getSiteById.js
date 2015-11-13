'use strict';

modules.define(async (require) => {
    let sites = new Map();

    for (let id of await require('siteIds.js')) {
        sites.set(id, async () => {
            let site = await require(`sites/${id}/site.js`);
            sites.set(id, () => site);
            return site;
        })
    }

    return async function getSiteById(id) {
        if (!sites.has(id)) {
            return null;
        }
        let site = await sites.get(id)();
        return site;
    };
});

