'use strict';

import '/thirdparty/angular.js';

import search from '/sites/search.js';

angular.module('page', [])
.controller('page', $scope => {
    $scope.title = 'Search';
    
    let abortSearch = null;
    $scope.search = () => {
        if (abortSearch !== null) {
            abortSearch();    
            abortSearch = null;
            return;
        }

        $scope.mangas = [];

        let aborts = new Set();

        let callbacks = {
            addAbort(abort) {
                aborts.add(abort); 
            },

            deleteAbort(abort) {
                aborts.delete(abort); 
            },

            break() {
                abortSearch = null;    
            },

            yield(manga) {
                $scope.$apply(() => {
                    $scope.mangas.push(manga);    
                });
            },

            continue(mangas) {
                mangas.request(callbacks);     
            },
        };    

        search({ name: $scope.name }).request(callbacks);

        abortSearch = () => {
            for (let abort of aborts) {
                abort();
            }
        };
    };
});

angular.element(document).ready(() => {
    angular.bootstrap(document, ['page']);    
});

