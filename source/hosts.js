'use strict';

var hosts = (function() {
    var hosts = Object.create(null);

    return {
        register: function(host) {
            console.assert(hosts[host.url] === undefined);
            hosts[host.url] = host;          
        },

        search: function(query) {
            var available = [];
            var consumers = [];
            var iterators = {};
            $.each(hosts, function(_, host) {
                var iterator = host.search(query);
                iterator.busy = false;
                iterators[host.url] = iterator;
            });

            var pump = function() {
                while (consumers.length > 0 && (available.length > 0 || Object.keys(iterators).length == 0)) {
                    var consume = consumers.shift();
                    var manga = available.shift();    
                    consume(manga);
                }

                if (consumers.length > 0) {
                    tryGetMore();    
                }
            };

            var tryGetMore = function() {
                $.each($.extend({}, iterators), function(host, iterator) {
                    if (iterator.busy) {
                        return;    
                    }

                    iterator.busy = true;
                    iterator(function(manga) {
                        if (manga === undefined) {
                            delete iterators[host];
                            return;    
                        } 
                        available.push({ manga: manga, host: host });
                        iterator.busy = false;
                        pump();
                    });
                });    
            };

            return function(consume) {
                consumers.push(consume);
                pump();
            };
        },
    };    
})();
