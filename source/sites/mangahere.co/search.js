'use strict';

import '/thirdparty/jquery.js';

import AsyncStream from '/utility/AsyncStream.js';
import createEmptyDocument from '/utility/createEmptyDocument.js';

//import Manga from './Manga.js';

export default function search(query) {
    return AsyncStream
    .count({ start: 1 })
    .map(page => ({ url: 'http://www.mangahere.co/search.php', data: $.extend({ page }, query) })).ajax
    .map(html => $(html, createEmptyDocument()))
    .do(page => { if (page.find('.result_search').length == 0) { throw new Error('Page structure changed.'); } })
    .cutIf(page => page.find('.result_search .next-page').length == 0)  // nothing found
    .cutNextIf(page => page.find('.result_search .next-page .next').length == 0)  // no next page
    .map(page => page.find('.result_search a.manga_info'))
    .map(anchors => AsyncStream.from(anchors.toArray())).flatten
    .map(anchor => anchor.href)
    .map(url => ({ url }));
}

