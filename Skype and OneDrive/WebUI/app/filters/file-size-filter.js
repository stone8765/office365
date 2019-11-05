angular.module("skypeapp")
    .filter('humanReadableFileSize', ['$filter', function ($filter) {
        // See https://en.wikipedia.org/wiki/Binary_prefix
        var decimalByteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
        return function (input) {
            var i = -1;
            var fileSizeInBytes = input;

            do {
                fileSizeInBytes = fileSizeInBytes / 1024;
                i++;
            } while (fileSizeInBytes > 1024);

            var result = decimalByteUnits[i];
            return Math.max(fileSizeInBytes, 0.1).toFixed(1) + ' ' + result;
        };
    }]);