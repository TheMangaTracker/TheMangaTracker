'use strict';

define([
    'require', './../sites.js', '/utility/languages.js', '/utility/AsyncStream.js',
], ( require ,      _sites    ,           languages    ,           AsyncStream    ) => {
    function search(query, sites = null) {
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

        if (sites === null) {
            sites = new Set(_sites);
        } else {
            sites = new Set(sites);
            for (let site of sites) {
                console.assert(_sites.has(site));
            }
        }

        return AsyncStream.from(sites)
            .asyncMap((callbacks, site) => {
                require([
                    './' + site + '/search.js',
                ], (                search    ) => {
                    callbacks.return([site, search]);     
                });
            })
            .map(([site, search]) => {
                return search(query)
                    .map(manga => {
                        return {
                            id: manga.id,
                            title: manga.title,
                            site,
                        };
                    })
                ;
            })
            .joinItems()
        ;
    }

    return search;
});
