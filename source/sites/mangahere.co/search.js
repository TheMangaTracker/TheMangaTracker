'use strict';

define([
    './difference.js', '/utility/AsyncStream.js', '/utility/http.js', 'jquery'
], (   difference    ,           AsyncStream    ,           http    ,   $     ) => {
    function search(query) {
        function searchInLanguage(language) {
            let specific = difference[language];

            return http.get('http://' + specific.subdomain + '.mangahere.co/advsearch.htm')
                .map(document => {
                    let form = $(document).find('#searchform').clone();
                    
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

                    return http.get(form.prop('action') + '?' + form.serialize());
                }).chain()
                .skipIf(document => $(document).find('.result_search .directory_footer').length === 0)  // nothing found
                .map(function extractResults(document) {
                    let resultsDiv = $(document).find('.result_search');
                    let prefix = AsyncStream.from(resultsDiv.find('.manga_info').toArray().map(a => a.href))
                        .map(uri => {
                            let name = /\/([^\/]+)\/$/.exec(uri)[1];
                            return language + '.' + name;
                        })
                    ;
                    let suffix = AsyncStream.from(resultsDiv.find('.next').toArray().map(a => a.href))
                        .map(http.get).chain()
                        .map(extractResults).chain()
                    ;
                    return prefix.chain(suffix);
                }).chain()
            ;
        }

        return AsyncStream.from(Object.keys(difference))
            .passIf(language => query.languages.has(language))    
            .map(searchInLanguage).join()
        ;
    }

    return search;
});
