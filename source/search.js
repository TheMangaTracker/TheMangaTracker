'use strict';

require([
    '/sites.js', '/sites/search.js', '/utility/asyncCall.js', 'angular'
], (  sites    ,         search    ,           asyncCall    ,   ng     ) => {
    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])

    page.controller('page', $scope => {
        let abortSearch = null;

        $scope.toggleSearch = () => {
            if (abortSearch !== null) {
                abortSearch();    
                abortSearch = null;
                return;
            }

            $scope.results = [];

            let aborts = new Set();

            let callbacks = {
                abort: {
                    onAdd: (abort) => {
                        aborts.add(abort);
                    },

                    onDrop: (abort) => {
                        aborts.delete(abort);
                    },
                },

                onEmpty() {
                    abortSearch = null;    
                },

                onFirst([i, result]) {
                    $scope.$apply(() => {
                        $scope.results[i] = result;    
                    });
                },

                onRest(results) {
                    asyncCall(() => {
                        if (abortSearch !== null) {
                            results.request(callbacks);     
                        }
                    });
                },

            };    

            asyncCall(() => {
                search({
                    title: $scope.title,
                })
                    .enumerate({})
                .request(callbacks);
            });

            abortSearch = () => {
                for (let abort of aborts) {
                    abort();
                }
            };
        };
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

