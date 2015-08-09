'use strict';

import AsyncStream from '/utility/AsyncStream.js';

% for i, server in enumerate(servers):
import search${ str(i).zfill(len(str(len(servers)))) } from './${ server }/search.js';
% endfor

export default function search(query) {
    return AsyncStream.of(
        % for i in range(len(servers)):
        search${ str(i).zfill(len(str(len(servers)))) + ('' if loop.last else ',') }
        % endfor
    )
    .map(search => search(query))
    .flatten;  // TODO: make this first-loaded first-returned  
}

