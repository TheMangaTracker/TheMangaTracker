'use strict';

import '/thirdparty/angular.js';

import asyncCall from '/utility/asyncCall.js';

import search from '/sites/search.js';

angular.module('page', [])
.controller('page', $scope => {
    $scope.title = 'Search';
    
    let abortPreviousSearch = () => {};

    $scope.search = () => {
        abortPreviousSearch();    

        $scope.mangas = [];

        let abort;

        let i = 0;
        let cbs = {
            setAbort(_abort) {
                abort = _abort;    
            },
            
            return(manga) {
                $scope.$apply(() => {
                    $scope.mangas.push(manga);    
                });
            },

            continue(rest) {
                if (i++ > 500) {
                    return;    
                }

                asyncCall(() => {
                    rest.request(cbs);    
                });
            },

            throw(error) {
                console.error(error);    
            },
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

