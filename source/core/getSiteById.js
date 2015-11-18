'use strict';

modules.define(async (require) => {
    let siteIds = await require('siteIds.js');

    let sites = new Map();

    return async function getSiteById(id) {
        if (!siteIds.has(id)) {
            return null;
        }
        let site = sites.get(id);
        if (site === undefined) {
            site = await require(`sites/${id}/site.js`);
            sites.set(id, site);
        }
        return site;
    };
});

