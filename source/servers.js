'use strict';

var servers;

define([], function() {
    let modules = [
      % for module in modules:
        '${ module }', 
      % endfor
    ];

    servers = {
        search(query) {
            let states = [];

            let i = 0;
            return function(consume) {
                let j = i++ % modules.length;
           
                if (typeof states[j] == 'function') {
                    let request = states[j];
                    request(consume);
                } else if (states[j] === undefined) {
                    let consumers = states[j] = [consume];
                    require([modules[j]], function(server) {
                        let request = states[j] = server.search(query);
                        while (consumers.length > 0) {
                            let consume = consumers.shift();
                            request(consume);
                        }
                    });           
                } else {
                    let consumers = states[j];    
                    consumers.push(consume);
                }
            };
        },   
    };
});

