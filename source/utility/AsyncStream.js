'use strict';

define([
], () => {
    let defaultCallbacks = {
        abort: {
            onAdd: (abort) => {},
            onDrop: (abort) => {},
        },

        onEmpty: () => {},

        onFirst: (first) => {},
    
        onRest: (rest) => {},
    
        onError: (error) => {
            console.error(error, error.stack);
        },
    };

    function refine(callbacks, newCallbacks) {
        let refinedCallbacks = Object.create(null);

        for (let name in callbacks) {
            refinedCallbacks[name] = newCallbacks[name] || callbacks[name];
        }

        return refinedCallbacks;
    }

    function singularize(callbacks) {
        let singularizedCallbacks = Object.create(null);

        singularizedCallbacks.abort = callbacks.abort;
        singularizedCallbacks.onResult = callbacks.onFirst;
        singularizedCallbacks.onError = callbacks.onError;
        
        return singularizedCallbacks;
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
            this[REQUEST](refine(defaultCallbacks, callbacks));
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
                this[REQUEST](refine(callbacks, {
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
                this[REQUEST](refine(callbacks, {
                    onEmpty: () => {
                        callbacks.onRest(new AsyncStream());
                        callbacks.onFirst(initial);
                    },

                    onFirst: (first) => {
                        combine(refine(singularize(callbacks), {
                            onResult: (result) => {
                                rest.asyncFold(result, combine)[REQUEST](callbacks);
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

        asyncKeepIf(predicate) {
            return new AsyncStream(callbacks => {
                let rest;
                this[REQUEST](refine(callbacks, {
                    onFirst: (first) => {
                        predicate(refine(singularize(callbacks), {
                            onResult: (keep) => {
                                if (keep) {
                                    callbacks.onRest(rest);
                                    callbacks.onFirst(first);
                                } else {
                                    rest[REQUEST](callbacks);
                                }
                            }
                        }), first);
                    },

                    onRest: (_rest) => {
                        rest = _rest.asyncKeepIf(predicate);
                    },
                }));
            });
        }

        keepIf(predicate) {
            return this.asyncKeepIf(asynchronize(predicate));
        }

        asyncSkipIf(predicate) {
            return this.asyncKeepIf((callbacks, item) => {
                predicate(refine(callbacks, {
                    onResult: (skip) => {
                        callbacks.onResult(!skip);
                    }
                }), item);
            });
        }

        skipIf(predicate) {
            return this.keepIf(item => !predicate(item));
        }

        take(count) {
            if (count === 0) {
                return new AsyncStream();
            }
            console.assert(count > 0);
            return new AsyncStream(callbacks => {
                this[REQUEST](refine(callbacks, {
                    onRest: (rest) => {
                        callbacks.onRest(rest.take(count - 1));
                    },
                }));
            });
        }

        drop(count) {
            if (count === 0) {
                return this;
            }
            console.assert(count > 0);
            return new AsyncStream(callbacks => {
                this[REQUEST](refine(callbacks, {
                    onFirst: (first) => {},

                    onRest: (rest) => {
                        rest.drop(count - 1)[REQUEST](callbacks);
                    },
                }));
            });
        }

        asyncTakeWhile(predicate) {
            return new AsyncStream(callbacks => {
                let rest;
                this[REQUEST](refine(callbacks, {
                    onFirst: (first) => {
                        predicate(refine(singularize(callbacks), {
                            onResult: (take) => {
                                if (take) {
                                    callbacks.onRest(rest.asyncTakeWhile(predicate));
                                    callbacks.onFirst(first);
                                } else {
                                    callbacks.onEmpty();
                                }
                            }
                        }), first);
                    },

                    onRest: (_rest) => {
                        rest = _rest;
                    },
                }));
            });
        }

        takeWhile(predicate) {
            return this.asyncTakeWhile(asynchronize(predicate));
        }

        asyncTakeUntil(predicate) {
            return this.asyncTakeWhile((callbacks, item) => {
                predicate(refine(callbacks, {
                    onResult: (notTake) => {
                        callbacks.onResult(!notTake);
                    }
                }), item);
            });
        }

        takeUntil(predicate) {
            return this.takeWhile(item => !predicate(item));
        }

        asyncDropWhile(predicate) {
            return new AsyncStream(callbacks => {
                let rest;
                this[REQUEST](refine(callbacks, {
                    onFirst: (first) => {
                        predicate(refine(singularize(callbacks), {
                            onResult: (drop) => {
                                if (drop) {
                                    rest.asyncDropWhile(predicate)[REQUEST](callbacks);
                                } else {
                                    callbacks.onRest(rest);
                                    callbacks.onFirst(first);
                                }
                            }
                        }), first);
                    },

                    onRest: (_rest) => {
                        rest = _rest;
                    },
                }));
            });
        }

        dropWhile(predicate) {
            return this.asyncDropWhile(asynchronize(predicate));
        }

        asyncDropUntil(predicate) {
            return this.asyncDropWhile((callbacks, item) => {
                predicate(refine(callbacks, {
                    onResult: (notDrop) => {
                        callbacks.onResult(!notDrop);
                    }
                }), item);
            });
        }

        dropUntil(predicate) {
            return this.dropWhile(item => !predicate(item));
        }

        chain(that = null) {
            if (that === null) {
                return new AsyncStream(callbacks => {
                    let rest;
                    this[REQUEST](refine(callbacks, {
                        onFirst: (first) => {
                            first.chain(rest.chain())[REQUEST](callbacks);
                        },

                        onRest: (_rest) => {
                            rest = _rest;
                        },
                    }));
                });
            }

            return new AsyncStream(callbacks => {
                this[REQUEST](refine(callbacks, {
                    onEmpty: () => {
                        that[REQUEST](callbacks);  
                    },

                    onRest: (rest) => {
                        callbacks.onRest(rest.chain(that));
                    },
                }));
            });
        }

        join(that = null) {
            if (that === null) {
                return new AsyncStream(callbacks => {
                    let rest;
                    this[REQUEST](refine(callbacks, {
                        onFirst: (first) => {
                            first.join(rest.join())[REQUEST](callbacks);
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
                    streams[i][REQUEST](refine(callbacks, {
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

        static zip(streams) {
            return new AsyncStream(callbacks => {
                let keys = Object.keys(streams);
                let firsts = new streams.constructor(), firstCount = 0;
                let rests = new streams.constructor(), restCount = 0;
                for (let key of keys) {
                    streams[key][REQUEST](refine(callbacks, {
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
    }

    return AsyncStream;
});

