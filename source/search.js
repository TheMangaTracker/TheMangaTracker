'use strict';

import '/thirdparty/angular.js';

import search from '/servers/search.js';

angular.module('page', [])
.controller('page', $scope => {
    $scope.title = 'Search';
    
    let abortPreviousSearch = () => {};

    $scope.search = () => {
        abortPreviousSearch();    

        $scope.mangas = [];

        let abort = null;

        let i = 0;
        let cbs = {
            setAbort(newAbort) {
                abort = newAbort;
            },

            return(manga, nextSearchStream) {
                if (arguments.length == 0) {
                    console.log('done.');      
                    return;
                }

                if (i++ > 500) {
                    console.log('limit.');      
                    return;
                }

                $scope.$apply(() => {
                    $scope.mangas.push(manga); 
                });  

                nextSearchStream.request(cbs);
            },

            throw(message) {
                console.log('error: ' + message);    
            }
        };

        search({ name: $scope.name }).request(cbs);

        abortPreviousSearch = () => {
            if (abort) {
                abort();
                abort = null;
            }
        };
    };
});

angular.element(document).ready(() => {
    angular.bootstrap(document, ['page']);    
});

