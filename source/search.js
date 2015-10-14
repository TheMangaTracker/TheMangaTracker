'use strict';

import '/thirdparty/angular.js';

import asyncCall from '/utility/asyncCall.js';

import sites from '/sites.js';

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

        $scope.results = [];

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

            yield(result) {
                $scope.$apply(() => {
                    $scope.results.push(result);    
                });
            },

            continue(results) {
                asyncCall(() => {
                    if (abortSearch !== null) {
                        results.request(callbacks);     
                    }
                });
            },

        };    

        asyncCall(() => {
            sites.search({ title: $scope.name }).request(callbacks);
        });

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

