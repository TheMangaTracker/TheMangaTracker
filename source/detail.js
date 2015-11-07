'use strict';

modules.define(async (require) => {
    let ng = await require('angular');

    let asyncCall = await require('/utility/asyncCall.js');

    let load = await require('/sites/load.js');

    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])

    page.controller('page', $scope => {
        let [site, id] = location.search.slice(1).split('/');
        
        $scope.site = site;
        $scope.id = id;
        $scope.titles = [];
        $scope.chapters = [];
        load(site, id).request({
            onFirst: (manga) => {
                $scope.$apply(() => {
                    $scope.titles = manga.titles;
                });
                let chaptersCallbacks = {
                    onFirst: ([i, chapter]) => {
                        $scope.$apply(() => {
                            $scope.chapters[i] = chapter;
                        });
                    },
                    onRest: (chapters) => {
                        asyncCall(() => {
                            chapters.request(chaptersCallbacks);
                        })
                    },
                };
                manga.chapters
                    .enumerate({})
                .request(chaptersCallbacks);
            }
        }); 
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

