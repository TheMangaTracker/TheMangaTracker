'use strict';

define([
    '/thirdparty/angular.js',
    'hosts.search.js',
], function() {

    angular.module('page', [])
    .controller('page', function($scope) {
        $scope.title = 'Search';

        $scope.search = function() {
            $scope.urls = [];
            var iterator = hosts.search({ name: $scope.name })
            var loop = function(manga) {
                if (manga === undefined) {
                    return;    
                }
                $scope.$apply(function() {
                    $scope.urls.push(manga.manga);    
                });   
                iterator(loop);
            };  
            iterator(loop);
        };
    });

    angular.element(document).ready(function() {
        angular.bootstrap(document, ['page']);    
    });

});

