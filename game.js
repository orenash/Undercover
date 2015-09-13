
var Settings = require("./settings.js");
var Utils = require('./utils.js');

var roomIndex = 0;

var userActions = ["disconnect", "chooseLocation",
    "visitCache", "pickItem", "pickLocation", "pickCommunications", "takeSpecialItem",
    "announce", "takeFromCache", "putInCache", "reorderCache", "exitCache", "discard"];

var Game = module.exports = function(io, users) {
    this.io = io;
    this.users = users;

    this.setRoomAndEvents();
    this.startGame();
}

var pr = Game.prototype;

pr.setRoomAndEvents = function() {
    var game = this;
    this.room = ++roomIndex;
    for (var u in this.users) {
        this.users[u].join(this.room);
        for (var ac in userActions) {
            (function(usr, action) {
                this.users[usr].on(action, function (a, b, c, d, e, f, g, h) {
                    game.userAction(action, usr, a, b, c, d, e, f, g, h);
                });
            }).call(this, u, userActions[ac])
        }
    }
}

pr.userAction = function(action,usr,a,b,c,d,e,f,g,h) {
    try {
        if (!this[action] || !typeof this[action] == "function") throw "Unknown action "+action;
        this[action](usr,a,b,c,d,e,f,g,h);
        this.users[usr].emit("actionCompleted");
    } catch (e) {
        if (typeof e == "object" && e.stack) {
            console.error(e.stack);
            this.users[usr].emit("actionRejected", "Unexpected error in server...");
        } else {
            console.log("Player "+usr+" action rejected: " + e);
            this.users[usr].emit("actionRejected", e);
        }
    }
}

pr.startGame = function() {

    console.log("Starting game (" + this.users.map(function(u){return u.userName}).join(",") + ")");

    this.locations = Utils.clone(Settings.LOCATIONS);
    this.itemsDeck = Utils.shuffle(Utils.clone(Settings.ITEM_CARDS));
    this.locationsDeck = Utils.shuffle(Utils.clone(Settings.LOCATION_CARDS));
    this.communicationsDeck = Utils.shuffle(Utils.clone(Settings.COMMUNICATION_CARDS));
    var specialities = Utils.shuffle(Utils.clone(Settings.SPECIALTIES));
    var missions = Utils.shuffle(Utils.clone(Settings.MISSIONS));

    this.players = [];
    for (var i=0; i<this.users.length; i++) {
        var player = {
            index: i,
            items: Utils.pickMany(this.itemsDeck, Settings.PLAYER_INIT_ITEMS),
            locations: Utils.pickMany(this.locationsDeck, Settings.PLAYER_INIT_LOCATIONS),
            communications: Utils.pickMany(this.communicationsDeck, Settings.PLAYER_INIT_COMMUNICATIONS),
            speciality: specialities.pop(),
            mission: missions.pop()
        };

        this.users[i].emit("startGame", player, i, this.users.map(function(u){return u.userName}));

        this.players.push(player);
    }

    var initCacheItems = [];
    Utils.pushMany(initCacheItems, Utils.pickMany(this.itemsDeck, Settings.CACHE_INIT_ITEMS)
        .map(function(item){return {type:"item",value:item}}));
    Utils.pushMany(initCacheItems, Utils.pickMany(this.locationsDeck, Settings.CACHE_INIT_LOCATIONS)
        .map(function(loc){return {type:"location",value:loc}}));
    Utils.pushMany(initCacheItems, Utils.pickMany(this.communicationsDeck, Settings.CACHE_INIT_COMMUNICATIONS)
        .map(function(comm){return {type:"communication",value:comm}}));
    Utils.shuffle(initCacheItems);
    var initItemsPerCache = Math.floor(initCacheItems.length / Settings.LOCATIONS_NUM);

    for (var loc in this.locations) {
        this.locations[loc].cache = Utils.pickMany(initCacheItems, initItemsPerCache);
    }

    this.round = 0;

    this.startRound();
}

