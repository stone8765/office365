angular.module("skypeapp")
    .directive('errSrc', function () {
        return {
            link: function (scope, element, attrs) {
                element.bind('error', function () {
                    if (attrs.src != attrs.errSrc) {
                        attrs.$set('src', attrs.errSrc);
                    }
                });
                attrs.$observe('ngSrc', function (value) {
                    if (!value && attrs.errSrc) {
                        attrs.$set('src', attrs.errSrc);
                    }
                });
            }
        }
    });


angular.module("skypeapp")
    .directive('replaceSrc', function ($http) {
        return {
            link: function (scope, element, attrs) {
                $http.get(attrs.replaceSrc, {
                    responseType: "blob",
                    headers: {
                        'x-request-office': attrs.replaceSrc
                    }
                }).then(function (image) {
                    // Convert blob into image that app can display
                    var imgUrl = window.URL || window.webkitURL;
                    var blobUrl = imgUrl.createObjectURL(image.data);
                    attrs.$set('src', blobUrl);
                }, function (err) {
                    console.error(err);
                }).catch(function(e){
                    console.error(e);
                });
            }
        }
    });