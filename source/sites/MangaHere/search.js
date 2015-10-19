'use strict';

define([
    './languageToSubdomain.js', '/utility/AsyncStream.js', '/utility/parseUri.js', 'jquery',
], (   languageToSubdomain    ,           AsyncStream    ,           parseUri    ,   $     ) => {
    function search(query) {
        function searchInLanguage(language) {
            let domain = 'http://' + languageToSubdomain.get(language) + '.mangahere.co';
            return AsyncStream.of(domain + '/advsearch.htm')
                .ajax()
                .map(document => {
                    let form = $(document).find('#searchform');
                    
                    if (query.title !== '') {
                        form.find('input[name="name"]').val(query.title); 
                    }

                    if (query.writer !== '') {
                        form.find('input[name="author"]').val(query.writer); 
                    }

                    if (query.artist !== '') {
                        form.find('input[name="artist"]').val(query.artist); 
                    }

                    if (query.complete !== null) {
                        form.find('input[name="is_completed"]').val([query.complete ? 1 : 0]);
                    }

                    if (query.readingDirection === '<') {
                        form.find('input[name="direction"]').val(['rl']); 
                    } else if (query.readingDirection === '>') {
                        form.find('input[name="direction"]').val(['lr']); 
                    }

                    return {
                        action: form.attr('action'),
                        method: form.attr('method').toUpperCase(),
                        params: form.serializeArray(),
                    };
                })
                .map(data => AsyncStream.repeat(data))
                .chainItems()
                .enumerate({ from: 1 })
                .map(([pageNo, data]) => {
                    return {
                        url: domain + data.action,
                        method: data.method,
                        data: data.params.concat([{ name: 'page', value: pageNo }]),
                    };
                })
                .ajax()
                .breakIf(document => $('.result_search .next-page', document).length == 0)  // nothing found
                .breakNextIf(document => $('.result_search .next-page .next', document).length == 0)  // no next page
                .map(document => AsyncStream.from($('.result_search a.manga_info', document).toArray()))
                .chainItems()
                .map(anchor => {
                    return {
                        id: parseUri(anchor.href).pathParts[1] + '.' + language,
                        title: $(anchor).text().trim(),
                    };
                })
            ;
        }

        return AsyncStream.from(languageToSubdomain.keys())
            .filter(language => query.languages.has(language))    
            .map(searchInLanguage)
            .joinItems()
        ;
    }

    return search;
});
