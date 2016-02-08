'use strict';

modules.define(async (require) => {
    let AsyncStream = await require('/utility/AsyncStream.js');

    return {
        getId: () => 'Eat-Manga',

        getUri: () => 'http://eatmanga.com',

        getName: () => 'EatManga',

        getIconUri: () => 'http://cdn.eatmanga.com/media/favicon.png',

        getMangaById: async function (id) {
            this.getMangaById = await require('./getMangaById.js');
            let manga = await this.getMangaById(id);
            return manga;
        },

        findMangas(query) {
            return new AsyncStream(async () => {
                this.findMangas = await require('./findMangas.js');
                let node = await this.findMangas(query).evaluate();
                return node;
            });
        },
    };
});
