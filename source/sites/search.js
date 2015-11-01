'use strict';

define([
    'require', './../sites.js', '/utility/languages.js', './load.js', '/utility/AsyncStream.js'
], ( require ,       sites    ,           languages    ,    load    ,           AsyncStream    ) => {
    function search(query) {
        let querySites = query.sites;
        if (querySites === undefined) {
            querySites = sites;
        } else {
            querySites = new Set(querySites);
            for (let site of querySites) {
                console.assert(sites.has(site));
            }
        }

        query = (a => {
            let b = {};

            if (a.title === undefined) {
                b.title = '';
            } else {
                b.title = a.title;
                console.assert(b.title.constructor === String);
            }

            if (a.writer === undefined) {
                b.writer = '';
            } else {
                b.writer = a.writer;
                console.assert(b.writer.constructor === String);
            }

            if (a.artist === undefined) {
                b.artist = '';
            } else {
                b.artist = a.artist;
                console.assert(b.artist.constructor === String);
            }

            if (a.complete === undefined) {
                b.complete = null;    
            } else {
                b.complete = a.complete;
                console.assert(b.complete === false ||
                               b.complete === true ||
                               b.complete === null);
            }

            if (a.readingDirection === undefined) {
                b.readingDirection = null;    
            } else {
                b.readingDirection = a.readingDirection;    
                console.assert(b.readingDirection === '<' ||
                               b.readingDirection === '>' ||
                               b.readingDirection === null);
            }

            if (a.languages === undefined) {
                b.languages = new Set(languages.keys());
            } else {
                b.languages = new Set(a.languages);
                for (let language of b.languages) {
                    console.assert(languages.has(language));
                }
            }

            return b;
        })(query);

        return AsyncStream.from(querySites)
            .asyncMap((callbacks, site) => {
                require([
                    './' + site + '/search.js'
                ], (                search    ) => {
                    callbacks.onResult([site, search]);     
                });
            })
            .map(([site, search]) => {
                return search(query)
                    .map(id => load(site, id)).chain()
                    .map(manga => ({ site, manga }))
                ;
            }).join()
        ;
    }

    return search;
});
