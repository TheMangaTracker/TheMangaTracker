'use strict';

define([
    '/servers.js',
    '/thirdparty/angular.js',
], function(servers) {

    angular.module('page', [])
    .controller('page', function($scope) {
        $scope.title = 'Search';
        
        $scope.searchIterator = undefined;
        $scope.search = function() {
            $scope.urls = [];
            if ($scope.searchIterator !== undefined) {
                $scope.searchIterator.discard();
            }
            $scope.searchIterator = servers.search({ name: $scope.name });
            let i = 0;
            $scope.searchIterator.request({
                whenProvided(manga) {
                    manga.server.getLastChapter(manga.url).request({
                        whenProvided(lastChapterUrl) {
                            $scope.$apply(function() {
                                $scope.urls.push(lastChapterUrl);  // TODO: discard these properly 
                            });   
                        },
                        whenError(message) {
                            console.log(manga.url + ' ' + message);  
                        },
                    });

                    $scope.searchIterator.request(this);
                },
                whenFinished() {
                    console.log('done.');      
                },
                whenError(message) {
                    console.log('error: ' + message);    
                }
            });
        };
    });

    angular.element(document).ready(function() {
        angular.bootstrap(document, ['page']);    
    });

});

