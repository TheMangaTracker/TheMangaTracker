'use strict';

modules.define(async (require) => {
    let ng = await require('angular');
    let $ = await require('jQuery');
    let AsyncStream = await require('/utility/AsyncStream.js');
    let languages = await require('/utility/languages.js');
    let sites = await require('/sites.js');

    let viewLanguages = [];
    for (let [id, name] of languages) {
        viewLanguages.push({ id, name });
    }

    let viewSites = [];
    for (let site of sites) {
        viewSites.push({
            id: await site.getId(),
            uri: await site.getUri(),
            name: await site.getName(),
            iconUri: await site.getIconUri(),
        });
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
        $rootScope.languages = viewLanguages;
        $rootScope.sites = viewSites;
    }]);

    page.controller('page', [
        '$scope',
       ( $scope ) => {
        $scope.title = '';
        $scope.languageIds = viewLanguages.map(l => l.id);
        $scope.siteIds = viewSites.map(s => s.id);
        
        $scope.search = function search() {
            let query = {};

            query.title = $scope.title.trim();

            let titleTester = query.title
              .toLowerCase()
              .replace(/[^0-9A-Za-z]+/g, '.*');
            titleTester = new RegExp(titleTester, 'i');
            query.titleMatches = (title) => titleTester.test(title);

            query.languageIds = new Set($scope.languageIds);

            let mangas = AsyncStream.fromIterable($scope.siteIds)
              .map(id => sites[id].findMangas(query))
              .merge();

            let viewMangas = $scope.mangas = [];

            async function loadMore() {
                if ($scope.mangas !== viewMangas) {
                    return;
                }

                let node = await mangas.evaluate();
                if (node === null) {
                    return;
                }

                let position = viewMangas.push(undefined) - 1;
                Promise.resolve(node.first).then(async (manga) => {
                    let siteId = await manga.site.getId();
                    let viewManga = {
                        site: viewSites.filter(s => s.id === siteId)[0],
                        id: await manga.getId(),
                        uri: await manga.getUri(),
                        languageId: await manga.getLanguageId(),
                        title: await manga.getTitle(),
                    };
                    $scope.$apply(() => {
                        viewMangas[position] = viewManga;    
                    });
                });

                mangas = node.rest;

                loadMoreIfNeeded();
            }

            function loadMoreIfNeeded() {
                if ($(window).scrollTop() + $(window).height() >= $('#bottom').offset().top) {
                    loadMore();
                }
            }

            $(window)
              .off('scroll')
              .on('scroll', loadMoreIfNeeded);

            loadMoreIfNeeded();
        };

        $scope.mangas = [];
    }]);

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

