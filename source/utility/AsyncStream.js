'use strict';

define([
    'jquery',
], (  $     ) => {
    function ensureDefaults(callbacks) {
        let isFull = callbacks.setAbort
                  && callbacks.break
                  && callbacks.yield
                  && callbacks.continue
                  && callbacks.throw;

        if (isFull) {
            return callbacks;
        }

        callbacks = Object.create(callbacks);

        if (!callbacks.setAbort) {
            callbacks.setAbort = abort => {};
        }

        if (!callbacks.break) {
            callbacks.break = () => {};
        }

        if (!callbacks.yield) {
            callbacks.yield = first => {};
        }
        
        if (!callbacks.continue) {
            callbacks.continue = rest => {};
        }
        
        if (!callbacks.throw) {
            callbacks.throw = error => {
                console.error(error);    
            };
        }

        return callbacks;
    }

    function refine(callbacks, newCallbacks) {
        let refinedCallbacks = Object.create(callbacks);

        for (let field of Object.keys(newCallbacks)) {
            console.assert(field in refinedCallbacks, 'Can only refine existing callbacks.');
            refinedCallbacks[field] = newCallbacks[field];    
        }

        return refinedCallbacks;
    }

    function singularize(callbacks) {
        return {
            setAbort: callbacks.setAbort.bind(callbacks),
            return: callbacks.yield.bind(callbacks),
            throw: callbacks.throw.bind(callbacks),
        };
    }

    function asynchronize(transform) {
        return function(callbacks, ...args) {
            let res;

            try {
                res = transform(...args);
            } catch (error) {
                callbacks.throw(error);
                return;
            }

            callbacks.return(res);
        };    
    }

    let REQUEST = Symbol('REQUEST');

    class AsyncStream {
        constructor(request = callbacks => { callbacks.break(); }) {
            this[REQUEST] = callbacks => {
                let queue = [callbacks];

                this[REQUEST] = callbacks => {
                    queue.push(callbacks);
                };

                let rest;
                request(refine(callbacks, {
                    break: () => {
                        let i = 0;
                        while (i < queue.length) {
                            let callbacks = queue[i];
                            callbacks.break();
                            ++i;
                        }
                        this[REQUEST] = callbacks => {
                            callbacks.break();
                        };
                    },

                    yield: first => {
                        let i = 0;
                        while (i < queue.length) {
                            let callbacks = queue[i];
                            callbacks.yield(first);
                            ++i;
                        }
                        this[REQUEST] = callbacks => {
                            callbacks.continue(rest);
                            callbacks.yield(first);
                        };
                    },

                    continue: _rest => {
                        rest = _rest;
                        let i = 0;
                        while (i < queue.length) {
                            let callbacks = queue[i];
                            callbacks.continue(rest);
                            ++i;
                        }
                        this[REQUEST] = callbacks => {
                            callbacks.continue(rest);
                            queue.push(callbacks);
                        };
                    },

                    throw: error => {
                        let i = 0;
                        while (i < queue.length) {
                            let callbacks = queue[i];
                            callbacks.throw(error);
                            ++i;
                        }
                        this[REQUEST] = callbacks => {
                            callbacks.throw(error);
                        };
                    },
                }));
            };  
        }   

        request(callbacks) {
            this[REQUEST](ensureDefaults(callbacks));
        }

        $(transform) {
            return transform(this);
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
                    callbacks.throw(error);
                    return;
                }

                if (done) {
                    callbacks.break();
                    return;
                }

                callbacks.continue(AsyncStream.from(iterator));
                callbacks.yield(value);    
            });    
        }

        static of(...values) {
            return AsyncStream.from(values);    
        }

        static repeat(what) {
            return new AsyncStream(callbacks => {
                callbacks.continue(AsyncStream.repeat(what));
                callbacks.yield(what);
            });    
        }

        static count({ from = 0, to = Number.MAX_SAFE_INTEGER, by = 1 }) {
            return new AsyncStream(callbacks => {
                if (by > 0 && from >= to || by < 0 && from <= to) {
                    callbacks.break();
                } else {
                    callbacks.continue(AsyncStream.count({ from: from + by, to, by }));
                    callbacks.yield(from);
                }
            });    
        }

        static zip(...streams) {
            console.assert(streams.length >= 2, 'AsyncStream.zip requires at least two arguments.');
            return new AsyncStream(callbacks => {
                let aborts = new Map();
                let superAbort = null;
                let firstCount = 0, firsts = [];
                let restCount = 0, rests = [];
                for (let i = 0; i < streams.length; ++i) {
                    streams[i].request(refine(callbacks, {
                        setAbort(abort) {
                            if (abort === null) {
                                aborts.delete(i);
                                if (aborts.size === 0) {
                                    callbacks.setAbort(superAbort = null);
                                }
                            } else {
                                aborts.set(i, abort);
                                if (superAbort === null) {
                                    callbacks.setAbort(superAbort = () => {
                                        for (let abort of aborts.values()) {
                                            abort();    
                                        }    
                                    });
                                }
                            }
                        },

                        break() {
                            if (superAbort !== null) {
                                superAbort();
                            }
                            callbacks.break();
                        },

                        yield(first) {
                            firsts[i] = first; ++firstCount;
                            if (firstCount === streams.length) {
                                callbacks.yield(firsts);     
                            }
                        },

                        continue(rest) {
                            rests[i] = rest; ++restCount;
                            if (restCount === streams.length) {
                                callbacks.continue(AsyncStream.zip(...rests));     
                            }
                        },

                        throw(error) {
                            if (superAbort !== null) {
                                superAbort();
                            }
                            callbacks.throw(error);
                        },
                    }));   
                }
            });
        }

        zip(...others) {
            return AsyncStream.zip(this, ...others);    
        }

        static chain(first, ...rest) {
            return first.chain(...rest);
        }

        chain(other, ...rest) {
            if (rest.length > 0) {
                other = other.chain(...rest);    
            }

            return new AsyncStream(callbacks => {
                this.request(refine(callbacks, {
                    break() {
                        other.request(callbacks);  
                    },

                    continue(rest) {
                        callbacks.continue(rest.chain(other));
                    },
                }));    
            });
        }

        static join(...streams) {
            if (streams.length === 0) {
                return AsyncStream();
            }

            if (streams.length === 1) {
                return streams[0];
            }

            return new AsyncStream(callbacks => {
                let aborts = new Map();
                let superAbort = null;
                let done = false;
                for (let stream of streams.slice()) {
                    let rest;
                    stream.request(refine(callbacks, {
                        setAbort(abort) {
                            if (abort === null) {
                                aborts.delete(stream);
                                if (aborts.size === 0) {
                                    callbacks.setAbort(superAbort = null);
                                }
                            } else {
                                aborts.set(stream, abort);
                                if (superAbort === null) {
                                    callbacks.setAbort(superAbort = () => {
                                        for (let abort of aborts.values()) {
                                            abort();    
                                        }    
                                    });
                                }
                            }
                        },

                        break() {
                            streams.splice(streams.indexOf(stream), 1);
                        },

                        yield(first) {
                            if (!done) {
                                done = true;

                                streams.splice(streams.indexOf(stream), 1);
                                streams.push(rest);

                                callbacks.continue(AsyncStream.join(...streams));
                                callbacks.yield(first);
                            }
                        },

                        continue(_rest) {
                            rest = _rest;
                        },

                        throw(error) {
                            if (superAbort !== null) {
                                superAbort();
                            }
                            callbacks.throw(error);
                        }
                    }));   
                }
            });
        }

        join(...others) {
            return AsyncStream.join(this, ...others);
        }

        joinItems() {
            return new AsyncStream(callbacks => {
                let rest;
                this.request({
                    yield(first) {
                        first.join(rest.joinItems()).request(callbacks);
                    },

                    continue(_rest) {
                        rest = _rest;
                    },
                });
            });
        }

        asyncMap(transform) {
            return new AsyncStream(callbacks => {
                this.request(refine(callbacks, {
                    yield(first) {
                        transform(singularize(callbacks), first);
                    },

                    continue(rest) {
                        callbacks.continue(rest.asyncMap(transform));
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
                this.request(callbacks.refine({
                    break() {
                        callbacks.continue(new AsyncStream());
                        callbacks.yield(initial);
                    },

                    yield(first) {
                        combine(refine(singularize(callbacks), {
                            return(result) {
                                rest.asyncFold(result, combine).request(callbacks);
                            }, 
                        }), initial, first);
                    },

                    continue(_rest) {
                        rest = _rest;
                    },
                }));    
            });
        }
        
        fold(initial, combine) {
            return this.asyncFold(initial, asynchronize(combine));    
        }

        asyncDo(action) {
            return this.asyncMap((callbacks, item) => {
                action(refine(callbacks, {
                    return() {
                        callbacks.return(item);
                    },
                }), item);   
            });
        }

        do(action) {
            return this.asyncDo(asynchronize(action));
        }

        ajax() {
            return this.asyncMap((callbacks, ajaxSettings) => {
                let aborted = false;

                let jqXHR = $.ajax(ajaxSettings)
                .always(() => {
                    callbacks.setAbort(null);
                })
                .done((data, textStatus, jqXHR) => {
                    let contentType = jqXHR.getResponseHeader('Content-Type') || '';
                    if (contentType.startsWith('text/html') && (ajaxSettings.dataType === undefined || ajaxSettings.dataType === 'html')) {
                        data = new DOMParser().parseFromString(data, 'text/html');
                    }
                    callbacks.return(data);
                })
                .fail((jqXHR, textStatus, errorThrown) => {
                    if (!aborted) {
                        callbacks.throw(errorThrown);
                    }
                });

                callbacks.setAbort(() => {
                    aborted = true;
                    jqXHR.abort();  
                });
            });
        }

        asyncBreakIf(predicate) {
            return new AsyncStream(callbacks => {
                let rest;
                this.request(refine(callbacks, {
                    yield(first) {
                        predicate(refine(singularize(callbacks), {
                            return(shouldBreak) {
                                if (shouldBreak) {
                                    callbacks.break();
                                } else {
                                    callbacks.continue(rest.asyncBreakIf(predicate));
                                    callbacks.yield(first);
                                }
                            }, 
                        }), first);
                    },

                    continue(_rest) {
                        rest = _rest;
                    },
                }));    
            });
        }

        breakIf(predicate) {
            return this.asyncBreakIf(asynchronize(predicate));
        }

        asyncBreakNextIf(predicate) {
            return new AsyncStream(callbacks => {
                let rest;
                this.request(refine(callbacks, {
                    yield(first) {
                        predicate(refine(singularize(callbacks), {
                            return(shouldBreak) {
                                if (shouldBreak) {
                                    callbacks.continue(new AsyncStream());
                                } else {
                                    callbacks.continue(rest.asyncBreakNextIf(predicate));
                                }

                                callbacks.yield(first);
                            }, 
                        }), first);
                    },

                    continue(_rest) {
                        rest = _rest;
                    },
                }));    
            });
        }

        breakNextIf(predicate) {
            return this.asyncBreakNextIf(asynchronize(predicate));
        }

        flatten() {
            return new AsyncStream(callbacks => {
                let rest;
                this.request(refine(callbacks, {
                    yield(first) {
                        first.chain(rest.flatten()).request(callbacks);
                    },

                    continue(_rest) {
                        rest = _rest;
                    },
                }));    
            });
        }

        enumerate({ from = 0 }) {
            return AsyncStream.count({ from }).zip(this);     
        }
    }

    return AsyncStream;
});

