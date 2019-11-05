angular.module("skypeapp")
    .directive('skypeChat', ['skypeSvc', function (skypeSvc) {
        return {
            scope: {
                conv: '=',
                visible: '='
            },
            templateUrl: '/app/templates/skype-chat.html',
            controller: ['$scope', function ($scope) {
                $scope.close = function () {
                    skypeSvc.leaveConversation($scope.conv);
                };
            }],
            link: function (scope, element, attrs, controllers) {
                var chatContainer = element.children().children().eq(1)[0];
                skypeSvc.renderConversation(scope.conv, chatContainer);
            }
        }
    }]);