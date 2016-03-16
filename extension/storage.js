'use strict';

define(async (require) => {
    let groupId = await new Promise((resolve, reject) => {
        function walk(parent, nodes) {
            for (let node of nodes) {
                if (node.url === chrome.runtime.getURL('')) {
                    return parent;
                }

                let group = walk(node, node.children);
                if (group !== null) {
                    return group;
                }
            }

            return null;
        }

        chrome.bookmarks.getTree(roots => {
            let group = walk(null, roots);
            if (group !== null) {
                resolve(group.id);
                return;
            }

            chrome.bookmarks.create({
                title: chrome.runtime.getManifest().name,
            }, group => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError.message);
                    return;
                }

                chrome.bookmarks.create({
                    parentId: group.id,
                    title: '',
                    url: chrome.runtime.getURL(''),
                }, marker => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError.message);
                        return;
                    }
                
                    resolve(group.id);
                });
            });
        });
    });

    function encodeValue(value) {
        value = JSON.stringify(value);
        value = JSON.stringify(value);
        value = `javascript:void(${ value });`;
        return value;
    }

    function decodeValue(value) {
        value = value.slice(value.indexOf('(') + 1, value.lastIndexOf(')'))
        value = JSON.parse(value);
        value = JSON.parse(value);
        return value;
    }

    let callbacks = [];

    function makeListener(computeValue) {
        return function listener(id) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return;
            }

            chrome.bookmarks.get([id], nodes => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    return;
                }
                
                let node = nodes[0];
                if (node.parentId === groupId) {
                    let value = undefined;
                    for (let [key, callback] of callbacks) {
                        if (key === node.title) {
                            if (value === undefined) {
                                value = computeValue(node.url);
                            }

                            callback(value);
                        }
                    }
                }
            });
        }
    }

    chrome.bookmarks.onCreated.addListener(makeListener(value => decodeValue(value)));
    chrome.bookmarks.onChanged.addListener(makeListener(value => decodeValue(value)));
    chrome.bookmarks.onRemoved.addListener(makeListener(value => undefined));

    return {
        get(key) {
            console.assert(key != '');
            return new Promise((resolve, reject) => {
                chrome.bookmarks.getChildren(groupId, nodes => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError.message);
                        return;
                    }

                    for (let node of nodes) {
                        if (node.title === key) {
                            let value = node.url;
                            value = decodeValue(value);
                            resolve(value);
                            return;
                        }
                    }

                    resolve(undefined);
                });
            });
        },

        set(key, value) {
            console.assert(key != '');
            return new Promise((resolve, reject) => {
                chrome.bookmarks.getChildren(groupId, nodes => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError.message);
                        return;
                    }

                    for (let node of nodes) {
                        if (node.title === key) {
                            if (value === undefined) {
                                chrome.bookmarks.remove(node.id, () => {
                                    if (chrome.runtime.lastError) {
                                        reject(chrome.runtime.lastError.message);
                                        return;
                                    }

                                    resolve();
                                });
                            } else {
                                chrome.bookmarks.update(node.id, {
                                    url: encodeValue(value),
                                }, node => {
                                    if (chrome.runtime.lastError) {
                                        reject(chrome.runtime.lastError.message);
                                        return;
                                    }

                                    resolve();
                                });
                            }

                            return;
                        }
                    }

                    if (value === undefined) {
                        resolve();
                        return;
                    }

                    chrome.bookmarks.create({
                        parentId: groupId,
                        title: key,
                        url: encodeValue(value),
                    }, node => {
                        if (chrome.runtime.lastError) {
                            reject(chrome.runtime.lastError.message);
                            return;
                        }

                        resolve();
                    });
                });
            });
        },

        watch(key, callback) {
            console.assert(key != '');
            callbacks.push([key, callback]);
        },
    };
});
