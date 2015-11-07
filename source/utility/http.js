'use strict';

modules.define(async (require) => {
    let AsyncStream = await require('/utility/AsyncStream.js');

    return {
        get(uri) {
            return AsyncStream.of(uri)
                .asyncMap((callbacks, uri) => {
                    let xhr = new XMLHttpRequest();

                    let abort = () => {
                        xhr.abort();
                    };

                    xhr.addEventListener('error', error => {
                        callbacks.abort.onDrop(abort);
                        callbacks.onError(error);
                    });
                    xhr.addEventListener('load', () => {
                        callbacks.abort.onDrop(abort);
                        if (xhr.statusText !== 'OK') {
                            callbacks.onError(new Error(xhr.statusText));
                        } else {
                            callbacks.onResult(xhr.response);
                        }
                    });

                    xhr.responseType = 'document';

                    xhr.open('GET', uri);

                    callbacks.abort.onAdd(abort);

                    xhr.send();
                })
            ;
        },
    };
});

