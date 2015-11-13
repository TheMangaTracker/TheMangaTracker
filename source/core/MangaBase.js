modules.define(async (require) => {
    class MangaBase {
        constructor(site) {
            Object.defineProperties(this, {
                site: { value: site },
            });
        }

        async getId() { throw new Error('Not implemented'); }
        async getUri() { return null; }
        async getTitle() { throw new Error('Not implemented'); }
        async getAlternativeTitles() { return []; }
        async getLanguageId() { return null; }
        async getWriter() { return null; }
        async getArtist() { return null; }
        async getSummary() { return null; }

        async getChapterById(id) { throw new Error('Not implemented'); }
        async getFirstChapter() { throw new Error('Not implemented'); }
        async getLastChapter() { throw new Error('Not implemented'); }
    }

    return MangaBase;
});

