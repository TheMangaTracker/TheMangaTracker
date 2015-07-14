'use strict';

angular.module('ui')
.config(['$routeProvider', function($routeProvider) {
    $routeProvider
    .when('/my_manga', { templateUrl: '/ui/my_manga.html', controller: 'my_manga' });
}])
.controller('my_manga', ['$scope', function($scope) {
    $scope.message = 'MY MANGA';    
}]);
