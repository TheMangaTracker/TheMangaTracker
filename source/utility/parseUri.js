'use strict';

modules.define(async (require) => {
    function parseUri(uri) {
        let a = document.createElement('a');
        a.href = uri;
        return {
            scheme: a.protocol.slice(0, -1),
            host: a.hostname,
            port: a.port,
            path: a.pathname,
            query: a.search ? a.search.slice(1) : '',
            fragment: a.hash ? a.hash.slice(1) : '',

            get pathParts() {
                let path = this.path.slice(1);
                if (path.endsWith('/')) {
                    path = path.slice(0, -1);
                }
                return path.split('/');
            },

            get queryData() {
                let data = {};
                for (let pair of this.query.split('&')) {
                    let [key, value] = pair.split('=');
                    data[key] = value;
                }
                return data;
            },
        };
    }

    return parseUri;
});
