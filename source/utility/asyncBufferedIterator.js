'use strict';

var asyncBufferedIterator;

define([], function() {
    asyncBufferedIterator = function(request) {
        let busy = false;
        let exhausted = false;
        let consumers = [];
        let items = [];   
        
        let pump = function() {
            while (consumers.length > 0 && items.length > 0) {
                let consume = consumers.shift();
                let item = items.shift();
                consume(item);
            } 

            if (exhausted) {
                while (consumers.length > 0) {
                    let consume = consumers.shift();
                    consume(undefined);
                } 
            } else if (consumers.length > 0 && !busy) {
                busy = true;
                request(function(newItems) {
                    busy = false;
                    if (newItems === undefined) {
                        exhausted = true;
                    } else {
                        for (let newItem of newItems) {
                            items.push(newItem);
                        }        
                    }
                    pump();
                });     
            }
        };

        return function(consume) {
            consumers.push(consume);
            pump();
        };
    };
});
