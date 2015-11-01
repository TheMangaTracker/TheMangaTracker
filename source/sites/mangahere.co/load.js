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
                    .find('.manga_detail li label:contains("' + specific.summaryMarker + '")').text()
                    .slice(0, -specific.summaryMarker.length).trim()
                ;
                let alternativeTitles = $(mangaDocument)
                    .find('.manga_detail li:has(label:contains("' + specific.alternativeNameMarker + '"))').text()
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
                        let title = $(anchor).parent().text()
                            .slice(titles[0].length).trim()
                        ;
                        let chapterStream = AsyncStream.of(anchor)
                            .map(anchor => $(anchor).prop('href')).httpRequest().pick(0)
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
                                let pagesStream = firstPageStream.chain(otherPagesStream);

                                return {
                                    id: specific.compressChapterId(/\/c([^\/]+)\/$/.exec(chapterDocument.URL)[1]),
                                    uri: chapterDocument.URL,

                                    manga: mangaStream,
                                    
                                    title,

                                    pages: pagesStream,
                                };
                            })
                        ;

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
