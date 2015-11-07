'use strict';

modules.define(async (require) => {
    let AsyncStream = await require('/utility/AsyncStream.js');
    let languages = await require('/utility/languages.js');

    let sites = await require('../sites.js');
    let load = await require('load.js');

    function search(query) {
        query = (a => {
            let b = {};
            for (let name in a) {
                b[name] = a[name];
            }
            return b;
        })(query);
        
        let querySites;
        if ('sites' in query) {
            querySites = query.sites; delete query.sites;
            console.assert(querySites instanceof Array);
            if (querySites.length === 0) {
                querySites = sites;
            } else {
                querySites = new Set(querySites);
                for (let site of querySites) {
                    console.assert(sites.has(site));
                }
            }
        } else {
            querySites = sites;
        }

        let unknownFields = new Set(Object.keys(query));

        if ('title' in query) {
            console.assert(query.title instanceof String);
            unknownFields.delete('title');
        } else {
            query.title = '';
        }

        if ('writer' in query) {
            console.assert(query.writer instanceof String);
            unknownFields.delete('writer');
        } else {
            query.writer = '';
        }

        if ('artist' in query) {
            console.assert(query.artist instanceof String);
            unknownFields.delete('artist');
        } else {
            query.artist = '';
        }

        if ('status' in query) {
            console.assert(query.status === '' ||
                           query.status === 'ongoing' ||
                           query.status === 'complete');
            unknownFields.delete('status');
        } else {
            query.status = '';
        }

        if ('layout' in query) {
            console.assert(query.layout === '' ||
                           query.layout === 'right_to_left' ||
                           query.layout === 'left_to_right');
            unknownFields.delete('layout');
        } else {
            query.layout = '';
        }

        if ('languages' in query) {
            console.assert(query.languages instanceof Array);
            if (query.languages.length === 0) {
                query.languages = languages;
            } else {
                query.languages = new Set(query.languages);
                for (let language of query.languages) {
                    console.assert(languages.has(language));
                }
            }
            unknownFields.delete('languages');
        } else {
            query.languages = languages;
        }

        console.assert(unknownFields.size === 0);

        return AsyncStream.from(querySites)
            .asyncMap((callbacks, site) => {
                require(site + '/search.js').then(search => {
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
