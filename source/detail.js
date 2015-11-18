'use strict';

modules.define(async (require) => {
    let ng = await require('angular');


    let getSiteById = await require('/core/getSiteById.js');

    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])

    page.controller('page', $scope => {
        let [siteId, mangaId] = location.search.slice(1).split('/');
       
        $scope.manga = null;
        (async () => {
            let site = await getSiteById(siteId);
            let manga = await site.getMangaById(mangaId);

            let _manga = {
                site: { id: await site.getId() },
                id: await manga.getId(),
                uri: await manga.getUri(),
                title: await manga.getTitle(),
                alternativeTitles: await manga.getAlternativeTitles(),
                coverImageUri: await manga.getCoverImageUri(),
                language: await manga.getLanguage(),
                status: await manga.getStatus(),
                writers: await manga.getWriters(),
                artists: await manga.getArtists(),
                summaryParagraphs: await manga.getSummaryParagraphs(),
                chapters: [],
            };
            $scope.$apply(() => {
                $scope.manga = _manga;
            });
            for (let chapter = await manga.getLastChapter(), i = 0; chapter !== null; chapter = await chapter.getPreviousChapter(), ++i) {
                let j = i;
                let _chapter = {
                    id: await chapter.getId(),
                    title: await chapter.getTitle(),
                };
                $scope.$apply(() => {
                    _manga.chapters[j] = _chapter;
                });
            }
        })();
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

