angular.module("Undercover", [])

.controller("UndercoverCtrl", function($scope, $timeout) {

        var socket = null, onActionComplete = null;
        
        $scope.state = "NAME";
        
        $scope.connect = function(name) {
            if (!name) return;
            socket = io(location.origin, {reconnection:false});
            addEventsToSocket();

            $scope.state = "CONNECTING";
            socket.emit("joinGame", name);
        }

        function addEventsToSocket() {
            if (socket==null) return;

            socket.$on = function (event, fn) { // This is shortcut for 'socket.on' with $apply inside
                    this.on(event, function(a,b,c,d,e,f,g){
                        $scope.$apply(function() {
                            fn(a,b,c,d,e,f,g);
                        });
                    });
                }

            for (var e in serverEvents) {
                socket.$on(e, serverEvents[e]);
            }
        }

        var pendingTimeout;
        function doAction(action,a,b,c,d,e,f,g,h) {
            socket.emit(action, a,b,c,d,e,f,g,h);
            pendingTimeout = $timeout(function() {
                $scope.pending = true;
            }, 300);

        }

        /*--- Events from server ---*/

        var serverEvents = {
            "connect": function () {
                $scope.state = "WAITING";
            },

            "disconnect": function () {
                $scope.state = "DISCONNECTED";
                $scope.player = null;
                $scope.round = null;
                $scope.playerNames = null;
                //alert("Disconnected from game :(");
            },

            "error": function (err) {
                $scope.state = "ERROR";
                $scope.error = err;
            },

            "waiting": function(waitingPlayers) {
                $scope.waitingPlayers = waitingPlayers;
            },

            "startGame": function (mySetup, index, playerNames) {
                $scope.player = mySetup;
                $scope.index = index;
                $scope.players = playerNames.map(function(n){return{name:n}});
                $scope.waitingPlayers = null;
            },

            "startRound": function (round) {
                $scope.round = round;
                $scope.roundLocation = null;
                $scope.state = "CHOOSE_LOCATION";
            },

            "turn": function(turn) {
                $scope.turn=turn;
                if (turn==$scope.index){
                    // My turn
                    $scope.state = "TURN";
                }
            },

            "turnEnd": function() {
                $scope.state = "WAITING";
            },

            "actionRejected": function(why) {
                alert(why);
                if (pendingTimeout) $timeout.cancel(pendingTimeout);
                $scope.pending = false;
            },

            "actionCompleted": function() {
                $scope.pending = false;
                if (pendingTimeout) $timeout.cancel(pendingTimeout);
                if (onActionComplete) onActionComplete();
                onActionComplete = null;
            },

            "cache": function(contents) {
                $scope.cache = contents;
                $scope.state = "CACHE";
                $scope.reorderingCache = false;
            },

            "cardPicked": function(type, value) {
                var deck = Utils.getPlayerDeckByType($scope.player, type);
                if (Array.isArray(value)) {
                    Utils.pushMany(deck, value);
                } else {
                    deck.push(value);
                }
            },

            "discard": function() {
                $scope.state = "DISCARD";
            },

            "captured": function(p) {
                if (p==$scope.index) {
                    alert("You got captured! You lost the game...");
                    $scope.state = "FINISHED";
                }
                $scope.players[p].captured = true;
            },

            "finishGame": function(success) {
                if (success) {
                    alert("Game ended. Mission accomplished!")
                } else {
                    alert("Game ended. You lost.")
                }
                $scope.state = "FINISHED";
            }
        }


        /*--- User actions ---*/

        $scope.chooseLocation = function(loc) {
            doAction("chooseLocation", loc);
            onActionComplete = function() {
                $scope.roundLocation = $scope.player.locations[loc];
                $scope.player.locations.splice(loc, 1);
                if ($scope.state == "CHOOSE_LOCATION") {
                    $scope.state = "WAITING";
                }
            }
        }

        $scope.doTurnAction = function(action) {
            if (!$scope.pending) {
                doAction(action);
            }
        }

        $scope.takeFromCache = function(card) {
            doAction("takeFromCache", card);
            onActionComplete = function() {
                var deck = Utils.getPlayerDeckByType($scope.player, $scope.cache[card].type);
                deck.push($scope.cache[card].value)
                $scope.cache.splice(card, 1);
            }
        }

        $scope.putInCache = function(type, card) {
            doAction("putInCache", type, card);
            onActionComplete = function() {
                var deck = Utils.getPlayerDeckByType($scope.player, type);
                $scope.cache.push({type:type, value: deck[card]});
                deck.splice(card, 1);

            }
        }

        $scope.reorderCache = function(card, to) {
            doAction("reorderCache", card, to);
            onActionComplete = function() {
                Utils.moveItem($scope.cache, card, to);
            };
        }

        $scope.exitCache = function() {
            doAction("exitCache");
            onActionComplete = function() {
                $scope.state = "TURN";
            }
        }

        $scope.discard = function(type, card) {
            doAction("discard", type, card);
        }

        $scope.playerCardClicked = function(type, card) {
            if ($scope.state=="CACHE") {
                $scope.putInCache(type, card);
            }
            if ($scope.state=="CHOOSE_LOCATION" && type=="location") {
                $scope.chooseLocation(card);
            }
            if ($scope.state=="DISCARD") {
                $scope.discard(type, card);
            }
        }

        $scope.cacheCardClicked = function(card) {
            if ($scope.state=="CACHE") {
                if (!$scope.reorderingCache) {
                    $scope.takeFromCache(card);
                } else {
                    if ($scope.reorderCacheFirst==null) {
                        $scope.reorderCacheFirst = card;
                    } else {
                        $scope.reorderCache($scope.reorderCacheFirst, card);
                        $scope.reorderCacheFirst = null;
                    }
                }
            }
        }

        $scope.toggleReorderCache = function() {
            $scope.reorderingCache = !$scope.reorderingCache;
        }

})

.filter("reqs", function() {
        function reqToString(req) {
            var ss = [];
            for (var i in req) {
                var s;
                if (req[i]==1){
                    s = i;
                } else {
                    s = req[i] + " " + i + "s";

                }
                ss.push(s);
            }
            return ss.join(" and ");
        }
        return function(reqs) {

            if (Array.isArray(reqs[0])) {
                // Some options
                return reqs.map(reqToString).join(", or ");
            } else {
                // One option
                return reqToString(reqs);
            }
        }
    });