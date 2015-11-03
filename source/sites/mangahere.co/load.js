'use strict';

define([
    './difference.js', '/utility/AsyncStream.js', '/utility/http.js', 'jquery'
], (   difference    ,           AsyncStream    ,           http    ,   $     ) => {
    function load(id) {
        let language = id.slice(0, 2);
        let name = id.slice(3);
        let specific = difference[language];
        let manga = http.get('http://' + specific.subdomain + '.mangahere.co/manga/' + name + '/')
            .map(document => {
                let titles = (() => {
                    let main = $(document)
                        .find('.manga_detail li label:contains("' + specific.summaryMarker + '")').text().trim()
                        .slice(0, -specific.summaryMarker.length).trim()
                    ;
                    let alternatives = $(document)
                        .find('.manga_detail li:has(label:contains("' + specific.alternativeNameMarker + '"))').text().trim()
                        .slice(specific.alternativeNameMarker.length).trim()
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
                                id: specific.compressChapterId(/\/c([^\/]+)\/$/.exec(uri)[1]),
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
                                            let uris = options.map(option => specific.resolvePageListUri($(option).prop('value')));
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
