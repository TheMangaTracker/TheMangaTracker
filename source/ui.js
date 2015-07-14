'use strict';

angular.module('ui', [
    'ngRoute',
])
.config(['$routeProvider',
function( $routeProvider ) {
    $routeProvider
    .when('/', { redirectTo: '/my_manga' })
    .otherwise({ redirectTo: '/' });
}]);

