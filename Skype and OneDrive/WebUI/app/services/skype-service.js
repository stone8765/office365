angular.module("skypeapp")
    .factory("skypeSvc", ["$rootScope", "$http", "$q", "adalAuthenticationService",
        function ($rootScope, $http, $q, adalSvc) {
            var service = {
                config: {
                    version: globals.skypeVersion,
                    apiKeyCC: globals.skypeApiKey,
                    client_id: globals.clientId,
                    authLink: "https://login.windows.net/" + globals.tenant + "/oauth2/authorize?response_type=token",
                    authResource: "https://webdir.online.lync.com",
                    redirect: globals.redirect,
                    auth: null,
                    origins: ["https://webdir.online.lync.com/autodiscover/autodiscoverservice.svc/root"],
                    cors: true,
                    redirect_uri: globals.redirectUri,
                    locale: 'zh-cn'
                },
                mePerson: {},
                searchContacts: [],
                conversations: [],
                conversationsChanged: function () {

                }
            };

            function _broadcast(eventName, data) {
                // Custom Event is not supported in IE, below IIFE will polyfill the CustomEvent() constructor functionality in Internet Explorer 9 and higher
                (function () {

                    if (typeof window.CustomEvent === "function") {
                        return false;
                    }

                    function CustomEvent(event, params) {
                        params = params || { bubbles: false, cancelable: false, detail: undefined };
                        var evt = document.createEvent('CustomEvent');
                        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
                        return evt;
                    }

                    CustomEvent.prototype = window.parent.Event.prototype;
                    window.parent.CustomEvent = CustomEvent;
                })();

                var evt = new CustomEvent(eventName, { detail: data });
                window.parent.dispatchEvent(evt);
            };

            //private properties
            var apiManager = null;
            var client = null;

            //ensures the skype client object is initialized
            var ensureClient = function () {
                var deferred = $q.defer();
                if (client != null)
                    deferred.resolve();
                else {
                    Skype.initialize({
                        locale: 'zh-cn',
                        apiKey: service.config.apiKeyCC,
                        supportsAudio: true,
                        supportsVideo: true,
                        convLogSettings: true
                    }, function (api) {
                        apiManager = api;
                        client = apiManager.UIApplicationInstance;
                        client.signInManager.state.changed(function (state) {
                            $rootScope.$broadcast("stateChanged", state);
                        });

                        _broadcast('skype:inited', apiManager);

                        deferred.resolve();
                    }, function (er) {
                        deferred.resolve(er);
                    });
                }
                return deferred.promise;
            };

            service.signIn = function () {
                var deferred = $q.defer();
                ensureClient().then(function () {
                    //determine if the user is already signed in or not
                    if (client.signInManager.state() == "SignedOut") {
                        client.signInManager.signIn(service.config).then(function (z) {
                            //listen for status changes
                            client.personsAndGroupsManager.mePerson.status.changed(function (newStatus) {
                                console.log("logged in status: " + newStatus);
                                service.mePerson.status &&
                                    service.mePerson.status.set &&
                                    service.mePerson.status.set(newStatus);
                            });
                            listenForIncoming();
                            deferred.resolve();
                        }, function (er) {
                            deferred.reject(er);
                        });
                    }
                    else {
                        deferred.resolve();
                    }
                }, function (er) {
                    deferred.reject(er);
                });

                return deferred.promise;
            }
            //get the users contacts
            service.getMePerson = function () {
                var deferred = $q.defer();
                ensureClient().then(function () {
                    var mePerson = client.personsAndGroupsManager.mePerson;
                    // now mePerson is empty, load mePerson data by get id.
                    mePerson.status.get().then(function () {
                        service.mePerson = mePerson;
                        deferred.resolve(service.mePerson);
                    }, function (err) {
                        deferred.reject(err);
                    });
                }, function (err) {
                    deferred.reject(err);
                });
                return deferred.promise;
            };

            //get the users contacts
            service.getContacts = function () {
                var deferred = $q.defer();

                ensureClient().then(function () {
                    client.personsAndGroupsManager.all.persons.get().then(function (persons) {
                        //parse contacts into clean array
                        var contacts = [];
                        persons.forEach(function (person) {
                            contacts.push({
                                name: person.displayName(),
                                sip: person.id(),
                                avatarUrl: person.avatarUrl(),
                                person: person,
                                status: "Offline",
                                conversation: []
                            });
                        });
                        deferred.resolve(contacts);
                    });
                }, function (er) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };


            //get the users contacts
            service.getGroupsAndContacts = function () {
                var deferred = $q.defer();

                ensureClient().then(function () {
                    var groups = client.personsAndGroupsManager.all.groups;
                    groups.get().then(function (groups) {

                        var myGroups = [];
                        groups.forEach(function (group) {
                            var contacts = [];
                            group.persons.get().then(function(persons){
                                persons.forEach(function (person) {
                                    contacts.push({
                                        name: person.displayName(),
                                        sip: person.id(),
                                        avatarUrl: person.avatarUrl(),
                                        person: person,
                                        status: "Offline",
                                        conversation: []
                                    });
                                });
                            });

                            var groupName = group.name() ? group.name() : group.relationshipLevel();
                            myGroups.push({
                                name: groupName,
                                type: group.type(),
                                contacts: contacts
                            });
                        });
                        deferred.resolve(myGroups);
                    }, function (error) {
                        deferred.reject(error);
                    });
                }, function (er) {
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            function updateUserIdInput(userId) {
                if (!userId) {
                    return '';
                }
                return userId.indexOf('@') > 0 ? userId.indexOf('sip:') === 0 ? userId :
                    userId.indexOf('tel:') === 0 ? userId : userId : userId;
            }
            function updateUserIdOutput(userId) {
                if (!userId) return '';
                return userId.indexOf('sip:') === 0 ? userId.substring(4) : userId;
            }

            service.searchContact = function (text) {
                service.searchContacts = [];
                text = updateUserIdInput(text);
                var search = client.personsAndGroupsManager.createPersonSearchQuery();
                search.text(text);
                search.limit(20);
                search.getMore().then(function () {
                    var contacts = search.results();
                    if (contacts.length !== 0) {
                        angular.forEach(contacts, function (item) {
                            item.result.status.get().then(function () {
                                var person = item.result;
                                console.log("skype: " + person.displayName());
                                service.searchContacts.push({
                                    name: person.displayName(),
                                    sip: person.id(),
                                    avatarUrl: person.avatarUrl(),
                                    person: person,
                                    status: "Offline",
                                    conversation: []
                                });
                                service.contactLoaded && service.contactLoaded(person);
                            });
                        });
                    }
                    else {
                        console.log('error, Contact not found. Please check the spelling or try a different search.');
                    }
                });
            }

            var listeners = [], listeningForIncoming = false;

            function listenForIncoming() {
                if (listeningForIncoming)
                    return;
                listeningForIncoming = true;
                // Render incoming call with Conversation control
                listeners.push(client.conversationsManager.conversations.added(function (conv) {
                    var chatState = conv.selfParticipant.chat.state;
                    var audioState = conv.selfParticipant.audio.state;
                    if (chatState() != 'Notified' && audioState() != 'Notified') {
                        listeners.push(chatState.when('Notified', function () {
                            service.addConversation(conv);
                        }));
                        listeners.push(audioState.when('Notified', function () {
                            service.addConversation(conv);
                        }));
                        // This is probably a leftover disconnected conversation; don't render
                        // it yet, but listen in case the modalities become Notified again.
                        return;
                    }
                    service.addConversation(conv);
                }));
            }

            service.renderConversation = renderConversation;

            function renderConversation(conv, element) {
                // Options for renderConversation
                var options = {};
                if (conv.isGroupConversation()) {
                    options.conversationId = conv.uri();
                }
                else {
                    var participants = [];
                    participants.push(conv.participants(0).person.id());
                    options.participants = participants;
                }
                options.modalities = ['Chat']; // TODO: adding audio or video causes renderConversation to fail
                createCC(options, 'Incoming', element);
            }

            function cleanupConversation(conversation) {
                if (conversation.state() !== 'Disconnected') {
                    conversation.leave();
                }
            }

            service.startConversation = function (contact) {
                var conversation = client.conversationsManager.getConversation(contact.person);
                service.addConversation(conversation);
                return conversation;
            }

            service.leaveConversation = function (conversation) {
                if (conversation.state() !== 'Disconnected') {
                    conversation.leave().then(function () {
                        service.removeConversation(conversation);
                    }, function (error) {
                        service.removeConversation(conversation);
                        console.log('End Conversation: ' + (error ? error.message : ''));
                    });
                } else {
                    service.removeConversation(conversation);
                }
            };

            service.addConversation = function (conversation) {
                for (var _i = 0, conversations_2 = service.conversations; _i < conversations_2.length; _i++) {
                    var c = conversations_2[_i];
                    if (c === conversation)
                        return;
                }
                service.conversations.push(conversation);
                service.conversationsChanged && service.conversationsChanged(service.conversations);
            }

            service.removeConversation = function (conversation) {
                for (var _i = 0, conversations_2 = service.conversations; _i < conversations_2.length; _i++) {
                    var c = conversations_2[_i];
                    if (c === conversation) {
                        service.conversations.splice(_i, 1);
                        service.conversationsChanged && service.conversationsChanged(service.conversations);
                        break;
                    }
                }

            }

            function createCC(options, direction, element) {
                apiManager.renderConversation(element, options).then(function (conv, a, b, c) {

                    listeners.push(conv.participants.added(function (p) {
                        console.log('info, ' + p.person.displayName() + ' has joined the conversation');
                    }));
                    listeners.push(conv.state.changed(function (newValue, reason, oldValue) {
                        console.log('info, Conversation state changed from ' + oldValue + ' to ' + newValue);
                    }));

                    // Decide whether to start or accept
                    startOrAcceptModalities(conv, options);
                }, function (error) {
                    console.log('error, Failed to create conversation control. ' + error);
                });
            }

            function startOrAcceptModalities(conv, options) {
                var chatState = conv.selfParticipant.chat.state,
                    audioState = conv.selfParticipant.audio.state,
                    videoState = conv.selfParticipant.video.state;

                audioState.changed(function (newValue, reason, oldValue) {
                    // 'Notified' indicates that there is an incoming call
                    if (newValue === 'Notified') {
                        if (confirm("Would you like to accept this incoming call(audio)?")) {
                            setTimeout(function () {
                                // To accept an incoming call with video enabled call
                                conv.audioService.accept()
                            }, 0);
                        } else {
                            // Reject the incoming call
                            conv.audioService.reject();
                        }
                    }
                })

                videoState.changed(function (newValue, reason, oldValue) {
                    // 'Notified' indicates that there is an incoming call
                    if (newValue === 'Notified') {
                        if (confirm("Would you like to accept this incoming call(video)?")) {
                            setTimeout(function () {
                                // To accept an incoming call with video enabled call
                                conv.videoService.accept()
                            }, 0);
                        } else {
                            // Reject the incoming call
                            conv.videoService.reject();
                        }
                    }
                })
            }
            return service;
        }]);