'use strict';

modules.define(async (require) => {
    let sites = new Set([
        {{#sites}}
            '{{{.}}}',
        {{/sites}}
    ]);

    return sites;
});