pr.startRound = function(){
    this.round++;
    if (this.round>Settings.NUM_ROUNDS) {
        console.log("Game ended - out of rounds");
        this.io.to(this.room).emit("finishGame", false);
        return;
    }
    console.log("Starting round " + this.round);
    this.turn = -1;
    this.roundLocations = [];
    if (this.round>1) {
        for (var p in this.players) {
            var loc = this.locationsDeck.shift();
            this.players[p].locations.push(loc);
            this.users[p].emit("cardPicked", "location", loc);
        }
    }
    this.io.to(this.room).emit("startRound", this.round);
}

pr.disconnect = function(u) {
    console.log("Player "+u+" has disconnected and will be marked captured");
    this.playerCaptured(u);
}

pr.chooseLocation = function(p, loc){
    if (this.turn>=0 || this.roundLocations[p]) throw "You're not choosing location now";
    if (loc<0 || !this.players[p].locations.length) throw "Invalid location index";

    var location = this.players[p].locations[loc];
    console.log("Player "+p+" chooses location "+location);
    this.roundLocations[p] = location;
    this.players[p].locations.splice(loc, 1);

    for (var pl in this.players) {
        if (!this.roundLocations[pl]) return;
    }
    // All players chose locations
    this.startTurn();
}

pr.startTurn = function(){
    this.turn++;
    // Skip captured players
    while (this.turn < this.players.length && this.players[this.turn].captured) {
        this.turn++;
    }

    if (this.turn>= this.players.length) {
        // Round is over, start new round
        this.startRound();
        return;
    }
    console.log("Player "+this.turn+" is playing");
    this.turnActions = [];
    this.inAction = null;

    this.io.to(this.room).emit("turn", this.turn);
}

pr.endTurn = function() {
    if (Utils.totalCards(this.players[this.turn]) > Settings.MAX_CARDS_IN_HAND) {
        console.log("Player "+this.turn+" has too many cards in hand, must discard some");
        this.users[this.turn].emit("discard");
    } else {
        // Next turn
        this.users[this.turn].emit("turnEnd");
        this.startTurn();
    }
}

pr.visitCache = function(p) {
    this.verifyTurn(p);
    this.verifyTurnAction(p, "visitCache");

    console.log("Player "+p+" visits cache of "+this.roundLocations[p]);
    this.users[p].emit("cache", this.locations[this.roundLocations[p]].cache);
    this.inAction = "visitCache";
}

pr.pickCard = function(p, action, type, amount) {
    this.verifyTurn(p);
    this.verifyTurnAction(p, action);

    var deck = Utils.getGameDeckByType(this, type);
    var playerDeck = Utils.getPlayerDeckByType(this.players[p], type);
    var cards;
    if (amount==null) {
        cards = deck.shift();
        console.log("Player "+p+" picks "+type+" card" + cards);
        playerDeck.push(card);
    } else {
        cards = Utils.pickMany(deck, amount);
        console.log("Player "+p+" picks "+type+" cards" + JSON.stringify(cards));
        Utils.pushMany(playerDeck, cards);
    }

    this.users[p].emit("cardPicked", type, cards);
    this.turnActionComplete(action);
}

pr.pickItem = function(p) {
    this.pickCard(p, "pickItem", "item", 1);
}

pr.pickLocation = function(p) {
    this.pickCard(p, "pickLocation", "location", 1);
}

pr.pickCommunications = function(p) {
    this.pickCard(p, "pickCommunications", "communication", 2);
}

