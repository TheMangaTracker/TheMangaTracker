'use strict';

angular.module('search', [])
.controller('search', function($scope) {
    $scope.title = 'Search - ' + chrome.runtime.getManifest().name;

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

