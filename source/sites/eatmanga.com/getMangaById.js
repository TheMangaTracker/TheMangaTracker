'use strict';

modules.define(async (require) => {
    let mangaProto = await require('./mangaProto.js');

    return function getMangaById(id) {
        let manga = { __proto__: mangaProto,
            site: this,
            getId: () => id,
        };

        return manga;
    };
});
