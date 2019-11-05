/**
 * Created by lst on 11.09.2018.
 */

(function (angular) {
    'use strict';

    angular.module('rib.app')
        .controller('mainController', ['$scope', 'globals', '$location',
            function ($scope, globals, $location) {
                $scope.modules = globals.modules;

                $scope.go = function (moduleId) {
                    Office.context.document.settings.set('moduleId', moduleId);
                    Office.context.document.settings.saveAsync(function (asyncResult) {
                        if (asyncResult.status == Office.AsyncResultStatus.Failed) {
                            console.log('Settings save failed. Error: ' + asyncResult.error.message);
                        } else {
                            $location.path(moduleId);
                        }
                    });
                };

                function init() {
                    var moduleId = Office.context.document.settings.get('moduleId');
                    if (moduleId) {
                        $location.path(moduleId);
                    }
                }

                init();
            }]);

})(angular);