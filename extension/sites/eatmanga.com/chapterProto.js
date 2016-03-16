'use strict';

define(async (require) => {
    let $ = await require('/thirdparty/jQuery.js');
    let http = await require('/utility/http.js');

    return {
        getId() {
            let mangaId = this.manga.getId();

            let uri = this.getUri();
            let id = /\/([^\/]+)\/$/.exec(uri)[1];
            while (id[0] === mangaId[0]) {
                id = id.slice(1);
                mangaId = mangaId.slice(1);
            }
            id = id.replace(/^-+/, '');
            id = id.replace(/^0+(?=\d)/, '');

            return id;
        },

        getUri() {
            let uri = $(this._anchor).prop('href');
            return uri;
        },

        async getTitle() {
            let mangaTitle = await this.manga.getTitle();

            let title = $(this._anchor).text();
            while (title[0] === mangaTitle[0]) {
                title = title.slice(1);
                mangaTitle = mangaTitle.slice(1);
            }
            title = title.replace(/^ +/, '');

            return title;
        },

        async getPageById(id) {
            if (id === '1') {
                id = '';
            } else {
                id = 'page-' + id;
            }

            let document = await this._getDocument();
            let option = $(document)
              .find('#pages option')
              .filter((_, option) => option.value.endsWith('/' + id))
              .get(0);
            if (option === undefined) {
                return null;
            }

            let page = { __proto__: await require('pageProto.js'),
                chapter: this,
                _option: option,
            };

            return page;
        },

        async getFirstPage() {
            let document = await this._getDocument();
            let firstOption = $(document)
              .find('#pages option')
              .get(0);
            if (firstOption === undefined) {
                return null;
            }

            let firstPage = { __proto__: await require('pageProto.js'),
                chapter: this,
                _option: firstOption,
            };

            return firstPage;
        },

        async getLastPage() {
            let document = await this._getDocument();
            let lastOption = $(document)
              .find('#pages option')
              .get(-1);
            if (lastOption === undefined) {
                return null;
            }

            let lastPage = { __proto__: await require('pageProto.js'),
                chapter: this,
                _option: lastOption,
            };

            return lastPage;
        },

        getPrevious() {
            let previousAnchor = $(this._anchor)
              .parents('tr')
              .eq(0)
              .nextAll()
              .find('th a')
              .filter((_, anchor) => $(anchor).attr('href').startsWith('/Manga-Scan/'))
              .get(0);
            if (previousAnchor === undefined) {
                return null;
            }

            let previousChapter = { __proto__: Object.getPrototypeOf(this),
                manga: this.manga,
                _anchor: previousAnchor,
            };

            return previousChapter;
        },

        getNext() {
            let nextAnchor = $(this._anchor)
              .parents('tr')
              .eq(0)
              .prevAll()
              .find('th a')
              .filter((_, anchor) => $(anchor).attr('href').startsWith('/Manga-Scan/'))
              .get(0);
            if (nextAnchor === undefined) {
                return null;
            }

            let nextChapter = { __proto__: Object.getPrototypeOf(this),
                manga: this.manga,
                _anchor: nextAnchor,
            };

            return nextChapter;
        },

        async _getDocument() {
            let uri = this.getUri();
            let document = await http.getHtml(uri);
            this._getDocument = () => document;
            return document;
        },
    };
});
