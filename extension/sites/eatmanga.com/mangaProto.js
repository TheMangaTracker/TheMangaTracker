'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');
    let http = await require('/utility/http.js');

    return {
        getId() {
            let uri = this.getUri();
            let id = /\/([^\/]+)\/$/.exec(uri)[1];
            return id;
        },

        getUri() {
            let siteUri = this.site.getUri();
            let id = this.getId();
            let uri = new URL('/Manga-Scan/' + id + '/', siteUri).href;
            return uri;
        },

        getLanguageId: () => 'en',

        async getTitle() {
            let document = await this._getDocument();
            let title = $(document)
              .find('#main_content p.tip b')
              .eq(1)
              .text();
            return title;
        },

        async getChapterById(id) {
            let document = await this._getDocument();
            let anchors = $(document)
              .find('#updates th a')
              .toArray();
            let chapters = [];
            for (let anchor of anchors) {
                let chapter = { __proto__: await require('./chapterProto.js'),
                    manga: this,
                    _anchor: anchor,
                };

                if (chapter.getId() === id) {
                    chapters.push(chapter);
                }
            }

            if (chapters.length === 1) {
                return chapters[0];
            }

            if (chapters.length === 0) {
                return null;    
            }

            throw new Error('Chapter id \'' + id + '\' yielded by multiple uris:\n' + chapters.map(chapter => {
                let uri = chapter.getUri();
                return '\t' + uri;
            }).join('\n') + '.\n');
        },

        async getFirstChapter() {
            let document = await this._getDocument();
            let firstAnchor = $(document)
              .find('#updates th a')
              .filter((_, anchor) => $(anchor).attr('href').startsWith('/Manga-Scan/'))
              .get(-1);
            if (firstAnchor === undefined) {
                return null;
            }

            let firstChapter = { __proto__: await require('./chapterProto.js'),
                manga: this,
                _anchor: firstAnchor,
            };

            return firstChapter;
        },

        async getLastChapter() {
            let document = await this._getDocument();
            let lastAnchor = $(document)
              .find('#updates th a')
              .filter((_, anchor) => $(anchor).attr('href').startsWith('/Manga-Scan/'))
              .get(0);
            if (lastAnchor === undefined) {
                return null;
            }

            let lastChapter = { __proto__: await require('./chapterProto.js'),
                manga: this,
                _anchor: lastAnchor,
            };

            return lastChapter;
        },

        async _getDocument() {
            let uri = this.getUri();
            let document = await http.getHtml(uri);
            this._getDocument = () => document;
            return document;
        },
    };
});
