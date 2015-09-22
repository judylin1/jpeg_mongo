function RouteCtrl($route) {
  var self = this;
  $route.when('/tasks', {template:'../pages/welcome.html'});
  $route.when('/tasks/:photoId', {template:'../pages/task-details.html', controller:ImageDetailCtrl});
  $route.otherwise({redirectTo:'/tasks'});
  $route.onChange(function () {
      self.params = $route.current.params;
  });
  $route.parent(this);
  this.addTask = function () {
      window.location = "#/tasks/add";
  };
}

function ImageController(image) {
  this.tasks = image.query();
}

function ImageDetailCtrl(image) {
  this.task = image.get({photoId:this.params.photoId});
}
