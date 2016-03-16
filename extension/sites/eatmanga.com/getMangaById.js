'use strict';

define(async (require) => {
    let $ = await require('/thirdparty/jQuery.js');
    let http = await require('/utility/http.js');

    return async function getMangaById(id) {
        let uri = this.getUri() + '/Manga-Scan/' + id + '/';
        let document = await http.getHtml(uri);
        if ($(document).find('#main_content h3:contains("Opps, Requested manga chapter not found")').length > 0) {
            return null;
        }

        let manga = { __proto__: await require('mangaProto.js'),
            site: this,
            getId: () => id,
            getUri: () => uri,
            _getDocument: () => document,
        };

        return manga;
    };
});
