'use strict';

import '/thirdparty/jquery.js';

import LazyAsyncStream from '/utility/LazyAsyncStream.js';
import createEmptyDocument from '/utility/createEmptyDocument.js';

//import Manga from './Manga.js';

export default function search(query) {
    return LazyAsyncStream
    .count({ start: 1 })
    .asyncMap((page, cbs) => {
        let aborted = false;

        let jqXHR = $.get('http://www.mangahere.co/search.php', $.extend({ page }, query))
        .done((html, textStatus, jqXHR) => {
            cbs.setAbort(null);
            cbs.return(html);
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            cbs.setAbort(null);
            if (!aborted) {
                cbs.throw(new Error(textStatus + ' ' + errorThrown));
            }
        });

        cbs.setAbort(() => {
            aborted = true;
            jqXHR.abort();  
        });
    })
    .map(html => $(html, createEmptyDocument()))
    .do(page => { if (page.find('.result_search').length == 0) { throw new Error('Page structure changed.'); } })
    .cutIf(page => page.find('.result_search .next-page').length == 0)  // nothing found
    .cutNextIf(page => page.find('.result_search .next-page .next').length == 0)  // no next page
    .map(page => page.find('.result_search a.manga_info'))
    .map(anchors => LazyAsyncStream.from(anchors.toArray())).flatten
    .map(anchor => anchor.href)
    .map(url => ({ url }));
}

