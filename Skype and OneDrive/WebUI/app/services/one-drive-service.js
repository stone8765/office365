angular.module("skypeapp")
    .factory("oneDriveSvc", ["$http", "$q", "adalAuthenticationService",
        function ($http, $q, adalSvc) {
            var service = {};
            service.root = 'https://graph.microsoft.com/v1.0';
            service.apiRoot = 'http://localhost:802/file';

            service.get = function (uri) {
                var deferred = $q.defer();

                $http.get(service.root + uri).then(function (response) {
                    deferred.resolve(response);
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };

            service.generateGraphUrl = function (driveItem, targetParentFolder, itemRelativeApiPath) {
                var url = service.root;
                if (targetParentFolder) {
                    url += "/drives/" + driveItem.parentReference.driveId + "/items/" + driveItem.parentReference.id + "/children/" + driveItem.name;
                } else {
                    url += "/drives/" + driveItem.parentReference.driveId + "/items/" + driveItem.id;
                }

                if (itemRelativeApiPath) {
                    url += itemRelativeApiPath;
                }
                return url;
            };

            service.createSharingLink = function (driveItem) {
                var url = service.generateGraphUrl(driveItem, false, "/createLink");
                var requestBody = { type: "view" };

                $http({
                    method: 'POST',
                    url: url,
                    data: JSON.stringify(requestBody),
                    headers: {
                        'Content-Type': "application/json; charset=UTF-8"
                    }
                }).then(function (response) {
                    if (response.data && response.data.link && response.data.link.webUrl) {
                        window.prompt("View-only sharing link", response.data.link.webUrl);
                    } else {
                        console.log("Unable to retrieve a sharing link for this file.");
                    }
                }, function (err) {
                    console.log(err);
                });
            };

            service.createSharingLinkByWebApi = function (driveItem) {
                var webUrl = service.generateGraphUrl(driveItem, false, "/createLink");
                var requestBody = { type: "view", scope: "organization", webUrl: webUrl };
                var requestUrl = service.apiRoot + "/sharingLink";

                $http({
                    method: 'POST',
                    url: requestUrl,
                    data: requestBody,
                    headers: {
                        'Content-Type': "application/json; charset=UTF-8",
                        'x-request-office-byapi': service.root
                    }
                }).then(function (response) {
                    if (response.data && response.data.Success) {
                        window.prompt("View-only sharing link", response.data.SharingUrl);
                    } else {
                        console.log("Unable to retrieve a sharing link for this file.");
                    }
                }, function (err) {
                    console.log(err);
                });
            }

            service.uploadFileByApi = function (driveItem) {
                var requestBody = { driveItemId: driveItem.id };
                var requestUrl = service.apiRoot + "/uploadFile";
                $http({
                    method: 'POST',
                    url: requestUrl,
                    data: requestBody,
                    headers: {
                        'x-request-office-byapi': service.root
                    }
                }).then(function (response) {
                    if (response.data && response.data.Success) {
                        window.alert("upload success! ");
                    } else {
                        console.log(response.data.Error);
                    }
                }, function (err) {
                    console.log(err);
                });
            }

            service.downloadFileByApi = function (driveItem) {
                var requestBody = { driveItemId: driveItem.id };
                var requestUrl = service.apiRoot + "/downloadFile";
                $http({
                    method: 'POST',
                    url: requestUrl,
                    data: requestBody,
                    headers: {
                        'x-request-office-byapi': service.root
                    }
                }).then(function (response) {
                    if (response.data && response.data.Success) {
                        window.alert("download success! " + response.data.Filename);
                    } else {
                        console.log(response.data.Error);
                    }
                }, function (err) {
                    console.log(err);
                });
            }

            service.subscribe = function (driveItem) {
                var requestBody = { driveItemId: driveItem.id };
                var requestUrl = service.apiRoot + "/createSubscription";
                $http({
                    method: 'POST',
                    url: requestUrl,
                    data: requestBody,
                    headers: {
                        'x-request-office-byapi': service.root
                    }
                }).then(function (response) {
                    if (response.data) {
                        window.alert("create subscription success! " + response.data);
                    } else {
                        console.log(response.data.Error);
                    }
                }, function (err) {
                    console.log(err);
                });
            }

            return service;
        }]);