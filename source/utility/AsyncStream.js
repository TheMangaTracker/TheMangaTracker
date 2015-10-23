'use strict';

define([
], () => {
    function ensureDefaults(callbacks) {
        let isFull = callbacks.abort
                  && callbacks.onEmpty
                  && callbacks.onFirst
                  && callbacks.onRest
                  && callbacks.onError;

        if (isFull) {
            return callbacks;
        }

        callbacks = Object.create(callbacks);

        if (!callbacks.abort) {
            callbacks.abort = {
                onAdd(abort) {},
                onDrop(abort) {},
            };
        }

        if (!callbacks.onEmpty) {
            callbacks.onEmpty = () => {};
        }

        if (!callbacks.onFirst) {
            callbacks.onFirst = first => {};
        }
        
        if (!callbacks.onRest) {
            callbacks.onRest = rest => {};
        }
        
        if (!callbacks.onError) {
            callbacks.onError = error => {
                console.error(error, error.stack);    
            };
        }

        return callbacks;
    }

    function refine(callbacks, newCallbacks) {
        let refinedCallbacks = Object.create(callbacks);

        for (let name of Object.keys(newCallbacks)) {
            console.assert(name in refinedCallbacks);
            refinedCallbacks[name] = newCallbacks[name];    
        }

        return refinedCallbacks;
    }

    function singularize(callbacks) {
        return {
            abort: callbacks.abort,
            onResult: callbacks.onFirst,
            onError: callbacks.onError,
        };
    }

    function asynchronize(transform) {
        return function(callbacks, ...args) {
            let res;

            try {
                res = transform(...args);
            } catch (error) {
                callbacks.onError(error);
                return;
            }

            callbacks.onResult(res);
        };    
    }

    let REQUEST = Symbol('REQUEST');

    class AsyncStream {
        constructor(request = callbacks => { callbacks.onEmpty(); }) {
            this[REQUEST] = callbacks => {
                let queue = [callbacks];

                this[REQUEST] = callbacks => {
                    queue.push(callbacks);
                };

                let rest;
                request(refine(callbacks, {
                    onEmpty: () => {
                        for (let i = 0; i < queue.length; ++i) {
                            let callbacks = queue[i];
                            callbacks.onEmpty();
                        }
                        this[REQUEST] = callbacks => {
                            callbacks.onEmpty();
                        };
                    },

                    onFirst: (first) => {
                        for (let i = 0; i < queue.length; ++i) {
                            let callbacks = queue[i];
                            callbacks.onFirst(first);
                        }
                        this[REQUEST] = callbacks => {
                            callbacks.onRest(rest);
                            callbacks.onFirst(first);
                        };
                    },

                    onRest: (_rest) => {
                        rest = _rest;
                        for (let i = 0; i < queue.length; ++i) {
                            let callbacks = queue[i];
                            callbacks.onRest(rest);
                        }
                        this[REQUEST] = callbacks => {
                            callbacks.onRest(rest);
                            queue.push(callbacks);
                        };
                    },

                    onError: (error) => {
                        for (let i = 0; i < queue.length; ++i) {
                            let callbacks = queue[i];
                            callbacks.onError(error);
                        }
                        this[REQUEST] = callbacks => {
                            callbacks.onError(error);
                        };
                    },
                }));
            };  
        }   

        request(callbacks) {
            this[REQUEST](ensureDefaults(callbacks));
        }

        $(metaTransform) {
            return metaTransform(this);
        }
       
        static from(iterator) {
            return new AsyncStream(callbacks => {
                let value, done;

                try {
                    if (Symbol.iterator in iterator) {
                        iterator = iterator[Symbol.iterator]();
                    }

                    ({ value, done } = iterator.next());
                } catch (error) {
                    callbacks.onError(error);
                    return;
                }

                if (done) {
                    callbacks.onEmpty();
                    return;
                }

                callbacks.onRest(AsyncStream.from(iterator));
                callbacks.onFirst(value);    
            });    
        }

        static of(...values) {
            return AsyncStream.from(values);    
        }

        static repeat(what) {
            return new AsyncStream(callbacks => {
                callbacks.onRest(AsyncStream.repeat(what));
                callbacks.onFirst(what);
            });    
        }

        static count({ from = 0, to = Number.MAX_SAFE_INTEGER, by = 1 }) {
            return new AsyncStream(callbacks => {
                if (by > 0 && from >= to || by < 0 && from <= to) {
                    callbacks.onEmpty();
                } else {
                    callbacks.onRest(AsyncStream.count({ from: from + by, to, by }));
                    callbacks.onFirst(from);
                }
            });    
        }

        asyncMap(transform) {
            return new AsyncStream(callbacks => {
                this.request(refine(callbacks, {
                    onFirst: (first) => {
                        transform(singularize(callbacks), first);
                    },

                    onRest: (rest) => {
                        callbacks.onRest(rest.asyncMap(transform));
                    },
                }));    
            });
        }

        map(transform) {
            return this.asyncMap(asynchronize(transform));    
        }

        asyncFold(initial, combine) {
            return new AsyncStream(callbacks => {
                let rest;
                this.request(refine(callbacks, {
                    onEmpty: () => {
                        callbacks.onRest(new AsyncStream());
                        callbacks.onFirst(initial);
                    },

                    onFirst: (first) => {
                        combine(refine(singularize(callbacks), {
                            onResult: (result) => {
                                rest.asyncFold(result, combine).request(callbacks);
                            }, 
                        }), initial, first);
                    },

                    onRest: (_rest) => {
                        rest = _rest;
                    },
                }));    
            });
        }
        
        fold(initial, combine) {
            return this.asyncFold(initial, asynchronize(combine));    
        }

        asyncFilter(predicate) {
            return new AsyncStream(callbacks => {
                let rest;
                this.request(refine(callbacks, {
                    onFirst: (first) => {
                        predicate(refine(singularize(callbacks), {
                            onResult: (pass) => {
                                if (pass) {
                                    callbacks.onRest(rest);
                                    callbacks.onFirst(first);
                                } else {
                                    rest.request(callbacks);
                                }
                            }
                        }), first);
                    },

                    onRest: (_rest) => {
                        rest = _rest.asyncFilter(predicate);
                    },
                }));    
            });
        }

        filter(predicate) {
            return this.asyncFilter(asynchronize(predicate));    
        }

        chain(that = null) {
            if (arguments.length === 0) {
                return new AsyncStream(callbacks => {
                    let rest;
                    this.request(refine(callbacks, {
                        onFirst: (first) => {
                            first.chain(rest.chain()).request(callbacks);
                        },

                        onRest: (_rest) => {
                            rest = _rest;
                        },
                    }));    
                });
            }

            return new AsyncStream(callbacks => {
                this.request(refine(callbacks, {
                    onEmpty: () => {
                        that.request(callbacks);  
                    },

                    onRest: (rest) => {
                        callbacks.onRest(rest.chain(that));
                    },
                }));    
            });
        }

        join(that) {
            if (arguments.length === 0) {
                return new AsyncStream(callbacks => {
                    let rest;
                    this.request(refine(callbacks, {
                        onFirst: (first) => {
                            first.join(rest.join()).request(callbacks);
                        },

                        onRest: (_rest) => {
                            rest = _rest;
                        },
                    }));    
                });
            }

            return new AsyncStream(callbacks => {
                let leader = null;
                let streams = [this, that];
                for (let i = 0; i < streams.length; ++i) {
                    streams[i].request(refine(callbacks, {
                        onEmpty: () => {
                            streams[i] = null;
                        },

                        onFirst: (first) => {
                            if (leader === i) {
                                callbacks.onFirst(first);
                            }
                        },

                        onRest: (rest) => {
                            if (leader === null) {
                                leader = i;
                                if (streams[1 - i] !== null) {
                                    callbacks.onRest(streams[1 - i].join(rest));
                                } else {
                                    callbacks.onRest(rest);
                                }
                            }
                        },
                    }));   
                }
            });
        }

        asyncChopIf(predicate) {
            return new AsyncStream(callbacks => {
                let rest;
                this.request(refine(callbacks, {
                    onFirst: (first) => {
                        predicate(refine(singularize(callbacks), {
                            onResult: (shouldChop) => {
                                if (shouldChop) {
                                    callbacks.onEmpty();
                                } else {
                                    callbacks.onRest(rest.asyncChopIf(predicate));
                                    callbacks.onFirst(first);
                                }
                            }, 
                        }), first);
                    },

                    onRest: (_rest) => {
                        rest = _rest;
                    },
                }));    
            });
        }

        chopIf(predicate) {
            return this.asyncChopIf(asynchronize(predicate));
        }

        asyncChopNextIf(predicate) {
            return new AsyncStream(callbacks => {
                let rest;
                this.request(refine(callbacks, {
                    onFirst: (first) => {
                        predicate(refine(singularize(callbacks), {
                            onResult: (shouldChop) => {
                                if (shouldChop) {
                                    callbacks.onRest(new AsyncStream());
                                } else {
                                    callbacks.onRest(rest.asyncChopNextIf(predicate));
                                }

                                callbacks.onFirst(first);
                            }, 
                        }), first);
                    },

                    onRest: (_rest) => {
                        rest = _rest;
                    },
                }));    
            });
        }

        chopNextIf(predicate) {
            return this.asyncChopNextIf(asynchronize(predicate));
        }

        static zip(streams) {
            return new AsyncStream(callbacks => {
                let keys = Object.keys(streams);
                let firsts = new streams.constructor(), firstCount = 0;
                let rests = new streams.constructor(), restCount = 0;
                for (let key of keys) {
                    streams[key].request(refine(callbacks, {
                        onFirst(first) {
                            firsts[key] = first; ++firstCount;
                            if (firstCount === keys.length) {
                                callbacks.onFirst(firsts);     
                            }
                        },

                        onRest(rest) {
                            rests[key] = rest; ++restCount;
                            if (restCount === keys.length) {
                                callbacks.onRest(AsyncStream.zip(rests));     
                            }
                        },
                    }));   
                }
            });
        }

        pick(key) {
            return this.map(item => item[key]);
        }
        
        enumerate({ from = 0, by = 1 }) {
            return AsyncStream.zip([AsyncStream.count({ from, by }), this]);     
        }

        httpRequest() {
            return this.asyncMap((callbacks, settings) => {
                if (settings.constructor === String) {
                    settings = { uri: settings };
                } else {
                    settings = Object.create(settings);
                }

                if (settings.method === undefined) {
                    settings.method = 'GET';
                } else {
                    settings.method = settings.method.toUpperCase();
                }

                if (settings.data === undefined) {
                    settings.data = null;
                } else if (settings.data.constructor === String) {
                    if (settings.method === 'GET') {
                        if (settings.data !== '') {
                            settings.uri += '?' + settings.data;
                        }
                        settings.data = null;
                    }
                }

                if (settings.responseType === undefined) {
                    settings.responseType = 'document';
                }

                let xhr = new XMLHttpRequest();

                let abort = () => {
                    xhr.abort();
                };

                xhr.addEventListener('error', () => {
                    callbacks.abort.onDrop(abort);
                    callbacks.onResult([null, null]);
                });
                xhr.addEventListener('load', () => {
                    callbacks.abort.onDrop(abort);
                    callbacks.onResult([xhr.response, xhr.statusText]);
                });

                xhr.responseType = settings.responseType;

                xhr.open(settings.method, settings.uri);

                callbacks.abort.onAdd(abort);

                if (settings.data === null) {
                    xhr.send();
                } else {
                    xhr.send(settings.data);
                }
            });
        }
    }

    return AsyncStream;
});

