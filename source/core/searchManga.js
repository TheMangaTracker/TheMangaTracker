'use strict';

modules.define(async (require) => {
    let AsyncStream = await require('/utility/AsyncStream.js');
    let languages = await require('/utility/languages.js');

    let siteIds = await require('siteIds.js');
    let getSiteById = await require('getSiteById.js');

    return function searchManga(query) {
        query = (a => {
            let b = {};
            for (let name in a) {
                b[name] = a[name];
            }
            return b;
        })(query);

        let querySiteIds;
        if ('siteIds' in query) {
            querySiteIds = query.siteIds; delete query.siteIds;
            console.assert(querySiteIds.constructor === Array);
            if (querySiteIds.length === 0) {
                querySiteIds = siteIds;
            } else {
                querySiteIds = new Set(querySiteIds);
                for (let id of querySiteIds) {
                    console.assert(siteIds.has(id));
                }
            }
        } else {
            querySiteIds = siteIds;
        }
        
        let unknownFields = new Set(Object.keys(query));

        if ('title' in query) {
            console.assert(query.title.constructor === String);
            unknownFields.delete('title');
        } else {
            query.title = '';
        }

        if ('writer' in query) {
            console.assert(query.writer.constructor === String);
            unknownFields.delete('writer');
        } else {
            query.writer = '';
        }

        if ('artist' in query) {
            console.assert(query.artist.constructor === String);
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

        if ('languageIds' in query) {
            console.assert(query.languageIds.constructor === Array);
            if (query.languageIds.length === 0) {
                query.languageIds = new Set(languages.keys());
            } else {
                query.languageIds = new Set(query.languageIds);
                for (let id of query.languageIds) {
                    console.assert(languages.has(id));
                }
            }
            unknownFields.delete('languageIds');
        } else {
            query.languageIds = new Set(languages.keys());
        }

        if (unknownFields.size !== 0) {
            throw new Error('Unknown query fields');
        }

        Object.freeze(query);

        return AsyncStream.fromIterable(querySiteIds)
            .map(async (siteId) => {
                let site = await getSiteById(siteId);
                for (let languageId of await site.getLanguageIds()) {
                    if (query.languageIds.has(languageId)) {
                        return site.searchManga(query);
                    }
                }
                return AsyncStream.empty;
            }).merge()
        ;
    };
});
