'use strict';

define([
    '/utility/LazyAsync.js',
    '/utility/createEmptyDocument.js',
    '/thirdparty/jquery.js',
], function() {
    let server = {};

    server.search = (function() {
        let interval = 5000;
        let nextTime = Date.now();

        return function(query) {
            query = (function(a) {
                let b = {};

                b.advopts = 1;  // enable advanced search options 

                if (a.name) {
                    b.name = a.name;
                    b.name_method = 'cw';  // contains word (?)
                }

                return b;
            })(query); 

            let pages = (function() {
                let abort = undefined;
                let pageNo = 1;
                return new LazyAsync({
                    whenRequested(provide, finish, error) {
                        (function getPageHtml(pageNo) {
                            if (nextTime > Date.now()) {
                                let timerId = setTimeout(function() {
                                    abort = undefined;
                                    getPageHtml(pageNo);     
                                }, nextTime - Date.now());    
                                abort = function() {
                                    clearTimeout(timerId);    
                                };
                                return;
                            }

                            let jqXHR = $.get('http://mangafox.me/search.php', $.extend({ page: pageNo }, query))
                                .done(function(html) {
                                    abort = undefined;

                                    let tooSoon = />Sorry, can‘t search again within (\d+) seconds.</g.exec(html);
                                    if (tooSoon) {
                                        interval = parseInt(tooSoon[1]) * 1000;
                                    }             

                                    nextTime = Date.now() + interval + 500;
                                
                                    if (tooSoon) {
                                        getPageHtml(pageNo);
                                        return;
                                    }             

                                    let page = $(html, createEmptyDocument());

                                    let selectedPageButton = page.find('#nav .red');
                                    if (selectedPageButton.length != 1) {
                                        error('Page structure not recognized');
                                        return;
                                    }
                                    
                                    provide(page);    

                                    if (selectedPageButton.next().is('#navnext')) {
                                        finish();
                                        return;
                                    } 
                                })
                                .fail(function(jqXHR, textStatus, errorThrown) {
                                    abort = undefined;
                                    error(textStatus + errorThrown);
                                });

                            nextTime = Date.now() + interval + 1000;    

                            abort = function() {
                                jqXHR.abort();  
                            };
                        })(pageNo++);
                    },
                    whenDiscarded() {
                        if (abort !== undefined) {
                            abort();
                            abort = undefined;
                        }
                    },
                }); 
            })();

            return (function() {
                let mangaUrls = [];
                return new LazyAsync({
                    whenRequested(provide, finish, error) {
                        if (mangaUrls.length > 0) {
                            let mangaUrl = mangaUrls.shift();
                            provide(mangaUrl);    
                            return;
                        }
                        
                        if (pages === undefined) {
                            finish();
                            return;
                        }

                        pages.request({
                            whenProvided(page) {
                                let mangaLinks = page.find('#listing a.series_preview');
                                if (mangaLinks.length == 0) {
                                    error('Page structure not recognized');
                                    return;
                                }

                                mangaLinks.each(function() {
                                    let mangaUrl = $(this).attr('href');
                                    mangaUrls.push(mangaUrl);
                                }); 

                                let mangaUrl = mangaUrls.shift();
                                provide(mangaUrl);
                            },
                            whenFinished() {
                                pages = undefined;
                                if (mangaUrls.length == 0) {
                                    finish();    
                                }
                            },
                            whenError: error,
                        });         
                    },
                    whenDiscarded() {
                        pages.discard();    
                    },
                });
            })();
        };
    })();

    let makeChapterGetter = function(selectChapterAnchor) {
        return function(mangaUrl) {
            let abort = undefined;
            return new LazyAsync({
                whenRequested(provide, finish, error) {
                    let jqXHR = $.get(mangaUrl)
                        .done(function(html) {
                            abort = undefined;

                            let page = $(html, createEmptyDocument());
                            
                            let chapterAnchors = page.find('#chapters');
                            if (chapterAnchors.length == 0) {
                                error('Page structure not recognized');
                                return;
                            }

                            chapterAnchors = chapterAnchors.find('.chlist a.tips');

                            if (chapterAnchors.length != 0) {
                                let chapterAnchor = selectChapterAnchor(chapterAnchors);
                                let chapterUrl = chapterAnchor.attr('href');
                                chapterUrl = chapterUrl.slice(0, chapterUrl.lastIndexOf('/'));  // remove page part 
                                provide(chapterUrl);
                            } else {
                                provide(undefined);    
                            }

                            finish();
                        })
                        .fail(function(jqXHR, textStatus, errorThrown) {
                            abort = undefined;
                            error(textStatus + errorThrown);
                        });

                    abort = function() {
                        jqXHR.abort();
                    };
                },    
                whenDiscarded() {
                    if (abort !== undefined) {
                        abort();
                        abort = undefined;
                    } 
                },
            });
        };
    };

    server.getFirstChapter = makeChapterGetter(function(chapterAnchors) {
        return chapterAnchors.last();    
    });
        
    server.getLastChapter = makeChapterGetter(function(chapterAnchors) {
        return chapterAnchors.first();    
    });
   
    return server;
}); 
