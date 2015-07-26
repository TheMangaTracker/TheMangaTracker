'use strict';

var servers;

define([
  % for module in modules:
    '${ module }', 
  % endfor
    '/utility/AsyncBufferedIterator.js',
], function() {
    servers = (function(servers) {
        return {
            search(query) {
                let iterators = [];
                for (let server of servers) {
                    let iterator = server.search(query);
                    iterators.push(iterator);
                }

                return new AsyncBufferedIterator({
                    whenNeedMore(provideMore, noMore) {
                        let iterator = iterators.shift();
                        iterators.push(iterator);
                        iterator.requestNext({
                            whenProvidedNext(item) {
                                provideMore([item]);        
                            },
                            whenNoNext() {
                                let index = iterators.indexOf(iterator);
                                if (index != -1) {
                                    iterators.splice(index, 1);    
                                    if (iterators.length == 0) {
                                        noMore();
                                    }
                                }
                            },
                        });
                    },
                    whenClosed() {
                        for (let iterator of iterators) {
                            iterator.close(); 
                        }
                    },
                });
            },   
        };
    })(new Set(Array.prototype.slice.call(arguments, 0, ${ len(modules) })));
});
