'use strict';

modules.define(async (require) => {
    return {
        getHtml(uri) {
            return new Promise((resolve, reject) => {
                let xhr = new XMLHttpRequest();

                xhr.addEventListener('error', reject);
                xhr.addEventListener('load', () => {
                    if (xhr.statusText === 'OK') {
                        resolve(xhr.response);
                    } else {
                        resolve(null);
                    }
                });

                xhr.responseType = 'document';
                xhr.open('GET', uri);
                xhr.send();
            });
        },
    };
});

