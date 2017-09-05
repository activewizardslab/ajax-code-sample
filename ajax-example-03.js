(function() {
    'use strict';

    angular
        .module('SailingroutesApp')
        .service('PointsApi', PointsApi);

    function PointsApi($http, $q, $log, Upload) {
        var service = {
            createPoint: createPoint,
            pointsList: pointsList
        };

        return service;

        function createPoint(point) {
            $http.defaults.xsrfCookieName = 'csrftoken';
            $http.defaults.xsrfHeaderName = 'X-CSRFToken';

            var deferred = $q.defer();

            Upload.upload({
                url: '/api/v1/points/'+point.point_type+'/',
                arrayKey: '',
                data: point
            })
            .then(createPointComplete)
            .catch(createPointFail);

            return deferred.promise;

            function createPointComplete(response) {
                deferred.resolve(response);
            }

            function createPointFail(error) {
                $log.error('XHR Failed for createPoint(type='+point.point_type+')');
                deferred.reject(error);
            }
        };

        function pointsList(point_type) {
            var deferred = $q.defer();

            $http.get('/api/v1/points/' + point_type + '/list')
                .then(pointsListComplete)
                .catch(pointsListFail);

            return deferred.promise;

            function pointsListComplete(response) {
                response.data.point_type = point_type;
                deferred.resolve(response.data);
            };

            function pointsListFail(error) {
                $log.error('XHR Failed for pointsList(type='+point.point_type+')');
                deferred.reject(error);
            };
        };
    };

})();
