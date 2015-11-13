'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');
    let ng = await require('angular');

    let searchManga = await require('/core/searchManga.js');

    function parseQueryString(string) {
        if (string.startsWith('?')) {
            string = string.slice(1);
        }
        let query = {};
        for (let pair of (string === '') ? [] : string.split('&')) {
            let [name, value] = pair.split('=');

            if (value === '') {
                continue;
            }

            name = decodeURIComponent(name);

            switch (name) {
              case 'siteIds':
              case 'languageIds':
                value = value.split(',').map(decodeURIComponent);
                break;
              default:
                value = decodeURIComponent(value);
            }

            query[name] = value;
        }
        return query;
    }

    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }]);

    page.controller('page', $scope => {
        $scope.query = parseQueryString(location.search);
        $scope.results = [];

        let results = searchManga($scope.query)
            .map(async (manga) => {
                return {
                    siteId: await manga.site.getId(),
                    id: await manga.getId(),
                    title: await manga.getTitle(),
                };
            })
        ;

        async function loadMore() {
            let node = await results.evaluate();
            if (node === null) {
                return;
            }

            node.first.then(result => {
                $scope.$apply(() => {
                    $scope.results.push(result);    
                });
            });

            results = node.rest;

            loadMoreIfNeeded();
        }

        function loadMoreIfNeeded() {
            if ($(window).scrollTop() + $(window).height() >= $('#bottom').offset().top) {
                loadMore();
            }
        }

        $(window).scroll(() => {
            loadMoreIfNeeded();
        });

        loadMoreIfNeeded();
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

