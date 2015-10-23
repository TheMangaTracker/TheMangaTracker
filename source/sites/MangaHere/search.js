'use strict';

define([
    './languageToSubdomain.js', '/utility/AsyncStream.js', '/utility/parseUri.js', 'jquery',
], (   languageToSubdomain    ,           AsyncStream    ,           parseUri    ,   $     ) => {
    function search(query) {
        function searchInLanguage(language) {
            return AsyncStream.of('http://' + languageToSubdomain.get(language) + '.mangahere.co/advsearch.htm').httpRequest().pick(0)
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
                        action: form.prop('action'),
                        method: form.prop('method'),
                        params: form.serialize(),
                    };
                })
                .map(data => AsyncStream.repeat(data)).chain()
                .enumerate({ from: 1 })
                .map(([page, data]) => {
                    return {
                        uri: data.action,
                        method: data.method,
                        data: data.params + '&page=' + page,
                    };
                }).httpRequest().pick(0)
                .chopIf(document => $('.result_search .next-page', document).length == 0)  // nothing found
                .chopNextIf(document => $('.result_search .next-page .next', document).length == 0)  // no next page
                .map(document => AsyncStream.from($('.result_search a.manga_info', document).toArray())).chain()
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
            .join()
        ;
    }

    return search;
});
