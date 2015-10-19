'use strict';

define([
    'require', '/utility/AsyncStream.js',
], ( require ,           AsyncStream    ) => {
    function getDetails(site, id) {
        return AsyncStream.of(site)
            .asyncMap((callbacks, site) => {
                require([
                    './' + site + '/getDetails.js',
                ], (                getDetails    ) => {
                    callbacks.return(getDetails);     
                });
            })
            .map(getDetails => {
                return getDetails(id);
            })
            .chainItems()
        ;
    }

    return getDetails;
});
