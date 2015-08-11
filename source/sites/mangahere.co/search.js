'use strict';

import '/thirdparty/jquery.js';

import AsyncStream from '/utility/AsyncStream.js';
import createEmptyDocument from '/utility/createEmptyDocument.js';

//import Manga from './Manga.js';

export default function search(query) {
    return AsyncStream
    .count({ from: 1 })
    .ajax({
        configure(page) {
            return {
                url: 'http://www.mangahere.co/search.php',
                data: $.extend({ page }, query),
            };
        }    
    })
    .map(html => $(html, createEmptyDocument()))
    .do(page => { if (page.find('.result_search').length == 0) { throw new Error('Search page structure changed.'); } })
    .breakIf(page => page.find('.result_search .next-page').length == 0)  // nothing found
    .breakNextIf(page => page.find('.result_search .next-page .next').length == 0)  // no next page
    .map(page => page.find('.result_search a.manga_info'))
    .map(anchors => AsyncStream.from(anchors.toArray()))
    .flatten
    .map(anchor => anchor.href)
    .ajax({})
    .map(html => $(html, createEmptyDocument()))
    .map(page => {
        let titles = page
        .find('label:contains(\'Alternative Name:\')')
        .parent()
        .contents()
        .filter((no, element) => element.nodeType == 3)  // text nodes
        .text()
        .trim();
        titles = (titles == 'None') ? [] : titles.split('; ');    
        titles.unshift(page.find('h1.title').text().trim());

        return { titles };
    })
    ;
}

