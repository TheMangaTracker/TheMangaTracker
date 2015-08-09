'use strict';

import AsyncStream from '/utility/AsyncStream.js';

% for no, site in enumerate(sites):
import search${ no } from './${ site }/search.js';
% endfor

export default function search(query) {
    return AsyncStream.of(
        % for no in range(len(sites)):
        search${ no }${ '' if loop.last else ',' }
        % endfor
    )
    .map(search => search(query))
    .flatten;  // TODO: make this first-loaded first-returned  
}

