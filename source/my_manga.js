'use strict';

angular.module('my_manga', [])
.controller('my_manga', function($scope) {
    $scope.title = 'My Manga - ' + chrome.runtime.getManifest().name;
    $scope.message = 'HAI';
});

