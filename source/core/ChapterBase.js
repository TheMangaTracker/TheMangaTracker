modules.define(async (require) => {
    class ChapterBase {
        constructor(manga) {
            Object.defineProperties(this, {
                manga: { value: manga },
            });
        }

        async getId() { throw new Error('Not implemented'); }
        async getUri() { return null; }
        async getTitle() { return null; }

        async getPreviousChapter() { throw new Error('Not implemented'); }
        async getNextChapter() { throw new Error('Not implemented'); }

        async getPageById(id) { throw new Error('Not implemented'); }
        async getFirstPage() { throw new Error('Not implemented'); }
        async getLastPage() { throw new Error('Not implemented'); }
    }

    return ChapterBase;
});

