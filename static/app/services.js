angular.service('Task', function ($resource) {
    return $resource('api/tasks/:photoId', {}, {
        update: {method:'PUT'}
    });
});
