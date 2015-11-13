'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');
    let ng = await require('angular');

    let getSiteById = await require('/core/getSiteById.js');

    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])

    page.controller('page', $scope => {
        let [siteId, mangaId, chapterId] = location.search.slice(1).split('/');
        let pageId = location.hash.slice(1) || null;
        
        (async () => {
            let site = await getSiteById(siteId);
            let manga = await site.getMangaById(mangaId);
            let chapter = await manga.getChapterById(chapterId);
            let _chapter = {
                title: await chapter.getTitle(),
                pages: [],
            };
            $scope.$apply(() => {
                $scope.chapter = _chapter;
            });
            for (let page = await chapter.getFirstPage(), i = 0; page !== null; page = await page.getNextPage(), ++i) {
                let j = i;
                let _page = {
                    id: await page.getId(),
                    imageUri: await page.getImageUri(),
                };
                $scope.$apply(() => {
                    _chapter.pages[j] = _page;
                });
            }
        })();
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

