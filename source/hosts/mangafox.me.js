'use strict';

hosts.register({
    url: 'http://mangafox.me',

    name: 'Manga Fox',

    iconUrl: 'http://mangafox.me/favicon.ico',

    search: function(query) {
        query = (function(a) {
            var b = {};

            b.advopts = 1;  // enable advanced search options 

            if (a.name) {
                b.name = a.name;
                b.name_method = 'cw';  // contains word (?)
            }

            return b;
        })(query); 

        var getNextPage = (function() {
            var available = [];
            var consumers = [];
            var gettingMore = false;
            var exhausted = false;

            var pump = function() {
                while (consumers.length > 0 && (available.length > 0 || exhausted)) {
                    var consume = consumers.shift();
                    var elements = available.shift();    
                    consume(elements);
                }

                if (consumers.length > 0) {
                    tryGetMore();    
                }
            };
            
            var tryGetMore = (function() {
                var nextPageIndex = 1; 
                
                return function() {
                    if (gettingMore || exhausted) {
                        return;    
                    }

                    gettingMore = true;
                    $.get('http://mangafox.me/search.php', $.extend({ page: nextPageIndex }, query), function(html) {
                        var match = />Sorry, can‘t search again within (\d+) seconds.</g.exec(html);
                        if (match) {
                            var waitSeconds = parseInt(match[1]); 
                            return setTimeout(function() {
                                gettingMore = false;
                                tryGetMore();
                            }, (waitSeconds + 1) * 1000);
                        }                
                    
                        var elements = $(createDocument(html));
                        available.push(elements);    
                        if (elements.find('#navnext .disable').length > 0) {
                            exhausted = true;    
                        } else {
                            ++nextPageIndex; 
                        }
                        gettingMore = false;
                        pump();
                    });
                };
            })();

            return function(consume) {
                consumers.push(consume);
                pump();
            };
        })();
        
        var available = [];   
        var consumers = [];
        var gettingMore = false;
        var exhausted = false;

        var pump = function() {
            while (consumers.length > 0 && (available.length > 0 || exhausted)) {
                var consume = consumers.shift();
                var manga = available.shift();    
                consume(manga);
            }

            if (consumers.length > 0) {
                tryGetMore();    
            }
        };

        var tryGetMore = function() {
            if (gettingMore || exhausted) {
                return;    
            }

            gettingMore = true;
            getNextPage(function(elements) {
                if (elements === undefined) {
                    exhausted = true;
                } else {
                    elements.find('#listing .series_preview').each(function() {
                        available.push($(this).attr('href'));                        
                    }); 
                }
                gettingMore = false;
                pump();
            });
        };

        return function(consume) {
            consumers.push(consume);
            pump();
        };
    },
});
    
