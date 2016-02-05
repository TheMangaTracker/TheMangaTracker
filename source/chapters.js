'use strict';

modules.define(async (require) => {
    let ng = await require('angular');
    let languages = await require('/utility/languages.js');
    let sites = await require('/sites.js');

    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])

    page.controller('page', [
        '$scope',
       ( $scope ) => {
        let [siteId, mangaId] = location.search.slice(1).split('/');
       
        $scope.manga = null;
        (async () => {
            let manga = await sites[siteId].getMangaById(mangaId);

            let viewManga = {
                site: { id: await manga.site.getId() },
                id: await manga.getId(),
                uri: await manga.getUri(),
                language: languages.get(await manga.getLanguageId()),
                title: await manga.getTitle(),
                chapters: [],
            };
            $scope.$apply(() => {
                $scope.manga = viewManga;
            });
            for (let chapter = await manga.getLastChapter(), i = 0; chapter !== null; chapter = await chapter.getPrevious(), ++i) {
                let j = i;
                let viewChapter = {
                    id: await chapter.getId(),
                    title: await chapter.getTitle(),
                };
                $scope.$apply(() => {
                    viewManga.chapters[j] = viewChapter;
                });
            }
        })();
    }]);

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

