'use strict';

modules.define(async (require) => {
    let AsyncStream = await require('/utility/AsyncStream.js');

    return {
        getId: () => 'yomanga',

        getUri: () => 'http://yomanga.co',

        getName: () => 'YoManga',

        getIconUri: () => 'http://yomanga.co/android-chrome-192x192.png',

        async getMangaById(id) {
            this.getMangaById = await require('getMangaById.js');
            let manga = await this.getMangaById(id);
            return manga;
        },

        findMangas(query) {
            return new AsyncStream(async () => {
                this.findMangas = await require('findMangas.js');
                let node = await this.findMangas(query).evaluate();
                return node;
            });
        },

        _languageId: 'en',

        _readerUri: 'http://yomanga.co/reader/',
    };
});