pr.takeSpecialItem = function(p) {
    this.verifyTurn(p);
    this.verifyTurnAction(p, "takeSpecialItem");

    var loc = this.locations[this.roundLocations[p]];
    var pl = this.players[p];
    if (!loc.specialItem) {
        if (loc.specialItemReq) {
            throw "Special item already taken from " + this.roundLocations[p];
        } else {
            throw "There is no special item in " + this.roundLocations[p];
        }
    }
    var allowed = false;
    for (var r in loc.specialItemReq) {
        // Iterate through different requirement options
        var reqItems = loc.specialItemReq[r];
        if (Utils.hasItems(pl.items, reqItems, true)) {
            //Utils.removeItems(pl.items, reqItems, true);
            allowed = true;
            break;
        }
    }
    if (!allowed) {
        throw "You don't have the required items to pick " + loc.specialItem;
    }
    console.log("Player "+p+" takes special item ("+loc.specialItem+" in "+this.roundLocations[p]);
    pl.items.push(loc.specialItem);
    this.users[p].emit("cardPicked", loc.specialItem);
    loc.specialItem = null;
    this.turnActionComplete("takeSpecialItem");
}

pr.announce = function(p) {
    this.verifyTurn(p);
    this.verifyTurnAction(p, "announce");

    var location = this.roundLocations[p];
    console.log("Player "+p+" announced their presence in "+location);

    var playersInLocation = [];
    for (var p in this.roundLocations) {
        if (this.roundLocations[p]==location)
            playersInLocation.push(p);
    }

    if (this.checkMissionConditions(playersInLocation, location)) {
        this.io.to(this.room).emit("finishGame", true);
        this.turnActionComplete("announce");
        return;
    }

    if (playersInLocation.length<=1) {
        // No other player in the announcer location
        console.log("No other player in "+location+", player "+p+" got captured!");
        this.playerCaptured(p);
        return;
    }

    console.log("Meetup in "+location+" ("+JSON.stringify(playersInLocation)+")");

    this.io.to(this.room).emit("meetup", location, playersInLocation);
    this.inAction = "announce";
    this.meetupPlayers = playersInLocation;
    this.meetupTurn = -1;
    this.startMeetupTurn();

    //this.turnActionComplete("announce"); TODO
}

pr.checkMissionConditions = function(players, location) {
    var allItems = Utils.joinItems(this.players, players);
    for (var p in players) {
        var mission = this.players[p].mission;
        if (location == mission.location &&
            players.length >= mission.reqSpies &&
            Utils.hasItemsMul(allItems, mission.reqItems, true)) {

            console.log("Conditions met for mission of player "+p+" at "+location+": "+mission.title);
            return true;
        }
    }
    return false;
}

pr.startMeetupTurn = function() {
    this.meetupTurn = (this.meetupTurn + 1) % this.meetupPlayers.length;
    if (this.meetupTurn >= this.meetupPlayers.length) {
        this.meetupTurn = null;
        this.meetupPlayers = null;
        this.io.to(this.room).emit("meetupEnd");
        this.turnActionComplete("announce");
        return;
    }
    console.log("Meetup - player "+this.meetupPlayers[this.meetupTurn]+" is requested to pass cards");
    this.users[this.meetupPlayers[this.meetupTurn]].emit("meetupPassCards");
}

pr.meetupPassCards = function(p, cards) {
    this.verifyMeetupTurn(p);

    // TODO check cards
    console.log("Meetup - player "+this.meetupPlayers[this.meetupTurn]+" is passing cards "+JSON.stringify(cards));
    this.meetupPassingCards = cards;
    // TODO remove passing cards from player decks
    this.meetupTakeTurn = this.meetupTurn;
    this.startMeetupTakeTurn();
}

pr.startMeetupTakeTurn  = function() {
    this.meetupTakeTurn = (this.meetupTakeTurn + 1) % this.meetupPlayers.length;
    if (this.meetupTakeTurn == this.meetupTurn) {
        // TODO return remaining cards to player decks
        // Next meetup turn
        this.meetupTakeTurn = null;
        this.startMeetupTurn();
        return;
    }
    console.log("Meetup - player "+this.meetupPlayers[this.meetupTakeTurn]+" is requested to take cards");
    this.users[this.meetupPlayers[this.meetupTakeTurn]].emit("meetupTakeCards", this.meetupPassingCards);
}

pr.meetupTakeCards = function(p, cards) {
    // TODO Verify take turn and cards
    // TODO remove cards from this.meetupPassingCards, add to player
    // Next take turn
    this.startMeetupTakeTurn();
}

