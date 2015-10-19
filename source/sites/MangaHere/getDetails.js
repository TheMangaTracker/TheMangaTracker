'use strict';

define([
    './languageToSubdomain.js', '/utility/AsyncStream.js', '/utility/parseUri.js', 'jquery',
], (   languageToSubdomain    ,           AsyncStream    ,           parseUri    ,   $     ) => {
    function getDetails(id) {
        let language = id.slice(-2);
        let domain = 'http://' + languageToSubdomain.get(language) + '.mangahere.co';
        return AsyncStream.of(domain + '/manga/' + id.slice(0, -3) + '/')
            .ajax()
            .map(document => {
                let title = $(document).find('h1.title').text().trim();

                let chapters = [];
                $(document).find('.detail_list > ul').first().children('li').each((i, e) => {
                    chapters.push({
                        id: parseUri($(e).find('a').attr('href')).pathParts.slice(2).join('.'),
                        title: $(e).find('span.left').text().trim().slice(title.length).trim(), 
                    });
                });
                chapters.reverse();

                return {
                    title,
                    chapters,
                };
            })
        ;
    }

    return getDetails;
});
