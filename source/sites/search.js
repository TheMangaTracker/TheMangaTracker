'use strict';

import AsyncStream from '/utility/AsyncStream.js';

% for no, site in enumerate(sites):
import search${ no } from './${ site }/search.js';
% endfor

export default function search(query) {
    query = Object.create(query);

    if (query.title === undefined) {
        query.title = null;    
    }

    if (query.writer === undefined) {
        query.writer = null;    
    }

    if (query.writer === undefined) {
        query.writer = null;    
    }

    if (query.isComplete === undefined) {
        query.isComplete = null;    
    }

    if (query.leftToRight === undefined) {
        query.leftToRight = null;    
    }

    return AsyncStream.of(
        % for no in range(len(sites)):
        search${ no }${ '' if loop.last else ',' }
        % endfor
    )
    .map(search => search(query))
    .flatten();  // TODO: make this first-loaded first-returned  
}

