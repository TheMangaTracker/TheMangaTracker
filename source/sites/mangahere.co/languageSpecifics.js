'use strict';

modules.define(async (require) => {
    return {
        ['en']: {
            subdomain: 'www',
            alternativeNameMarker: 'Alternative Name:',
            summaryMarker: 'Manga Summary:',
            compressChapterId(id) {
                while (/^0[0-9]/.test(id)) {
                    id = id.slice(1);
                }
                return id;
            },
            decompressChapterId(id) {
                while (!/^[0-9]{3}/.test(id)) {
                    id = '0' + id;
                }
                return id;
            },
            resolvePageListUri: uri => uri,
        },

        ['es']: {
            subdomain: 'es',
            alternativeNameMarker: 'Nombre Alternativo:',
            summaryMarker: 'Manga Resumen:',
            compressChapterId: id => id,
            decompressChapterId: id => id,
            resolvePageListUri(uri) {
                return 'http://es.mangahere.co' + uri;
            },
        },
    };
});

