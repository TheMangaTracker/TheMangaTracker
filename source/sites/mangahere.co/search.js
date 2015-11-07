'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');

    let AsyncStream = await require('/utility/AsyncStream.js');
    let http = await require('/utility/http.js');

    let languageSpecifics = await require('languageSpecifics.js');

    function search(query) {
        function searchInLanguage(language) {
            let languageSpecific = languageSpecifics[language];

            return http.get('http://' + languageSpecific.subdomain + '.mangahere.co/advsearch.htm')
                .map(document => {
                    let form = $(document).find('#searchform').clone();
                    
                    form.find('input[name="name"]').val(query.title); 
                    form.find('input[name="author"]').val(query.writer); 
                    form.find('input[name="artist"]').val(query.artist); 

                    if (query.status === 'ongoing') {
                        form.find('input[name="is_completed"]').val([0]);
                    } else if (query.status === 'complete') {
                        form.find('input[name="is_completed"]').val([1]);
                    } 

                    if (query.layout === 'right_to_left') {
                        form.find('input[name="direction"]').val(['rl']); 
                    } else if (query.layout === 'left_to_right') {
                        form.find('input[name="direction"]').val(['lr']); 
                    }

                    return http.get(form.prop('action') + '?' + form.serialize());
                }).chain()
                .skipIf(document => $(document).find('.result_search .directory_footer').length === 0)  // nothing found
                .map(function extractResults(document) {
                    let results = $(document).find('.result_search');
                    let fromFirstPage = AsyncStream.from(results.find('.manga_info').toArray().map(a => a.href))
                        .map(uri => {
                            let name = /\/([^\/]+)\/$/.exec(uri)[1];
                            return language + '.' + name;
                        })
                    ;
                    let fromOtherPages = AsyncStream.from(results.find('.next').toArray().map(a => a.href))
                        .map(http.get).chain()
                        .map(extractResults).chain()
                    ;
                    return fromFirstPage.chain(fromOtherPages);
                }).chain()
            ;
        }

        return AsyncStream.from(Object.keys(languageSpecifics))
            .keepIf(language => query.languages.has(language))
            .map(searchInLanguage).join()
        ;
    }

    return search;
});
