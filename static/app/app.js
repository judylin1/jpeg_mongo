var app = angular.module("MyApp", ['ngRoute', 'ngAnimate']);

// configure our routes
app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl : 'partials/home.html',
      controller  : 'ImageController'
    })

    // route for the about page
    .when('/tasks/:photoId', {
      templateUrl : 'partials/tasks.html',
      controller  : 'ShowImageController'
    })

    .when('/tasks', {
      templateUrl : 'partials/home.html',
      controller  : 'ImageController'
    })

    .otherwise({redirectTo:'/tasks'});

});


app.controller('ImageController', function ($scope, $http) {
  $scope.pageClass = 'page-home';

  $http.get('api/tasks').
    success(function (data, status, headers, config) {
      $scope.tasks = data;
    }).
    error(function (data, status, headers, config) {
      console.log('Error Received');
    });
});

app.controller("ShowImageController", function ($scope, $http, $routeParams) {
  $scope.pageClass = 'page-home';

  $routeParams.photoId;

  console.log('JL : ' + $routeParams.photoId);

  $http.get('api/tasks/' + $routeParams.photoId).
    success(function (data, status, headers, config) {
      $scope.imageItem = data;
    }).
    error(function (data, status, headers, config) {
      console.log('Error Received');
    });

});
