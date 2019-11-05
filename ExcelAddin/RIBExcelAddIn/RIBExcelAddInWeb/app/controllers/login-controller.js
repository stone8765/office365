/**
 * Created by lst on 11.09.2018.
 */

(function (angular) {
    'use strict';

    angular.module('rib.app')
        .controller('loginController', ['$scope', '$location','loginService',
            function ($scope, $location, loginService) {

                $scope.loginData={
                    username:null,
                    password:null,
                    message:null
                }

                $scope.login = function(){
                    loginService.login($scope.loginData.username,$scope.loginData.password)
                    .then(function(){
                        $scope.loginData.message = null;
                        $location.path('/main');
                    },function(error){
                        $scope.loginData.message = error.message;
                    });
                }


            }]);

})(angular);