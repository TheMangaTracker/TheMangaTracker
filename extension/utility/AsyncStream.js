'use strict';

define(async (require) => {
    class AsyncStream {
        constructor(evaluate) {
            this.evaluate = () => {
                let node = evaluate();
                this.evaluate = () => node;
                return node;
            }
        }

        static fromIterator(iterator) {
            return new AsyncStream(() => {
                let { value, done } = iterator.next();

                if (done) {
                    return null;
                }

                return {
                    first: value,
                    rest: AsyncStream.fromIterator(iterator),
                };
            });
        }

        static fromIterable(iterable) {
            let iterator = iterable[Symbol.iterator]();
            return AsyncStream.fromIterator(iterator);
        }

        static of(...values) {
            return AsyncStream.fromIterable(values);
        }

        static fromEmitter(emitter) {
            return new AsyncStream(() => {
                return new Promise((resolve, reject) => {
                    emitter(item => {
                        return new Promise(resolveEmit => {
                            resolve({
                                first: item,
                                rest: new AsyncStream(() => {
                                    return new Promise((nextResolve, nextReject) => {
                                        resolve = nextResolve; reject = nextReject;
                                        resolveEmit();
                                    });
                                }),
                            });
                        });
                    }).then(result => {
                        resolve(null);
                    }).catch(reason => {
                        reject(reason);
                    });
                });
            });
        }

        async forEach(action) {
            let node = await this.evaluate();
            while (node !== null) {
                await action(await node.first);
                node = await node.rest.evaluate();
            }
        }
    
        map(transform) {
            return new AsyncStream(async () => {
                let node = await this.evaluate();
                if (node === null) {
                    return null;
                }
                return {
                    first: (async () => transform(await node.first))(),
                    rest: node.rest.map(transform),
                };
            });
        }

        async fold(initial, combine) {
            await this.forEach(async (item) => {
                initial = await combine(initial, item);
            });
            return initial;
        }

        filter(isAllowed) {
            return AsyncStream.fromEmitter(async (emit) => {
                await this.forEach(async (item) => {
                    if (await isAllowed(item)) {
                        await emit(item);
                    }
                });
            });
        }

        chain() {
            return AsyncStream.fromEmitter(async (emit) => {
                await this.forEach(async (stream) => {
                    await stream.forEach(emit);
                });
            });
        }

        merge() {
            let merge = (a, b) => {
                return new AsyncStream(() => {
                    let streams = [a, b];
                    return Promise.race(streams.map(async (stream, i) => {
                        return [i, await stream.evaluate()];
                    })).then(([i, node]) => {
                        let other = streams[1 - i];
                        if (node === null) {
                            return other.evaluate();
                        }
                        return {
                            first: node.first,
                            rest: merge(node.rest, other),
                        };
                    });
                });
            };

            return new AsyncStream(async () => {
                let node = await this.evaluate();
                if (node === null) {
                    return null;
                }
                return merge(await node.first, node.rest.merge()).evaluate();
            });
        }
    }

    AsyncStream.empty = new AsyncStream(() => null);

    return AsyncStream;
});
