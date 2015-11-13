'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');

    let http = await require('/utility/http.js');

    let PageBase = await require('/core/PageBase.js');
    let ChapterBase = await require('/core/ChapterBase.js');
    let MangaBase = await require('/core/MangaBase.js');

    let summaryMarker = {
        ['en']: 'Manga Summary:',
        ['es']: 'Manga Resumen:',
    };

    let alternativeTitlesMarker = {
        ['en']: 'Alternative Name:',
        ['es']: 'Nombre Alternativo:',
    };
    
    let compressChapterId = {
        ['en'](id) {
            while (/^0[0-9]/.test(id)) {
                id = id.slice(1);
            }
            return id;
        },
        ['es']: id => id,
    };

    class Page extends PageBase {
        constructor(chapter, option, document = null) {
            super(chapter);
            this.option = option;
            this.getDocument = (document === null) ? (async function() {
                let document = await http.getHtml(this.getUri());
                this.getDocument = () => document;
                return document;
            }) : (() => document);
        }
        
        getId() {
            let uri = this.getUri();
            if (uri.endsWith('/')) {
                return '1';
            }
            return /\/(\d+).html$/.exec(uri)[1];
        }

        getUri() {
            let uri = this.option.value;
            uri = new URL(uri, this.chapter.getUri()).href;
            return uri;
        }

        async getImageUri() {
            let imageUri = $(await this.getDocument())
                .find('#image')
                .attr('src')
            ;
            imageUri = new URL(imageUri, this.getUri()).href;
            return imageUri;
        }

        getPreviousPage() {
            let [previous] = $(this.option)
                .prev()
                .toArray()
            ;
            if (previous === undefined) {
                return null;
            }
            return new Page(this.chapter, previous);
        }

        async getNextPage() {
            let [next] = $(this.option)
                .next()
                .toArray()
            ;
            if (next === undefined) {
                return null;
            }
            return new Page(this.chapter, next);
        }
    }

    class Chapter extends ChapterBase {
        constructor(manga, anchor) {
            super(manga);
            this.anchor = anchor;
            this.getDocument = async function() {
                let document = await http.getHtml(this.anchor.href);
                this.getDocument = () => document;
                return document;
            };
        }

        getId() {
            let id = /\/c(\d+(?:\.\d+)?)\/$/.exec(this.anchor.href)[1];
            let languageId = this.manga.getLanguageId();
            id = compressChapterId[languageId](id);
            return id;
        }

        getUri() {
            return this.anchor.href;
        }

        getTitle() {
            let item = $(this.anchor)
                .parent()
                .clone()
            ;
            item.find('span').remove();
            let title = item.text()
                .trim()
                .slice(this.manga.getTitle().length)
                .trim()
            ;
            return title;
        }
        
        getPreviousChapter() {
            let [previous] = $(this.anchor)
                .closest('li')
                .next()
                .find('a')
                .toArray()
            ;
            if (previous === undefined) {
                return null;
            }
            return new Chapter(this.manga, previous);
        }

        getNextChapter() {
            let [next] = $(this.anchor)
                .closest('li')
                .prev()
                .find('a')
                .toArray()
            ;
            if (next === undefined) {
                return null;
            }
            return new Chapter(this.manga, next);
        }

        async getPageById(id) {
            let no = parseInt(id);
            if (isNaN(no)) {
                return null;
            }
            no -= 1;
            let options = $(await this.getDocument())
                .find('.readpage_top .go_page .right option')
                .toArray()
            ;
            if (no < 0 || no >= options.length) {
                return null;
            }
            if (no === 0) {
                return this.getFirstPage();
            }
            let option = options[no];
            return new Page(this, option);
        }

        async getFirstPage() {
            let [option] = $(await this.getDocument())
                .find('.readpage_top .go_page .right option')
                .first()
                .toArray();
            ;
            return new Page(this, option, await this.getDocument());
        }

        async getLastPage() {
            let [option] = $(await this.getDocument())
                .find('.readpage_top .go_page .right option')
                .last()
                .toArray();
            ;
            return new Page(this, option);
        }
    }

    class Manga extends MangaBase {
        constructor(site, document) {
            super(site);
            this.document = document;
        }

        getId() {
            let languageId = this.getLanguageId();
            let name = /\/([^\/]+)\/$/.exec(this.document.URL)[1];
            let id = `${languageId}!${name}`;
            return id;
        }
        
        getUri() {
            return this.document.URL;
        }

        getTitle() {
            let languageId = this.getLanguageId();
            let title = $(this.document)
                .find('.manga_detail li label:contains("' + summaryMarker[languageId] + '")')
                .text()
                .trim()
                .slice(0, -summaryMarker[languageId].length)
                .trim()
            ;
            return title;
        }

        getAlternativeTitles() {
            let languageId = this.getLanguageId();
            let alternativeTitles = $(this.document)
                .find('.manga_detail li:has(label:contains("' + alternativeTitlesMarker[languageId] + '"))')
                .text()
                .trim()
                .slice(alternativeTitlesMarker[languageId].length)
                .trim()
            ;
            alternativeTitles = (alternativeTitles === 'None') ? [] : alternativeTitles.split('; ')
            return alternativeTitles;
        }

        getLanguageId() {
            let subdomain = /^https?:\/\/([a-z]+)./.exec(this.document.URL)[1];
            if (subdomain === 'www') {
                return 'en';
            }
            return subdomain;
        }

        getChapterById(id) {
            let anchors = $(this.document)
                .find('.detail_list > ul')
                .first()
                .find('li a')
                .toArray()
            ;
            let languageId = this.getLanguageId();
            for (let anchor of anchors) {
                let uncompressedId = /\/c(\d+(?:\.\d+)?)\/$/.exec(anchor.href)[1];
                if (compressChapterId[languageId](uncompressedId) === id) {
                    return new Chapter(this, anchor);
                }
            }
            return null;
        }

        getFirstChapter() {
            let [first] = $(this.document)
                .find('.detail_list > ul')
                .first()
                .find('li a')
                .last()
                .toArray()
            ;
            return new Chapter(this, first);
        }

        getLastChapter() {
            let [last] = $(this.document)
                .find('.detail_list > ul')
                .first()
                .find('li a')
                .first()
                .toArray()
            ;
            return new Chapter(this, last);
        }
    }
    
    return async function getMangaById(id) {
        let match = /([a-z]{2})!([a-z0-9]+(?:_?[a-z0-9]+)*)/.exec(id);
        if (match === null) {
            return null;
        }
        let [languageId, name] = match.slice(1);
        let uri = `http://${(languageId === 'en') ? 'www' : languageId}.mangahere.co/manga/${name}/`;
        let document = await http.getHtml(uri);
        if ($(document).find('.page_main .error_404').length > 0) {
            return null;
        }
        return new Manga(this, document);
    };
});
