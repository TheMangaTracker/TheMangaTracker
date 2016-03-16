'use strict';

define(async (require) => {
    let $ = await require('/thirdparty/jQuery.js');
    let http = await require('/utility/http.js');

    return {
        getId() {
            if (this._option.value.endsWith('/')) {
                return '1';
            }

            let id = /\/page-(\d+)$/.exec(this._option.value)[1];
            return id;
        },

        getUri() {
            let chapterUri = this.chapter.getUri();
            let uri = this._option.value;
            uri = new URL(uri, chapterUri).href;
            return uri;
        },

        getImageUri() {
            let document = this.chapter._getDocument();
            let firstImageUri = $(document)
              .find('#eatmanga_image_big')
              .prop('src');

            let no = this.getId();
            while (no.length < 2) {
                no = '0' + no;
            }

            let imageUri = firstImageUri.replace(/\/\d+(?=\.[^.]+$)/, '/' + no);

            return imageUri;
        },

        getPrevious() {
            let previousOption = $(this._option)
              .prev()
              .get(0);
            if (previousOption === undefined) {
                return null;
            }

            let previousPage = { __proto__: Object.getPrototypeOf(this),
                chapter: this.chapter,
                _option: previousOption,
            };

            return previousPage;
        },

        getNext() {
            let nextOption = $(this._option)
              .next()
              .get(0);
            if (nextOption === undefined) {
                return null;
            }

            let nextPage = { __proto__: Object.getPrototypeOf(this),
                chapter: this.chapter,
                _option: nextOption,
            };

            return nextPage;
        },
    };
});
