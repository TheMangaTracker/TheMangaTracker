'use strict';

function asynchronize(callback) {
    return function(cbs, ...args) {
        let result;

        try {
            result = callback(...args);    
        } catch (error) {
            cbs.throw(error);
            return;
        }

        cbs.return(result);
    };    
}

let defaultCallbacks = {
    refine(callbacks) {
        let refined = Object.create(this);
        
        if (callbacks.hasOwnProperty('setAbort')) {
            refined.setAbort = callbacks.setAbort;    
        }

        if (callbacks.hasOwnProperty('break')) {
            refined.break = callbacks.break;    
        }

        if (callbacks.hasOwnProperty('return') || callbacks.hasOwnProperty('continue')) {
            let returnCallback = callbacks.return || this.return;
            let continueCallback = callbacks.continue || this.continue;

            let returnedFirst = true;
            let returnSecond = null;

            refined.return = first => {
                returnCallback(first);
                if (returnSecond !== null) {
                    returnSecond();
                } else {
                    returnedFirst = true;
                }
            }

            refined.continue = rest => {
                continueCallback(new AsyncStream(ctx => {
                    rest.request(ctx.refine({
                        return(second) {
                            if (returnedFirst) {
                                ctx.return(second);    
                            } else {
                                returnSecond = () => {
                                    ctx.return(second);    
                                };    
                            } 
                        },    
                    }));    
                }));     
            }
        }

        if (callbacks.hasOwnProperty('throw')) {
            refined.throw = callbacks.throw;
        }

        return refined;
    },

    get singularize() {
        let singularized = Object.create(this);

        singularized.refine = function(callbacks) {
            let refined = Object.create(this); 

            if (callbacks.hasOwnProperty('setAbort')) {
                refined.setAbort = callbacks.setAbort;    
            }

            if (callbacks.hasOwnProperty('return')) {
                refined.return = callbacks.return;    
            }

            if (callbacks.hasOwnProperty('throw')) {
                refined.throw = callbacks.throw;    
            }

            return refined;
        };

        Object.defineProperties(singularized, {
            singularize: {
                get() {
                    return this;
                },    
            },    
        });

        singularized.break = undefined;
        singularized.continue = undefined;

        return singularized;
    },

    setAbort(abort) {},

    break() {},

    return(first) {},

    continue(rest) {},

    throw(error) {
        console.error(error);    
    },
};

export default class AsyncStream {
    constructor(request = cbs => { cbs.break(); }) {
        Object.defineProperties(this, {
            request: {
                value(cbs) {
                    if (!defaultCallbacks.isPrototypeOf(cbs)) {
                        cbs = defaultCallbacks.refine(cbs);
                    }

                    request(cbs);
                },    
            },    
        });
    }   
   
    static from(iterator) {
        return new AsyncStream(cbs => {
            let value, done;

            try {
                if (Symbol.iterator in iterator) {
                    iterator = iterator[Symbol.iterator]();
                }

                ({ value, done } = iterator.next());
            } catch (error) {
                cbs.throw(error);
                return;
            }

            if (done) {
                cbs.break();
                return;
            }

            cbs.continue(AsyncStream.from(iterator));
            cbs.return(value);    
        });    
    }

    static of(...values) {
        return AsyncStream.from(values);    
    }

    static count({ start = 0, step = 1, stop = Number.MAX_SAFE_INTEGER }) {
        return new AsyncStream(cbs => {
            if (start == stop) {
                cbs.break();
                return;
            }

            cbs.continue(AsyncStream.count({ start: start + step, stop, step }));
            cbs.return(start);
        });    
    }

    asyncMap(transform) {
        return new AsyncStream(cbs => {
            this.request(cbs.refine({
                return(first) {
                    transform(cbs.singularize, first);
                },

                continue(rest) {
                    cbs.continue(rest.asyncMap(transform));
                },
            }));    
        });
    }

    map(transform) {
        return this.asyncMap(asynchronize(transform));    
    }
    
    asyncFold(initial, combine) {
        let rest;

        return new AsyncStream(cbs => {
            this.request(cbs.refine({
                break() {
                    cbs.continue(new AsyncStream());
                    cbs.return(initial);
                },

                return(first) {
                    combine(cbs.singularize.refine({
                        return(result) {
                            rest.asyncFold(result, combine).request(cbs);
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
        return this.asyncMap((cbs, item) => {
            action(cbs.refine({
                return(undefined) {
                    cbs.return(item);
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
        .asyncMap((cbs, item) => {
            settings.asyncConfigure(cbs.refine({
                return(ajaxSettings) {
                    cbs.return([item, ajaxSettings]);    
                },
            }), item);    
        })
        .asyncMap((cbs, [item, ajaxSettings]) => {
            let aborted = false;

            let jqXHR = $.ajax(ajaxSettings)
            .done((data, textStatus, jqXHR) => {
                cbs.setAbort(null);
                cbs.return([item, data]);
            })
            .fail((jqXHR, textStatus, errorThrown) => {
                cbs.setAbort(null);
                if (!aborted) {
                    cbs.throw(errorThrown);
                }
            });

            cbs.setAbort(() => {
                aborted = true;
                jqXHR.abort();  
            });
        })    
        .asyncMap((cbs, [item, data]) => {
            settings.asyncIntegrate(cbs, item, data);    
        });
    }

    asyncBreakIf(predicate) {
        return new AsyncStream(cbs => {
            let rest;

            this.request(cbs.refine({
                return(first) {
                    predicate(cbs.singularize.refine({
                        return(shouldBreak) {
                            if (shouldBreak) {
                                cbs.break();
                                return;
                            }

                            cbs.continue(rest.asyncBreakIf(predicate));
                            cbs.return(first);
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
        return new AsyncStream(cbs => {
            let rest;

            this.request(cbs.refine({
                return(first) {
                    predicate(cbs.singularize.refine({
                        return(shouldBreak) {
                            if (shouldBreak) {
                                cbs.continue(new AsyncStream());
                            } else {
                                cbs.continue(rest.asyncBreakNextIf(predicate));
                            }

                            cbs.return(first);
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
        return new AsyncStream(cbs => {
            this.request(cbs.refine({
                break() {
                    that.request(cbs);  
                },

                continue(rest) {
                    cbs.continue(rest.chain(that));
                },
            }));    
        });
    }

    get flatten() {
        let rest;

        return new AsyncStream(cbs => {
            this.request(cbs.refine({
                return(first) {
                    first.chain(rest.flatten).request(cbs);
                },

                continue(_rest) {
                    rest = _rest;
                },
            }));    
        });
    }
}

