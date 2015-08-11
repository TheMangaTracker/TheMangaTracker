'use strict';

function provideDefaults(callbacks) {
    let newCallbacks = Object.create(callbacks);

    newCallbacks.addAbort = callbacks.addAbort || (abort => {});
    newCallbacks.deleteAbort = callbacks.deleteAbort || (abort => {});
    newCallbacks.break = callbacks.break || (() => {});
    newCallbacks.yield = callbacks.yield || (value => {});
    newCallbacks.throw = callbacks.throw || (error => {
        console.error(error);    
    });

    return newCallbacks;
}

function refine(callbacks, newCallbacks) {
    let refinedCallbacks = Object.create(callbacks);

    for (let field of Object.keys(newCallbacks)) {
        refinedCallbacks[field] = newCallbacks[field];    
    }

    return refinedCallbacks;
}

function singularize(callbacks) {
    return {
        addAbort: callbacks.addAbort.bind(callbacks),
        deleteAbort: callbacks.deleteAbort.bind(callbacks),
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

export default class AsyncStream {
    constructor(request = cbs => { cbs.break(); }) {
        Object.defineProperties(this, {
            request: {
                value(callbacks) {
                    request(provideDefaults(callbacks));
                },    
            },    
        });
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
        let rest;

        return new AsyncStream(callbacks => {
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

    ajax(settings) {
        settings = Object.create(settings);

        if (settings.configure === undefined) {
            settings.configure = (item) => {
                return item;
            };
        }

        if (settings.asyncConfigure === undefined) {
            settings.asyncConfigure = asynchronize(settings.configure);
        }

        if (settings.integrate === undefined) {
            settings.integrate = (item, data) => {
                return data;
            };
        }

        if (settings.asyncIntegrate === undefined) {
            settings.asyncIntegrate = asynchronize(settings.integrate);
        }

        return this
        .asyncMap((callbacks, item) => {
            settings.asyncConfigure(refine(callbacks, {
                return(ajaxSettings) {
                    callbacks.return([item, ajaxSettings]);    
                },
            }), item);    
        })
        .asyncMap((callbacks, [item, ajaxSettings]) => {
            let aborted = false;
            let abort = () => {
                aborted = true;
                jqXHR.abort();  
            };

            let jqXHR = $.ajax(ajaxSettings)
            .always(() => {
                callbacks.deleteAbort(abort);
            })
            .done((data, textStatus, jqXHR) => {
                callbacks.return([item, data]);
            })
            .fail((jqXHR, textStatus, errorThrown) => {
                if (!aborted) {
                    callbacks.throw(errorThrown);
                }
            });

            callbacks.addAbort(abort);
        })    
        .asyncMap((callbacks, [item, data]) => {
            settings.asyncIntegrate(callbacks, item, data);    
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

    chain(that) {
        return new AsyncStream(callbacks => {
            this.request(refine(callbacks, {
                break() {
                    that.request(callbacks);  
                },

                continue(rest) {
                    callbacks.continue(rest.chain(that));
                },
            }));    
        });
    }

    get flatten() {
        let rest;

        return new AsyncStream(callbacks => {
            this.request(refine(callbacks, {
                yield(first) {
                    first.chain(rest.flatten).request(callbacks);
                },

                continue(_rest) {
                    rest = _rest;
                },
            }));    
        });
    }
}

