'use strict';

define(async (require) => {
    let $ = await require('/thirdparty/jQuery.js');
    let http = await require('/utility/http.js');

    return {
        getId() {
            let uri = this.getUri();
            let id = /\/(\d+)$/.exec(uri)[1];
            return id;
        },

        getUri() {
            let uri = this._anchor.href;
            return uri;
        },

        async getImageUri() {
            let uri = this.getUri();
            let document = await http.getHtml(uri);
            let imageUri = $(document)
              .find('img.open')
              .prop('src');
            this.getImageUri = () => imageUri;
            return imageUri;
        },

        getPrevious() {
            let previousAnchor = $(this._anchor)
              .parents('li')
              .eq(0)
              .prev()
              .find('a')
              .get(0);
            if (previousAnchor === undefined) {
                return null;
            }

            let previousPage = { __proto__: Object.getPrototypeOf(this),
                chapter: this.chapter,
                _anchor: previousAnchor,
            };

            return previousPage;
        },

        getNext() {
            let nextAnchor = $(this._anchor)
              .parents('li')
              .eq(0)
              .next()
              .find('a')
              .get(0);
            if (nextAnchor === undefined) {
                return null;
            }

            let nextPage = { __proto__: Object.getPrototypeOf(this),
                chapter: this.chapter,
                _anchor: nextAnchor,
            };

            return nextPage;
        },
    };
});
