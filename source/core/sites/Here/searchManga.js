'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');

    let AsyncStream = await require('/utility/AsyncStream.js');
    let http = await require('/utility/http.js');

    return function searchManga(query) {
        let searchIn = (languageId) => {
            return new AsyncStream.fromEmitter(async (emit) => {
                let queryDocument = await http.getHtml(`http://${(languageId === 'en') ? 'www' : languageId}.mangahere.co/advsearch.htm`);
                let queryForm = $(queryDocument).find('#searchform');
                
                queryForm.find('input[name="name"]').val(query.title); 
                queryForm.find('input[name="author"]').val(query.writer); 
                queryForm.find('input[name="artist"]').val(query.artist); 

                if (query.status === 'ongoing') {
                    queryForm.find('input[name="is_completed"]').val([0]);
                } else if (query.status === 'complete') {
                    queryForm.find('input[name="is_completed"]').val([1]);
                } 

                if (query.layout === 'right_to_left') {
                    queryForm.find('input[name="direction"]').val(['rl']); 
                } else if (query.layout === 'left_to_right') {
                    queryForm.find('input[name="direction"]').val(['lr']); 
                }

                let resultsDocument = await http.getHtml(queryForm.prop('action') + '?' + queryForm.serialize());
                let resultsDiv = $(resultsDocument).find('.result_search');

                if (resultsDiv.find('.directory_footer').length === 0) {  // nothing found
                    return;
                }

                while (true) {
                    for (let anchor of resultsDiv.find('.manga_info').toArray()) {
                        let uri = anchor.href;
                        let name = /\/([^\/]+)\/$/.exec(uri)[1];
                        let id = `${languageId}!${name}`;
                        let manga = this.getMangaById(id);
                        await emit(manga);
                    }

                    if (resultsDiv.find('.next').length === 0) {
                        break;
                    }

                    resultsDocument = await http.getHtml(resultsDiv.find('.next').prop('href'));
                    resultsDiv = $(resultsDocument).find('.result_search');
                }
            });
        };

        return AsyncStream.fromIterable(this.getLanguageIds())
            .filter(languageId => query.languageIds.has(languageId))
            .map(languageId => searchIn(languageId)).merge()
        ;
    };
});

