'use strict';

define([
    '/thirdparty/angular.js',
    '/servers.js',
], function() {

    angular.module('page', [])
    .controller('page', function($scope) {
        $scope.title = 'Search';
        
        $scope.searchIterator = undefined;
        $scope.search = function() {
            $scope.urls = [];
            if ($scope.searchIterator !== undefined) {
                $scope.searchIterator.close();
            }
            $scope.searchIterator = servers.search({ name: $scope.name });
            for (let i = 0; i < 250; ++i) {
                $scope.searchIterator.requestNext({
                    whenProvidedNext(manga) {
                        $scope.$apply(function() {
                            $scope.urls[i] = manga;    
                        });   
                    },
                });
            }
        };
    });

    angular.element(document).ready(function() {
        angular.bootstrap(document, ['page']);    
    });

});

