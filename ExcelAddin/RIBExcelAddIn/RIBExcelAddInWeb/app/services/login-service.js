/**
 * Created by lst on 11.09.2018.
 */

(function (angular) {
    'use strict';

    angular.module('rib.app')
        .factory("loginService", ['$rootScope', "$http", '$q', 'globals',
            function ($rootScope, $http, $q, globals) {

                var service = {
                    storage: globals.storage,
                    serviceUrl: globals.serviceUrl,
                    identityUrl: globals.identityUrl,
                    checkCompanyUrl: globals.apis.checkCompanyCode,

                    authentication: {
                        authenticationRequired: 'rib:authentication:authNRequired',
                        loginConfirmed: 'rib:authentication:loginConfirmed',
                        loginFailed: 'rib:authentication:loginFailed',
                        loggedIn: 'rib:authentication:loggedIn',
                        logoutConfirmed: 'rib:authentication:logoutConfirmed',
                        checkCompanySuccessed: 'rib:authentication:checkCompanySuccessed'
                    },

                    userLoggedIn: false
                };

                var tokenKey = service.serviceUrl + 'rib:authentication:authNToken';
                var contextKey = service.serviceUrl + 'rib:ctx';
                var store;
                if (this.storage === 'private') {
                    store = sessionStorage;
                } else {
                    store = localStorage;
                }

                /**
                 */
                function clearToken() {
                    store.removeItem(tokenKey);
                    delete $http.defaults.headers.common['Authorization'];
                    service.userLoggedIn = false;
                }


                /**
                 * send login to backup and returning the token
                 */
                function login(username, password) {
                    var postData = $.param({
                        grant_type: 'password',
                        username: username,
                        password: password,
                        client_id: 'iTWO.Cloud',
                        client_secret: '{fec4c1a6-8182-4136-a1d4-81ad1af5db4a}',
                        scope: 'default'
                    });

                    var deferred = $q.defer();

                    $http({
                        method: 'POST',
                        url: service.identityUrl,
                        data: postData,
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    }).then(function (response) {
                        username = '';
                        password = '';
                        setToken(response.data);
                        authenticationSuccess();

                        checkCompanyCode(globals.companyCode).then(function (context) {
                            deferred.resolve();
                        }, function (error) {
                            deferred.reject(error);
                        });
                    }, function (error) {
                        deferred.reject(error);
                    });

                    return deferred.promise;
                }

                function checkCompanyCode(companyCode) {
                    var data = $.param({
                        requestedSignedInCompanyCode: companyCode
                    });
                    var url = service.serviceUrl + service.checkCompanyUrl + '?' + data;
                    $http.defaults.headers.common['Client-Context'] = '{}';
                    return $http({
                        method: 'GET',
                        url: url
                    }).then(function (response) {
                        var context = response.data;
                        var newContext = {
                            clientId: context.companyId,
                            signedInClientId: context.signedInCompanyId,
                            permissionClientId: context.requestedPermissionCompanyId,
                            permissionRoleId: context.requestRoleId,
                            secureClientRole: context.secureClientRolePart,
                            dataLanguageId: globals.dataLanguageId,
                            language: globals.language,
                            culture: globals.culture,
                        };
                        $http.defaults.headers.common['Client-Context'] = newContext;
                        checkCompanySuccess();
                        return newContext;
                    });
                }

                function logout() {
                    clearToken();
                    $rootScope.$broadcast(service.authentication.logoutConfirmed);
                }

                function authenticationSuccess() {
                    service.userLoggedIn = true;
                    $rootScope.$broadcast(service.authentication.loggedIn);
                }

                function checkCompanySuccess() {
                    $rootScope.$broadcast(service.authentication.checkCompanySuccessed);
                }

                /**
                 * @function setToken
                 *
                 * @param tokenData
                 *
                 * @description
                 *  sets the token into the $http header and saves it into the local storage
                 *
                 */

                function setToken(tokenData) {
                    if (!tokenData.expiration) {
                        //  getTime() returns the number of milliseconds since 1970/01/01
                        // tokenData.expires_in hold the expiration time in seconds, i.e. 604800 are 7 days
                        // 10 minutes before it really expires we request a new token
                        var expiration = new Date().getTime() + (tokenData.expires_in - 600) * 1000;
                        tokenData.expiration = expiration;
                    }

                    var sessionTokenValue = 'Bearer ' + tokenData.access_token;

                    $http.defaults.headers.common['Authorization'] = sessionTokenValue;

                    store.setItem(tokenKey, JSON.stringify(tokenData));
                }

                /**
                 * @function getToken
                 *
                 * @returns {promise.promise}
                 *
                 * @description
                 * return a promise to the token from localstorage
                 */
                function getToken() {
                    var deferred = $q.defer();

                    var token = JSON.parse(store.getItem(tokenKey));
                    if (token) {
                        deferred.resolve(token);
                    } else {
                        deferred.reject();
                    }
                    return deferred.promise;
                }

                function setContext(contextData) {
                    $http.defaults.headers.common['Client-Context'] = contextData;
                    store.setItem(contextKey, JSON.stringify(contextData));
                }

                function getContext() {
                    var deferred = $q.defer();

                    var ctx = JSON.parse(store.getItem(contextKey));
                    if (ctx) {
                        deferred.resolve(ctx);
                    } else {
                        deferred.reject();
                    }
                    return deferred.promise;
                }

                function checkForValidToken() {
                    var deferred = $q.defer();
                    getToken().then(function (tokenData) {
                        service.userLoggedIn = false;
    
                        if (!tokenData) {
                            $rootScope.$broadcast(service.authentication.authenticationRequired);
                            deferred.reject();
                            return false;
    
                        } else {
                            if (new Date().getTime() > tokenData.expiration) {
                                $rootScope.$broadcast(service.authentication.authenticationRequired);
                                deferred.reject();
                                return false;
    
                            } else {
                                setToken(tokenData);
                                authenticationSuccess();

                                checkCompanyCode(globals.companyCode).then(function (context) {
                                    deferred.resolve();
                                }, function (error) {
                                    deferred.reject(error);
                                });

                                return true;
                            }
                        }
                    });

                    return deferred.promise;
                }

                checkForValidToken();

                service.login = login;
                service.logout = logout;
                return service;
            }]);


})(angular);