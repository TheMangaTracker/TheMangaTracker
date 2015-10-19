'use strict';

require([
    '/sites/getDetails.js', '/utility/parseUri.js', 'angular',
], (        getDetails    ,           parseUri    ,   ng     ) => {
    let page = ng.module('page', []);

    page.config([
        '$compileProvider',
       ( $compileProvider ) => {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }])

    page.controller('page', $scope => {
        let params = parseUri(location.href).queryData;
        
        getDetails(params.site, params.manga).request({
            yield(details) {
                $scope.$apply(() => {
                    $scope.details = details;
                });
            }
        }); 
    });

    ng.element(document).ready(() => {
        ng.bootstrap(document, ['page']);    
    });
});

