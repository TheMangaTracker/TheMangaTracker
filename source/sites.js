'use strict';

import AsyncStream from '/utility/AsyncStream.js';

% for no, site in enumerate(sites):
import site${ no } from './sites/${ site }.js';
% endfor

let sites = {
    search(query) {
        query = Object.create(query);

        if (query.title === undefined) {
            query.title = null;    
        }

        if (query.writer === undefined) {
            query.writer = null;    
        }

        if (query.artist === undefined) {
            query.artist = null;    
        }

        if (query.isComplete === undefined) {
            query.isComplete = null;    
        }

        if (query.leftToRight === undefined) {
            query.leftToRight = null;    
        }

        return AsyncStream.of(
            % for no in range(len(sites)):
            site${ no }${ '' if loop.last else ',' }
            % endfor
        )
        .map(site => site.search(query))
        .flatten();  // TODO: make this first-loaded first-returned  
    }
};

export default sites;

