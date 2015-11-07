'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');
    let ng = await require('angular');

    let asyncCall = await require('/utility/asyncCall.js');
    let languages = await require('/utility/languages.js');

    let sites = await require('/sites.js');
    let search = await require('/sites/search.js');

    function parseQueryString(string) {
        let query = {};
        for (let pair of (string === '') ? [] : string.split('&')) {
            let [name, value] = pair.split('=');

            if (value === '') {
                continue;
            }

            name = decodeURIComponent(name);

            switch (name) {
              case 'sites':
              case 'languages':
                value = value.split(',').map(decodeURIComponent);
                break;
              default:
                value = decodeURIComponent(value);
            }

            query[name] = value;
        }
        return query;
    }

    function buildQueryString(query) {
        let pairs = [];
        for (let name in query) {
            let value = query[name];
            
            switch (name) {
              case 'sites':
              case 'languages':
                value = value.map(encodeURIComponent).join(',');
                break;
              default:
                value = encodeURIComponent(value);
            }

            if (value === '') {
                continue;
            }

            name = encodeURIComponent(name);
            pairs.push(name + '=' + value);
        }
        return pairs.join('&');
    }

    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }]);

    page.run([
        '$rootScope',
       ( $rootScope ) => {
        $rootScope.sites = [...sites];
        $rootScope.languages = [...languages].map(([id, name]) => ({ id, name }));

        $rootScope.buildQueryString = buildQueryString;
    }]);

    page.controller('page', $scope => {
        $scope.query = parseQueryString(location.search.slice(1));
        $scope.results = [];

        let results = search($scope.query).enumerate({});

        function loadMore() {
            results.request({
                onFirst([i, result]) {
                    $scope.$apply(() => {
                        $scope.results[i] = result;    
                    });
                },

                onRest(_results) {
                    results = _results;
                    loadMoreIfNeeded();
                },
            });
        }

        function loadMoreIfNeeded() {
            if ($(window).scrollTop() + $(window).height() >= $('#bottom').offset().top) {
                asyncCall(() => {
                    loadMore();
                });
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

