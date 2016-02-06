'use strict';

modules.define(async (require) => {
    let http = await require('/utility/http.js');

    return async function getMangaById(id) {
        let uri = this._readerUri + 'series/' + id + '/';
        let document = await http.getHtml(uri);
        if (document === null) {
            return null;
        }

        let manga = { __proto__: await require('./mangaProto.js'),
            site: this,
            getId: () => id,
            getUri: () => uri,
            _getDocument: () => document,
        };

        return manga;
    };
});
