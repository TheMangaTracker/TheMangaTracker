'use strict';

import '/thirdparty/jquery.js';

import AsyncStream from '/utility/AsyncStream.js';

let site = {
    search(query) {
        return AsyncStream
        .of('http://www.mangahere.co/advsearch.htm').ajax()
        .map(document => {
            let form = $(document).find('#searchform');
            
            if (query.leftToRight !== null) {
                form.find('[name="direction"]').val([query.leftToRight ? 'lr' : 'rl']); 
            }

            if (query.title !== null) {
                form.find('[name="name"]').val(query.title); 
            }

            if (query.writer !== null) {
                form.find('[name="author"]').val(query.writer); 
            }

            if (query.artist !== null) {
                form.find('[name="artist"]').val(query.artist); 
            }

            /*for (let genre of query.genres.include) {
                    let select = form.find('[name="genre[' + genre + ']"]')
                    if (select.length == 1) { 
                        select.val(genre ? 1 : 2);
                    }
            }*/

            if (query.isComplete !== null) {
                form.find('[name="is_completed"]').val([query.isComplete ? 1 : 0]);
            }

            return form.serializeArray();
        })
        .map(params => AsyncStream.repeat(params)).flatten()
        .enumerate({ from: 1 })
        .map(([pageNo, params]) => {
            return {
                url: 'http://www.mangahere.co/search.php',
                data: params.concat([{ key: 'page', value: pageNo }]),
            };
        }).ajax()
        .do(document => { if ($('.result_search', document).length == 0) { throw new Error('Search page structure changed.'); } })
        .breakIf(document => $('.result_search .next-page', document).length == 0)  // nothing found
        .breakNextIf(document => $('.result_search .next-page .next', document).length == 0)  // no next page
        .map(document => AsyncStream.from($('.result_search a.manga_info', document).toArray())).flatten()
        .map(anchor => {
            return {
                title: $(anchor).text().trim(),
                manga: anchor.href,
            };
        });
    }
};

export default site;

