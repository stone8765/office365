angular.module("skypeapp")
    .controller("powerBICtrl", ["$scope", "$location", "powerBISvc", function ($scope, $location, oneDriveSvc) {
        $scope.data = {};

        $scope.test = function () {
            oneDriveSvc.getDataTest().then(function (data) {
                $scope.data = data;
            }, function (err) {
                $scope.data = err;
            });
        };

    }]);