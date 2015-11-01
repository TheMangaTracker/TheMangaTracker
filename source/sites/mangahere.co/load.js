'use strict';

define([
    './difference.js', '/utility/AsyncStream.js', 'jquery'
], (   difference    ,           AsyncStream    ,   $     ) => {
    function load(id) {
        let language = id.slice(0, 2);
        let name = id.slice(3);
        let specific = difference[language];
        let mangaStream = AsyncStream.of('http://' + specific.subdomain + '.mangahere.co/manga/' + name + '/').httpRequest().pick(0)
            .map(mangaDocument => {
                let mainTitle = $(mangaDocument)
                    .find('.manga_detail li label:contains("' + specific.summaryMarker + '")').text().trim()
                    .slice(0, -specific.summaryMarker.length).trim()
                ;
                let alternativeTitles = $(mangaDocument)
                    .find('.manga_detail li:has(label:contains("' + specific.alternativeNameMarker + '"))').text().trim()
                    .slice(specific.alternativeNameMarker.length).trim()
                ;
                alternativeTitles = (alternativeTitles === 'None') ? [] : alternativeTitles.split('; ')
                let titles = [mainTitle, ...alternativeTitles];
            
                let chaptersStream = AsyncStream.of(mangaDocument)
                    .map(mangaDocument => {
                        let anchors = $(mangaDocument).find('.detail_list > ul').first().children('li').find('a').toArray();
                        return AsyncStream.from(anchors);
                    }).chain()
                    .map(anchor => {
                        let uri = $(anchor).prop('href');

                        let chapterStream = AsyncStream.of({
                            id: specific.compressChapterId(/\/c([^\/]+)\/$/.exec(uri)[1]),
                            uri,

                            manga: mangaStream,

                            title: $(anchor).parent().text().trim().slice(titles[0].length).trim(),

                            pages: AsyncStream.of(uri).httpRequest().pick(0)
                                .map(chapterDocument => {
                                    function extractPageFromDocument(pageDocument) {
                                        return {
                                            uri: pageDocument.URL,
        
                                            chapter: chapterStream,

                                            imageUri: $(pageDocument).find('#image').prop('src'),
                                        };
                                    }

                                    let firstPageStream = AsyncStream.of(chapterDocument)
                                        .map(extractPageFromDocument)
                                    ;
                                    let otherPagesStream = AsyncStream.of(chapterDocument)
                                        .map(chapterDocument => {
                                            let options = $(chapterDocument).find('.readpage_top .go_page .right option:not([selected])').toArray();
                                            return AsyncStream.from(options);
                                        }).chain()
                                        .map(option => $(option).prop('value')).httpRequest().pick(0)
                                        .map(extractPageFromDocument)
                                    ;
                                    return firstPageStream.chain(otherPagesStream);
                                }).chain()
                            ,
                        });

                        return chapterStream;
                    }).chain()
                ;

                return {
                    id,
                    uri: mangaDocument.URL,

                    titles,
                    language,

                    chapters: chaptersStream,
                };
            })
        ;

        return mangaStream;
    }

    return load;
});
