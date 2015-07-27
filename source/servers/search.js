'use strict';

define([
  % for server in servers:
    './${ server }/search.js', 
  % endfor
    '/utility/AsyncBufferedIterator.js',
], function() {
    let search_fns = Array.prototype.slice.call(arguments, 0, ${ len(servers) });

    return function(query) {
        let iterators = [];
        for (let search of search_fns) {
            let iterator = search(query);
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
    };   
});

