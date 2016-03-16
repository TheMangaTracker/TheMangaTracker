'use strict';

define(async (require) => {
    let ng = await require('/thirdparty/angular.js');
    let sites = await require('/sites.js');

    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])

    page.controller('page', $scope => {
        let [siteId, mangaId, chapterId] = location.search.slice(1).split('/');
        
        $scope.chapter = null;
        (async () => {
            let site = sites[siteId];
            let manga = await site.getMangaById(mangaId);
            let chapter = await manga.getChapterById(chapterId);

            let viewChapter = {
                manga: { id: await manga.getId() },
                id: await chapter.getId(),
                uri: await chapter.getUri(),
                title: await chapter.getTitle(),
                pages: [],
            };
            $scope.$apply(() => {
                $scope.chapter = viewChapter;
            });
            for (let page = await chapter.getFirstPage(), i = 0; page !== null; page = await page.getNext(), ++i) {
                let j = i;
                let viewPage = {
                    id: await page.getId(),
                    uri: await page.getUri(),
                    imageUri: await page.getImageUri(),
                };
                $scope.$apply(() => {
                    viewChapter.pages[j] = viewPage;
                });
            }
        })();
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

