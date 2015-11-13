modules.define(async (require) => {
    let AsyncStream = await require('/utility/AsyncStream.js');
    let languages = await require('/utility/languages.js');

    let IMPLEMENTATION_URI = Symbol('IMPLEMENTATION_URI');

    class SiteBase {
        constructor(implementationUri) {
            this[IMPLEMENTATION_URI] = implementationUri;
        }

        async getId() {
            let id = /\/([^\/]+)\/$/.exec(this[IMPLEMENTATION_URI])[1];
            return id;
        }

        async getUri() { return null; }
        async getName() { throw new Error('Not implemented'); }
        async getIconUri() { return null; }
        async getLanguageIds() { return [...languages.keys()]; }

        async getMangaById(id) {
            this.getMangaById = await require(this[IMPLEMENTATION_URI] + 'getMangaById.js');
            return this.getMangaById(id);
        }

        searchManga(query) {
            return new AsyncStream(async () => {
                this.searchManga = await require(this[IMPLEMENTATION_URI] + 'searchManga.js');
                return this.searchManga(query).evaluate();
            });
        }
    }

    return SiteBase;
});

