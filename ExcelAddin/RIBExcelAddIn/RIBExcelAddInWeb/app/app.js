/**
 * Created by lst on 11.09.2018.
 */

(function (angular, window, $) {
    'use strict';

    angular.module('rib.app', ["ngRoute",
        'officeuifabric.core',
        'officeuifabric.components.button',
        'officeuifabric.components.textfield',
        'officeuifabric.components.list'])
        .config(["$routeProvider",
            function ($routeProvider) {
                $routeProvider.when("/login", {
                    name: 'login',
                    controller: "loginController",
                    templateUrl: "/app/templates/view-login.html",
                }).when("/main", {
                    name: 'main',
                    controller: "mainController",
                    templateUrl: "/app/templates/view-main.html",
                }).otherwise({
                    redirectTo: "/main"
                });

                var customModules = window.globals.modules;
                angular.forEach(customModules, function (module) {
                    $routeProvider.when("/" + module.id, {
                        name: module.id,
                        controller: module.controller,
                        templateUrl: module.templateUrl,
                    });
                });
            }])
        .service('globals', function () {
            return window.globals;
        }).service('$', function () {
            return $;
        }).run(['$rootScope', '$location', 'loginService',
            function ($rootScope, $location, loginService) {
                $rootScope.$on('$routeChangeStart',
                    function (event, toState, toParams, fromState, fromParams) {
                        if (toState.name == 'login') return;
                        if (!loginService.userLoggedIn) {
                            $location.path('/login');
                        }
                    });
            }]);

})(angular, window, $);

