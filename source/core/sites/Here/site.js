'use strict';

modules.define(async (require) => {
    let SiteBase = await require('/core/SiteBase.js');

    class Site extends SiteBase {
        getUri() {
            return 'http://mangahere.co';
        }

        getName() {
            return 'MangaHere';
        }

        getIconUri() {
            return 'http://mangahere.co/favicon32.ico';
        }

        getLanguageIds() {
            return ['en', 'es'];
        }
    };

    return new Site(require.baseUri);
});
