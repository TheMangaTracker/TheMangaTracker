'use strict';

angular.module('TheMangaTracker', [
    'ngRoute',
])
.config(['$routeProvider',
function( $routeProvider ) {
    $routeProvider
    .when('/', { redirectTo: 'my_manga' })
    .otherwise({ redirectTo: '/' });
}]);

