'use strict';

modules.define(async (require) => {
    return new Set([
        {{#siteIds}}
            '{{{.}}}',
        {{/siteIds}}
    ]);
});

