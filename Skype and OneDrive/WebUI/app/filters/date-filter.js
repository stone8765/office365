angular.module("skypeapp")
    .filter('formatDate', ['$filter', function () {
        return function (input) {
            if (input instanceof Date) {
                return input.toLocaleString();
            }
            try {
                var d = new Date(input);
                return d.toLocaleString();
            } catch (e) {
                return (input.toLocaleString || input.toString).apply(input);
            }
        };
    }]);