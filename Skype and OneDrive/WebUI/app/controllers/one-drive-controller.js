angular.module("skypeapp")
    .controller("oneDriveCtrl", ["$scope", "$location", "oneDriveSvc", function ($scope, $location, oneDriveSvc) {
        $scope.data = {};

        $scope.encodeURIComponent = function (str) {
            return window.encodeURIComponent(str);
        };
        var path = $location.$$hash;
        $scope.paths = [];
        $scope.path = path;

        var tempPaths = path.split('/');
        var tempPath = '';
        angular.forEach(tempPaths, function (pathItem) {
            if (pathItem && pathItem.length > 0) {
                tempPath += '/' + pathItem;
                $scope.paths.push({ name: pathItem, path: tempPath });
            }
        });

        var parameters = "?expand=thumbnails,children(expand=thumbnails(select=large))";
        var root = "/me/drive/root";
        path = path ? encodeURIComponent(path) : path;
        var odquery = root + (path ? `:${path}:` : '') + parameters;
        oneDriveSvc.get(odquery).then(function (res) {
            $scope.data = res.data;
        }, function (err) {
            console.log(err);
        });


        $scope.createSharingLink = function (driveItem) {
            return oneDriveSvc.createSharingLink(driveItem);
        };

        $scope.createSharingLinkByWebApi = function (driveItem) {
            return oneDriveSvc.createSharingLinkByWebApi(driveItem);
        };

        $scope.uploadFileByApi = function (driveItem) {
            return oneDriveSvc.uploadFileByApi(driveItem);
        };

        $scope.downloadFileByApi = function (driveItem) {
            return oneDriveSvc.downloadFileByApi(driveItem);
        };


        // $scope.drives = [];
        // $scope.items = {};

        // oneDriveSvc.get("/me/drives").then(function (res) {
        //     $scope.drives = res.data.value;
        //     angular.forEach($scope.drives, function (drive) {
        //         oneDriveSvc.get("/drives/" + drive.id+"/root/children").then(function (res) {
        //             $scope.items[drive.id] = res.data.value;
        //         });
        //     });
        // }, function (err) {
        //     console.log(err);
        // });


        $scope.subscribe = function(driveItem){
            return oneDriveSvc.subscribe(driveItem);
        }

        $scope.open = function(driveItem){
            var w  = window.open(driveItem.webUrl);
        }

    }]);