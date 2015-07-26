'use strict';

define([
    '/thirdparty/jquery.js',
    '/utility/AsyncBufferedIterator.js',
    '/utility/createEmptyDocument.js',
], function() {
    return {
        url: 'http://mangafox.me',

        name: 'Manga Fox',

        iconUrl: 'http://mangafox.me/favicon.ico',

        search: (function() {
            let interval = 5000;
            let nextTime = Date.now();

            return function(query, provideManga) {
                query = (function(a) {
                    let b = {};

                    b.advopts = 1;  // enable advanced search options 

                    if (a.name) {
                        b.name = a.name;
                        b.name_method = 'cw';  // contains word (?)
                    }

                    return b;
                })(query); 

                let pageIterator = (function() {
                    let abort = undefined;
                    let pageNo = 1;
                    return new AsyncBufferedIterator({
                        whenNeedMore(provideMore, noMore) {
                            (function getPageHtml(pageNo) {
                                if (nextTime > Date.now()) {
                                    let timerId = setTimeout(function() {
                                        abort = undefined;
                                        getPageHtml(pageNo);     
                                    }, nextTime - Date.now());    
                                    abort = function() {
                                        clearTimeout(timerId);    
                                    };
                                } else {
                                    nextTime = Date.now() + interval + 1000;    
                                    let jqXHR = $.get('http://mangafox.me/search.php', $.extend({ page: pageNo }, query), function(html) {
                                        abort = undefined;

                                        let match = />Sorry, can‘t search again within (\d+) seconds.</g.exec(html);
                                        if (match) {
                                            interval = parseInt(match[1]) * 1000;
                                            nextTime = Date.now() + interval;
                                            getPageHtml(pageNo);
                                            return;
                                        }             
                                    
                                        let page = $(html, createEmptyDocument());

                                        if (parseInt(page.find('#nav .red').text()) < pageNo) {
                                            noMore();
                                            return;
                                        } 
                                        
                                        provideMore([page]);    
                                    });
                                    abort = function() {
                                        jqXHR.abort();  
                                    };
                                }
                            })(pageNo++);
                        },
                        whenClosed() {
                            if (abort !== undefined) {
                                abort();
                                abort = undefined;
                            }
                        },
                    }); 
                })();

                return new AsyncBufferedIterator({
                    whenNeedMore(provideMore, noMore) {
                        pageIterator.requestNext({
                            whenProvidedNext(page) {
                                let mangas = [];
                                page.find('#listing .series_preview').each(function() {
                                    let manga = $(this).attr('href');
                                    mangas.push(manga);
                                }); 
                                provideMore(mangas);
                            },
                            whenNoNext() {
                                noMore();    
                            },
                        });         
                    },
                    whenClosed() {
                        pageIterator.close();    
                    },
                });
            };
        })(),
    };
}); 
