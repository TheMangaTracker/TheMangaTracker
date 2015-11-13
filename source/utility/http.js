'use strict';

modules.define(async (require) => {
    return {
        getHtml(uri) {
            return new Promise((resolve, reject) => {
                let xhr = new XMLHttpRequest();

                xhr.addEventListener('error', reject);
                xhr.addEventListener('load', () => {
                    if (xhr.statusText !== 'OK') {
                        reject(new Error(xhr.statusText));
                    } else {
                        resolve(xhr.response);
                    }
                });

                xhr.responseType = 'document';
                xhr.open('GET', uri);
                xhr.send();
            });
        },
    };
});

