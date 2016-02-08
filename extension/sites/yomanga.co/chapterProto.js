'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');
    let http = await require('/utility/http.js');

    return {
        getId() {
            let uri = this.getUri();
            let id = /\/(\d+)\/$/.exec(uri)[1];
            return id;
        },

        getUri() {
            let uri = $(this._anchor).prop('href');
            return uri;
        },

        getTitle() {
            let title = $(this._anchor).text();
            title = title.replace(/^Chapter */, '');
            return title;
        },

        getPageById: async function(id) {
            let document = await this._getDocument();
            let anchor = $(document)
              .find('div.topbar_right ul.dropdown a')
              .filter((_, anchor) => anchor.href.endsWith('/' + id))
              .get(0);
            if (anchor === undefined) {
                return null;
            }

            let page = { __proto__: await require('./pageProto.js'),
                chapter: this,
                _anchor: anchor,
            };

            return page;
        },

        getFirstPage: async function() {
            let document = await this._getDocument();
            let firstAnchor = $(document)
              .find('div.topbar_right ul.dropdown a')
              .get(0);
            if (firstAnchor === undefined) {
                return null;
            }

            let firstPage = { __proto__: await require('./pageProto.js'),
                chapter: this,
                _anchor: firstAnchor,
            };

            return firstPage;
        },

        getLastPage: async function() {
            let document = await this._getDocument();
            let lastAnchor = $(document)
              .find('div.topbar_right ul.dropdown a')
              .get(-1);
            if (lastAnchor === undefined) {
                return null;
            }

            let lastPage = { __proto__: await require('./pageProto.js'),
                chapter: this,
                _anchor: lastAnchor,
            };

            return lastPage;
        },

        getPrevious() {
            let previousAnchor = $(this._anchor)
              .parents('div.element')
              .eq(0)
              .next()
              .find('div.title a')
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
              .parents('div.element')
              .eq(0)
              .prev()
              .find('div.title a')
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

        _getDocument: async function() {
            let uri = this.getUri();
            let document = await http.getHtml(uri);
            this._getDocument = () => document;
            return document;
        },
    };
});
