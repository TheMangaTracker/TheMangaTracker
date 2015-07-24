'use strict';

define([
    '/thirdparty/angular.js',
    '/servers.js',
], function() {

    angular.module('page', [])
    .controller('page', function($scope) {
        $scope.title = 'Search';

        $scope.search = function() {
            $scope.urls = [];
            var requestManga = servers.search({ name: $scope.name })
            for (let i = 0; i < 200; ++i) {
                requestManga(function(manga) {
                    if (manga === undefined) {
                        return;    
                    }
                    $scope.$apply(function() {
                        $scope.urls[i] = manga;    
                    });   
                });
            }
        };
    });

    angular.element(document).ready(function() {
        angular.bootstrap(document, ['page']);    
    });

});

