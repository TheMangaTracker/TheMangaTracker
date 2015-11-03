'use strict';

define([
    'require', '/utility/AsyncStream.js'
], ( require ,           AsyncStream    ) => {
    function load(site, id, chapterId) {
        let mangaStream = AsyncStream.of(site)
            .asyncMap((callbacks, site) => {
                require([
                    './' + site + '/load.js',
                ], (                load    ) => {
                    callbacks.onResult(load);     
                });
            })
            .map(load => load(id)).chain()
        ;

        if (arguments.length < 3) {
            return mangaStream;
        }

        let chapterStream = mangaStream
            .pick('chapters').chain()
            .dropWhile(chapter => chapter.id !== chapterId)
            .take(1)
        ;

        return chapterStream;
    }

    return load;
});
