'use strict';

define([
    '/thirdparty/jquery.js',
    '/utility/asyncBufferedIterator.js',
    '/utility/createEmptyDocument.js',
], function() {
    return {
        url: 'http://mangafox.me',

        name: 'Manga Fox',

        iconUrl: 'http://mangafox.me/favicon.ico',

        search(query, provideManga) {
            query = (function(a) {
                let b = {};

                b.advopts = 1;  // enable advanced search options 

                if (a.name) {
                    b.name = a.name;
                    b.name_method = 'cw';  // contains word (?)
                }

                return b;
            })(query); 

            let requestPage = (function() {
                let pageNo = 1;
                return asyncBufferedIterator(function(providePages) {
                    (function tryLoadHtml(pageNo) {
                        $.get('http://mangafox.me/search.php', $.extend({ page: pageNo }, query), function(html) {
                            let match = />Sorry, can‘t search again within (\d+) seconds.</g.exec(html);
                            if (match) {
                                let waitSeconds = parseInt(match[1]); 
                                setTimeout(function() {
                                    tryLoadHtml(pageNo);
                                }, (waitSeconds + 1) * 1000);
                                return;
                            }                
                        
                            let page = $(html, createEmptyDocument());

                            if (parseInt(page.find('#nav .red').text()) < pageNo) {
                                providePages(undefined);
                                return;
                            } 
                            
                            providePages([page]);    
                        });
                    })(pageNo++);
                }); 
            })();

            let requestManga = asyncBufferedIterator(function(provideMangas) {
                requestPage(function(page) {
                    if (page === undefined) {
                        provideMangas(undefined);
                        return;
                    }

                    let mangas = [];
                    page.find('#listing .series_preview').each(function() {
                        let manga = $(this).attr('href');
                        mangas.push(manga);
                    }); 
                    provideMangas(mangas);
                });         
            });

            return requestManga;
        },
    };
}); 
