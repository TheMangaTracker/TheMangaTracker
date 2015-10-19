'use strict';

require([
    '/sites.js', '/utility/parseUri.js', 'angular',
], (  sites    ,           parseUri    ,   ng     ) => {
    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])

    page.controller('page', $scope => {
        let params = parseUri(location.href).queryData;
        $scope.manga = params.manga;
        $scope.site = params.site;
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

