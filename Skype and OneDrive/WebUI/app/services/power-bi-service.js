angular.module("skypeapp")
    .factory("powerBISvc", ["$http", "$q",
        function ($http, $q) {
            var service = {};
            
            service.getDataTest = function(){
                var url = "https://api.powerbi.com/v1.0/myorg/Reports";
               return $http.get(url).then(function(data){
                    console.log(data);
                    return data;
                },function(error){
                    console.error(error);
                    return error;
                })
            };

            return service;
        }]);