'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');
    let http = await require('/utility/http.js');
    let AsyncStream = await require('/utility/AsyncStream.js');

    return function findMangas(query) {
        return AsyncStream.fromEmitter(async (emit) => {
            if (!query.languageIds.has('en')) {
                return;
            }

            let uri = new URL('/Manga-Scan/', this.getUri()).href;
            let document = await http.getHtml(uri);
            let anchors = $(document)
              .find('#updates th a')
              .toArray();
            for (let anchor of anchors) {
                let title = $(anchor).text();
                if (!query.titleMatches(title)) {
                    continue;
                }

                let uri = $(anchor).prop('href');

                let manga = { __proto__: await require('./mangaProto.js'),
                    site: this,
                    getUri: () => uri,
                    getTitle: () => title,
                };

                await emit(manga);
            }
        });
    };
});
