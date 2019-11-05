angular.module("skypeapp")
    .controller("loginCtrl", ["$scope", "$location", "adalAuthenticationService",
     function ($scope, $location, adalSvc) {
        if (adalSvc.userInfo.isAuthenticated) {
            $location.path("/onedrive");
        }

        $scope.loginMessage = '';

        $scope.login = function () {
            $scope.loginMessage = "login...";
            if(adalSvc.login){
                adalSvc.login();
            } else if(adalSvc.loginPopup){
                adalSvc.loginPopup();
            }
        };

        // optional
        $scope.$on("adal:loginSuccess", function () {
            $scope.loginMessage = "loginSuccess";
            $location.path("/onedrive");
        });

        $scope.$on("msal:loginSuccess", function () {
            $scope.loginMessage = "loginSuccess";
            $location.path("/onedrive");
        });

        // optional
        $scope.$on("adal:loginFailure", function () {
            $scope.loginMessage = "loginFailure";
            $location.path("/login");
        });

        $scope.$on("msal:loginFailure", function () {
            $scope.loginMessage = "loginFailure";
            $location.path("/login");
        });

    }])