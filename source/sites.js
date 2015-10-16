'use strict';

import AsyncStream from '/utility/AsyncStream.js';
import languages from '/utility/languages.js';

% for no, site in enumerate(sites):
import site${ no } from 'sites/${ site }.js';
% endfor

let sites = {
    search(query) {
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

        let searchStreams = [
            % for no in range(len(sites)):
            site${ no },
            % endfor
        ].map(site => {
            return site.search(query)
                .map(result => {
                    return {
                        mangaSite: site,
                        mangaTitle: result.mangaTitle,
                        manga: result.manga,
                    };
                })
            ;
        });

        return AsyncStream.join(...searchStreams);
    }
};

export default sites;