pr.playerCaptured = function(p) {
    this.players[p].captured = true;
    this.io.to(this.room).emit("captured", p);

    if (this.players.filter(function(p){return !p.captured}).length >= 2) {
        // At least two players left, game goes on
        if (this.turn==p) {
            // It was captured player's turn, move to next turn
            this.startTurn();
        }
    } else {
        console.log("Game ended - one player left");
        this.io.to(this.room).emit("finishGame", false);
    }
}

pr.takeFromCache = function(p, card) {
    this.verifyTurn(p);
    this.verifyInAction("visitCache");

    var cache = this.locations[this.roundLocations[p]].cache;
    if (card>=cache.length || card<0) {
        throw "Invalid index in cache " + card;
    }

    console.log("Player "+p+" takes card "+card+" from cache: "+JSON.stringify(cache[card]));
    var deck = Utils.getPlayerDeckByType(this.players[p], cache[card].type);
    deck.push(cache[card].value);
    cache.splice(card, 1);
}

pr.putInCache = function(p, type, card) {
    this.verifyTurn(p);
    this.verifyInAction("visitCache");

    var deck = Utils.getPlayerDeckByType(this.players[p], type);
    if (!deck || card < 0 || card >= deck.length) {
        throw "Invalid type/card to put in cache ("+type+"-"+card+")";
    }

    var cache = this.locations[this.roundLocations[p]].cache;
    if (cache.length>=Settings.MAX_CARDS_IN_CACHE) {
        throw "There are too many items in the cache";
    }

    console.log("Player "+p+" puts card "+type+"-"+card+" in cache: "+deck[card]);

    cache.push({type:type,value:deck[card]});
    deck.splice(card,1);
}

pr.reorderCache = function(p, card, to) {
    this.verifyTurn(p);
    this.verifyInAction("visitCache");

    var cache = this.locations[this.roundLocations[p]].cache;
    if (card>=cache.length || card<0 || to>=cache.length || to<0) {
        throw "Invalid indexes in cache ("+card+","+to+")";
    }

    console.log("Player "+p+" reorders cache ("+card+" to "+to+")");
    Utils.moveItem(cache, card, to);
}

pr.exitCache = function(p) {
    this.verifyTurn(p);
    this.verifyInAction("visitCache");

    console.log("Player "+p+" exits the cache");
    this.inCache = false;
    this.turnActionComplete("visitCache");
}

pr.verifyTurn = function (p) {
    if (p!=this.turn) {
        throw "It's not your turn";
    }
}

pr.verifyMeetupTurn = function (p) {
    if (p!=this.meetupPlayers[this.meetupTurn]) {
        throw "It's not your turn in meetup";
    }
}

pr.verifyTurnAction = function (p, action) {
    if (this.inAction) {
        throw "You're in the middle of action "+this.inAction;
    }
    if (this.turnActions.some(function(a){return a==action})) {
        throw "You have already done " + action + " in this turn";
    }
};

pr.verifyInAction = function (action) {
    if (this.inAction != action) {
        throw "You're not in the middle of action " + action;
    }
}

pr.turnActionComplete = function(action) {
    this.inAction = null;
    this.turnActions.push(action);
    if (this.turnActions.length==Settings.ACTIONS_PER_TURN) {
        // Finish turn
        this.endTurn();
    } else {
        // Play another action
        this.users[this.turn].emit("turn");
    }
}

pr.discard = function(p, type, card) {
    this.verifyTurn(p);

    var deck = Utils.getPlayerDeckByType(this.players[p], type);
    if (!deck || card < 0 || card >= deck.length) {
        throw "Invalid type/card to put in cache ("+type+"-"+card+")";
    }
    console.log("Player "+p+" discards card "+type+","+card);
    deck.splice(card,1);
    if (Utils.totalCards(this.players[p])<=Settings.MAX_CARDS_IN_HAND) {
        this.users[p].emit("turnEnd");
        // Next turn
        this.startTurn();
    }
}