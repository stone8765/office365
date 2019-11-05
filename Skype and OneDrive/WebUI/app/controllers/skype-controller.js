angular.module("skypeapp")
    .controller("skypeCtrl", ["$scope", "$location", "skypeSvc", function ($scope, $location, skypeSvc) {
        $scope.mePerson = {
            id: null, displayName: null, company: null, department: null, phoneNumbers: null, email: null
        };
        $scope.groups = [];
        $scope.conversations = [];

        skypeSvc.conversationsChanged = function (conversations) {
            $scope.conversations = conversations;
            if (!$scope.$$phase)
                $scope.$apply();
        };

        $scope.goToOneDrive = function(){
            $location.path("/onedrive");
        }

        $scope.searchText = "";
        $scope.searchContacts = [];
        skypeSvc.contactLoaded = function (person) {
            var c = {
                name: person.displayName(),
                sip: person.id(),
                avatarUrl: person.avatarUrl(),
                person: person,
                status: "Offline",
                conversation: []
            }
            $scope.searchContacts.push(c);
            person.status.get().then(function (s) {
                toggleStatus(c, s);
            });
            person.status.changed(function (s) {
                toggleStatus(c, s);
            });
            person.status.subscribe();

            if (!$scope.$$phase)
                $scope.$apply();
        }
        $scope.search = function () {
            skypeSvc.searchContact($scope.searchText);
        }

        $scope.defaultPhoto = "/content/nopic.jpg";

        //sign into skype
        skypeSvc.signIn().then(function () {
            console.log("signed in");
            skypeSvc.getMePerson().then(function (mePerson) {
                $scope.mePerson = mePerson;
            });

            skypeSvc.getGroupsAndContacts().then(function(groups){
                $scope.groups = groups;
            },function(err){

            });

            //load contacts
            skypeSvc.getContacts().then(function (contacts) {
                $scope.contacts = contacts;
                angular.forEach($scope.contacts, function (e, i) {
                    e.person.status.get().then(function (s) {
                        toggleStatus(e, s);
                    });
                    e.person.status.changed(function (s) {
                        toggleStatus(e, s);
                    });
                    e.person.status.subscribe();
                });
            }, function (err) {
                console.log("error: " + er);
            });
        }, function (er) {
            console.log("error: " + er);
        });

        var toggleStatus = function (contact, status) {
            contact.status = status;
            if (!$scope.$$phase)
                $scope.$apply();
        };

        //set a contact as active
        $scope.startConversation = function (contact) {
            $scope.currentConv = skypeSvc.startConversation(contact);
        };

        $scope.closeConversation = function (conv) {
            skypeSvc.leaveConversation(conv);
        };

        $scope.currentConv = null;
        $scope.setActive = function(conv){
            $scope.currentConv = conv;
        }

        var canChat = function (contact) {
            var chattableStatus = {
                Online: true, Busy: true, Idle: true, IdleOnline: true, Away: true, BeRightBack: true,
                DoNotDisturb: false, Offline: false, Unknown: false, Hidden: false
            };
            return chattableStatus[contact.status];
        };

        //listen for skype state changes
        $scope.$on("stateChanged", function (evt, val) {
            $scope.state = val;
            console.log("State: " + val);
        });
    }]);