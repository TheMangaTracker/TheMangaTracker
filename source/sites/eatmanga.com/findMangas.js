'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');
    let http = await require('/utility/http.js');
    let AsyncStream = await require('/utility/AsyncStream.js');
    let mangaProto = await require('./mangaProto.js');

    return function findMangas(query) {
        return AsyncStream.fromEmitter(async (emit) => {
            if (!query.languageIds.has('en')) {
                return;
            }

            let titleTester = query.title
              .toLowerCase()
              .replace(/[^0-9A-Za-z]+/g, '.*');
            titleTester = new RegExp(titleTester, 'i');

            let uri = new URL('/Manga-Scan/', this.getUri()).href;
            let document = await http.getHtml(uri);
            let anchors = $(document)
              .find('#updates th a')
              .toArray();
            for (let anchor of anchors) {
                let title = $(anchor).text();
                if (!titleTester.test(title)) {
                    continue;
                }

                let manga = { __proto__: mangaProto,
                    site: this,

                    getUri() {
                        let uri = $(anchor).prop('href');
                        return uri;
                    },

                    getTitle: () => title,
                };

                await emit(manga);
            }
        });
    };
});
