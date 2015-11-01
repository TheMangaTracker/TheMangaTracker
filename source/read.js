'use strict';

require([
    '/sites/load.js', '/utility/asyncCall.js', 'angular'
], (        load    ,           asyncCall    ,   ng     ) => {
    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])

    page.controller('page', $scope => {
        let [site, mangaId, id] = location.search.slice(1).split('/');
        
        $scope.site = site;
        $scope.mangaId = mangaId;
        $scope.id = id;
        $scope.pages = [];
        load(site, mangaId, id).request({
            onFirst: (chapter) => {
                $scope.$apply(() => {
                    $scope.title = chapter.title;
                });
                let pagesCallbacks = {
                    onFirst: ([i, page]) => {
                        $scope.$apply(() => {
                            $scope.pages[i] = page;
                        });
                    },
                    onRest: (pages) => {
                        asyncCall(() => {
                            pages.request(pagesCallbacks);
                        })
                    },
                };
                chapter.pages
                    .enumerate({})
                .request(pagesCallbacks);
            }
        }); 
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

