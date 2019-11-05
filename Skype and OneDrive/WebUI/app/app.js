angular.module("skypeapp", ["ngRoute", "AdalAngular"])
    .config(["$routeProvider", "$httpProvider", "$injector", "adalAuthenticationServiceProvider",
        function ($routeProvider, $httpProvider, $injector, adalProvider) {
            $routeProvider.when("/login", {
                controller: "loginCtrl",
                templateUrl: "/app/templates/view-login.html",
                requireADLogin: false,
                requireLogin: false
            }).when("/skype", {
                controller: "skypeCtrl",
                templateUrl: "/app/templates/view-skype.html",
                requireADLogin: true,
                requireLogin: true
            }).when("/onedrive", {
                controller: "oneDriveCtrl",
                templateUrl: "/app/templates/one-drive.html",
                requireADLogin: true,
                requireLogin: true
            }).when("/powerbi", {
                controller: "powerBICtrl",
                templateUrl: "/app/templates/power-bi.html",
                requireADLogin: true,
                requireLogin: true
            }).otherwise({
                redirectTo: "/login"
            });

            var config = {

                // for adal
                instance: "https://login.microsoftonline.com/",
                tenant: globals.tenant,
                clientId: globals.clientId,
                extraQueryParameter: "mkt=en-gb",
                endpoints: { // for adal
                    "https://webdir.online.lync.com": "https://webdir.online.lync.com",
                    "https://webpoolselkr101.infra.lync.com":"https://webpoolselkr101.infra.lync.com",
                    "https://webpooldb41e02.infra.lync.com":"https://webpooldb41e02.infra.lync.com",
                    "https://graph.microsoft.com": "https://graph.microsoft.com",
                    "https://api.powerbi.com/v1.0/myorg": "https://analysis.windows.net/powerbi/api"
                },
                popUp: true,
                //cacheLocation: 'localStorage',
                callback: function (errorDescription, token, error, tokenType) {

                },

                // for msal
                authority: "https://login.microsoftonline.com/" + globals.tenant,
                clientID: globals.clientId,
                optionalParams: {
                    endPoints: new Map([
                        ['https://webdir.online.lync.com',
                            [
                                "Meetings.ReadWrite",
                                "User.ReadWrite",
                                "Conversations.Receive",
                                "Contacts.ReadWrite",
                                "Conversations.Initiate"
                            ]
                        ],
                        ['https://graph.microsoft.com',
                            [
                                "user.read",
                                "Files.ReadWrite",
                                "Files.ReadWrite.All"
                            ]
                        ]
                    ]),
                    scopes: [
                        "Files.ReadWrite",
                        "Files.ReadWrite.All",
                        "Sites.ReadWrite.All",
                        "Meetings.ReadWrite",
                        "User.ReadWrite",
                        "Conversations.Receive",
                        "Contacts.ReadWrite",
                        "Conversations.Initiate"],
                    navigateToLoginRequestUrl: true,
                },
                tokenReceivedCallback: function (errorDescription, token, error, tokenType) {

                },
            };
            adalProvider.init(config, $httpProvider);
        }]);