'use strict';

(function() {
    let domains = [
      % for server in servers:
        '${ server }', 
      % endfor
    ];
    
    let modules = [];
    for (let domain of domains) {
        let module = './servers/' + domain + '.js'; 
        modules.push(module);
    }

    define(modules.concat([
        '/utility/LazyAsync.js',
    ]), function() {
        let servers = new Map();
        for (let i = 0; i < ${ len(servers) }; ++i) {
            let domain = domains[i];
            let server = arguments[i];
            servers.set(domain, server);    
        }

        return {
            search(query) {
                let iterators = new Map();
                for (let server of servers.values()) {
                    let iterator = server.search(query);
                    iterators.set(iterator, server);
                }

                let mangas = [];
                return new LazyAsync({
                    whenRequested(provide, finish, error) {
                        if (mangas.length > 0) {
                            let manga = mangas.shift();    
                            provide(mangas);
                            return;
                        } 

                        if (iterators.size == 0) {
                            finish();
                            return;
                        }

                        for (let iterator of iterators.keys()) {
                            if (iterator.isBusy) {
                                continue;    
                            }

                            let server = iterators.get(iterator);
                            iterators.delete(iterator);
                            iterators.set(iterator, server);

                            iterator.request({
                                whenProvided(mangaUrl) {
                                    let manga = {
                                        url: mangaUrl,
                                        server,
                                    };
                                    if (provide !== undefined) {
                                        provide(manga);    
                                        provide = undefined;
                                        return;
                                    }
                                    mangas.push(manga);    
                                },
                                whenFinished() {
                                    iterators.delete(iterator);
                                    if (iterators.size == 0) {
                                        finish(); 
                                    }
                                },
                                whenError: error,
                            });
                        }
                    },
                    whenDiscarded() {
                        for (let iterator of iterators.keys()) {
                            iterator.discard(); 
                        }
                    },
                });
            },
        };   
    });
})();
