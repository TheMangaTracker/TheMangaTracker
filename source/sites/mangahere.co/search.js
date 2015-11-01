'use strict';

define([
    './difference.js', '/utility/AsyncStream.js', 'jquery'
], (   difference    ,           AsyncStream    ,   $     ) => {
    function search(query) {
        function searchInLanguage(language) {
            let specific = difference[language];
            return AsyncStream.of('http://' + specific.subdomain + '.mangahere.co/advsearch.htm').httpRequest().pick(0)
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
                        data: form.serialize(),
                    };
                })
                .map(data => AsyncStream.repeat(data)).chain()
                .enumerate({ from: 1 })
                .map(([pageNo, data]) => {
                    return {
                        uri: data.action,
                        method: data.method,
                        data: data.data + '&page=' + pageNo,
                    };
                }).httpRequest().pick(0)
                .chopIf(document => $(document).find('.result_search .next-page').length == 0)  // nothing found
                .chopNextIf(document => $(document).find('.result_search .next-page .next').length == 0)  // no next page
                .map(document => {
                    let anchors = $(document).find('.result_search a.manga_info').toArray();
                    return AsyncStream.from(anchors);
                }).chain()
                .map(anchor => {
                    let uri = $(anchor).prop('href');
                    let name = /\/([^\/]+)\/$/.exec(uri)[1];
                    return language + '.' + name;
                })
            ;
        }

        return AsyncStream.from(Object.keys(difference))
            .filter(language => query.languages.has(language))    
            .map(searchInLanguage).join()
        ;
    }

    return search;
});
