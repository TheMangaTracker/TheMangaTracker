'use strict';

modules.define(async (require) => {
    let $ = await require('jQuery');

    let AsyncStream = await require('/utility/AsyncStream.js');
    let http = await require('/utility/http.js');

    let languageSpecifics = await require('languageSpecifics.js');

    function load(id) {
        let language = id.slice(0, id.indexOf('.'));
        let name = id.slice(language.length + 1);
        let languageSpecific = languageSpecifics[language];
        let manga = http.get('http://' + languageSpecific.subdomain + '.mangahere.co/manga/' + name + '/')
            .map(document => {
                let titles = (() => {
                    let main = $(document)
                        .find('.manga_detail li label:contains("' + languageSpecific.summaryMarker + '")').text().trim()
                        .slice(0, -languageSpecific.summaryMarker.length).trim()
                    ;
                    let alternatives = $(document)
                        .find('.manga_detail li:has(label:contains("' + languageSpecific.alternativeNameMarker + '"))').text().trim()
                        .slice(languageSpecific.alternativeNameMarker.length).trim()
                    ;
                    alternatives = (alternatives === 'None') ? [] : alternatives.split('; ')
                    return [main, ...alternatives];
                })();

                let chapters = (() => {
                    let anchors = $(document).find('.detail_list > ul').first().children('li').find('a').toArray();
                    let urisAndTitles = anchors.map(anchor => {
                        let uri = $(anchor).prop('href');
                        let title = $(anchor).parent().text().trim().slice(titles[0].length).trim();
                        return [uri, title];
                    });
                    return AsyncStream.from(urisAndTitles)
                        .map(([uri, title]) => {
                            let chapter = AsyncStream.of({
                                id: languageSpecific.compressChapterId(/\/c([^\/]+)\/$/.exec(uri)[1]),
                                uri,

                                manga,

                                title,

                                pages: http.get(uri)
                                    .map(document => {
                                        function extractPage(document) {
                                            return {
                                                uri: document.URL,
            
                                                chapter,

                                                imageUri: $(document).find('#image').prop('src'),
                                            };
                                        }

                                        let firstPage = AsyncStream.of(extractPage(document));
                                        let otherPages = (() => {
                                            let options = $(document).find('.readpage_top .go_page .right option:not([selected])').toArray();
                                            let uris = options.map(option => languageSpecific.resolvePageListUri($(option).prop('value')));
                                            return AsyncStream.from(uris)
                                                .map(http.get).chain()
                                                .map(extractPage)
                                            ;
                                        })();
                                        return firstPage.chain(otherPages);
                                    }).chain()
                                ,
                            });

                            return chapter;
                        }).chain()
                    ;
                })();

                return {
                    id,
                    uri: document.URL,

                    titles,
                    
                    language,

                    chapters,
                };
            })
        ;

        return manga;
    }

    return load;
});
