modules.define(async (require) => {
    class PageBase {
        constructor(chapter) {
            Object.defineProperties(this, {
                chapter: { value: chapter },
            });
        }

        async getId() { throw new Error('Not implemented'); }
        async getUri() { return null; }
        async getImageUri() { throw new Error('Not implemented'); }

        async getPreviousPage() { throw new Error('Not implemented'); }
        async getNextPage() { throw new Error('Not implemented'); }
    }

    return PageBase;
});

