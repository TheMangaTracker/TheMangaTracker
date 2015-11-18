modules.define(async (require) => {
    let languages = await require('/utility/languages.js');

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
        async getCoverImageUri() { return null; }
        async getLanguageId() { return null; }
        async getLanguage() {
            let languageId = await this.getLanguageId();
            if (languageId === null) {
                return null;
            }
            return languages.get(languageId);
        }
        async getStatus() { return null; }
        async getWriters() { return []; }
        async getArtists() { return []; }
        async getSummaryParagraphs() { return []; }

        async getChapterById(id) { throw new Error('Not implemented'); }
        async getFirstChapter() { throw new Error('Not implemented'); }
        async getLastChapter() { throw new Error('Not implemented'); }
    }

    return MangaBase;
});

