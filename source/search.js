'use strict';

require([
    '/sites.js', '/sites/search.js', '/utility/asyncCall.js', 'angular',
], (  sites    ,         search    ,           asyncCall    ,   ng     ) => {
    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])

    page.controller('page', $scope => {
        let abortSearch = null;

        $scope.encode = encodeURIComponent;

        $scope.toggleSearch = () => {
            if (abortSearch !== null) {
                abortSearch();    
                abortSearch = null;
                return;
            }

            $scope.mangas = [];

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

                onFirst(manga) {
                    $scope.$apply(() => {
                        $scope.mangas.push(manga);    
                    });
                },

                onRest(mangas) {
                    asyncCall(() => {
                        if (abortSearch !== null) {
                            mangas.request(callbacks);     
                        }
                    });
                },

            };    

            asyncCall(() => {
                search({
                    title: $scope.title,
                }).request(callbacks);
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

