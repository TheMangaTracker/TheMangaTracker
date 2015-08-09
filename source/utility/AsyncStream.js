'use strict';

export default class AsyncStream {
    constructor(request = cbs => { cbs.return(); }) {
        Object.defineProperties(this, {
            request: {
                value: request,    
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
                cbs.return();
                return;
            }

            cbs.return(value, this.from(iterator));    
        });    
    }

    static of(...values) {
        return this.from(values);    
    }

    static count({ start = 0, stop = Number.MAX_SAFE_INTEGER, step = 1 }) {
        return new AsyncStream(cbs => {
            if (start == stop) {
                cbs.return();
                return;
            }

            cbs.return(start, this.count({ start: start + step, stop, step }));
        });    
    }

    asyncMap(transform) {
        return new AsyncStream(cbs => {
            this.request({
                setAbort: cbs.setAbort,

                return(first, rest) {
                    if (arguments.length == 0) {
                        cbs.return(); 
                        return;
                    }

                    transform(first, {
                        setAbort: cbs.setAbort,

                        return(first) {
                            cbs.return(first, rest.asyncMap(transform));
                        },

                        throw: cbs.throw,    
                    });
                },

                throw: cbs.throw,
            });    
        });
    }

    map(transform) {
        return this.asyncMap((item, cbs) => {
            try {
                item = transform(item);
            } catch (error) {
                cbs.throw(error);
                return;
            }

            cbs.return(item);
        });    
    }
    
    asyncDo(action) {
        return this.asyncMap((item, cbs) => {
            action(item, {
                setAbort: cbs.setAbort,

                return() {
                    cbs.return(item);
                },

                throw: cbs.throw,
            });   
        });
    }

    do(action) {
        return this.asyncDo((item, cbs) => {
            try {
                action(item);      
            } catch (error) {
                cbs.throw(error);
                return;
            }

            cbs.return();
        });
    }

    asyncCutIf(predicate) {
        return new AsyncStream(cbs => {
            this.request({
                setAbort: cbs.setAbort,

                return(first, rest) {
                    if (arguments.length == 0) {
                        cbs.return();
                        return;
                    } 

                    predicate(first, {
                        setAbort: cbs.setAbort,

                        return(result) {
                            if (result) {
                                cbs.return();
                                return;
                            } 

                            cbs.return(first, rest.asyncCutIf(predicate));
                        }, 
                    
                        throw: cbs.throw,
                    });
                },

                throw: cbs.throw,
            });    
        });
    }

    cutIf(predicate) {
        return this.asyncCutIf((item, cbs) => {
            let result;

            try {
                result = predicate(item);    
            } catch (error) {
                cbs.throw(error);
                return;
            }

            cbs.return(result);
        });
    }

    asyncCutNextIf(predicate) {
        return new AsyncStream(cbs => {
            this.request({
                setAbort: cbs.setAbort,

                return(first, rest) {
                    if (arguments.length == 0) {
                        cbs.return();
                        return;
                    } 

                    predicate(first, {
                        setAbort: cbs.setAbort,

                        return(result) {
                            if (result) {
                                cbs.return(first, new AsyncStream());
                                return;
                            } 

                            cbs.return(first, rest.asyncCutNextIf(predicate));
                        }, 
                    
                        throw: cbs.throw,
                    });
                },

                throw: cbs.throw,
            });    
        });
    }

    cutNextIf(predicate) {
        return this.asyncCutNextIf((item, cbs) => {
            let result;

            try {
                result = predicate(item);    
            } catch (error) {
                cbs.throw(error);
                return;
            }

            cbs.return(result);
        });
    }

    chain(that) {
        return new AsyncStream(cbs => {
            this.request({
                setAbort: cbs.setAbort,

                return(first, rest) {
                    if (arguments.length == 0) {
                        that.request(cbs);    
                        return;
                    } 

                    cbs.return(first, rest.chain(that));
                },

                throw: cbs.throw,
            });    
        });
    }

    get flatten() {
        return new AsyncStream(cbs => {
            this.request({
                setAbort: cbs.setAbort,

                return(first, rest) {
                    if (arguments.length == 0) {
                        cbs.return(); 
                        return;
                    }

                    first.chain(rest.flatten).request(cbs);
                },

                throw: cbs.throw,
            });    
        });
    }
}

