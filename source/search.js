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

            let abort = null;

            let callbacks = {
                setAbort(_abort) {
                    abort = _abort; 
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
                if (abort !== null) {
                    abort();
                }
            };
        };
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

