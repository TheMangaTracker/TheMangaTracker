'use strict';

define([
], () => {
    let sites = new Set([
        {{#sites}}
            '{{{.}}}',
        {{/sites}}
    ]);

    return sites;
});
