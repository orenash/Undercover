var Utils = {

    clone: function (obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    pushMany: function (deck, cards) {
        for (var i = 0; i < cards.length; i++) {
            deck.push(cards[i]);
        }
    },

    pickMany: function (deck, count) {
        var arr = [];
        for (var i = 0; i < count; i++) {
            arr.push(deck.shift());
        }
        return arr;
    },

    shuffle: function (array) {
        var counter = array.length, temp, index;

        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter--;

            // And swap the last element with it
            temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }

        return array;
    },

    totalCards: function(player) {
      return player.items.length + player.locations.length + player.communications.length;
    },

    hasItems: function (array, items, substring) {
        return items.every(function (i1) {
            return array.some(function (i2) {
                return i1 == i2 || (substring && i2.indexOf(i1) > -1)
            })
        });
    },

    hasItem: function(array, item, substring) {
        return Utils.hasItems(array, [item], substring);
    },

    hasItemExcept: function(array, item, except) {
        return array.some(function (it, index) {
            return it==item && index!=except;
        })
    },

    hasItemsMul: function(array, itemsMul, substring) {
        for (var item in itemsMul) {
            var count = array.filter(function(i) {
                return item==i || (substring && i.indexOf(item) > -1);
            }).length;
            if (count<itemsMul[item]) return false;
        }
        return true;
    },

    joinItems: function(players, indices) {
        items = [];
        for (var i = 0; i < indices.length; i++) {
            items = items.concat(players[indices[i]].items);
        }
        return items;
    },

    removeItems: function (array, items, substring) {
        for (var i1 in items) {
            for (var i2 in array) {
                if ((!substring && array[i2] == items[i1]) ||
                    (substring && array[i2].indexOf(items[i1]) > -1)) {
                    array.splice(i2, 1);
                    break;
                }
            }
        }
    },

    removeItem: function(array, item, substring) {
        return Utils.removeItems(array, [item], substring);
    },

    getPlayerDeckByType: function (player, type) {
        switch (type) {
            case "item":
                return player.items;
            case "location":
                return player.locations;
            case "communication":
                return player.communications;
        }
    },

    getGameDeckByType: function (game, type) {
        switch (type) {
            case "item":
                return game.itemsDeck;
            case "location":
                return game.locationsDeck;
            case "communication":
                return game.communicationsDeck;
        }
    },

    moveItem: function (array, item, to) {
        if (item == to) return;
        var savedItem = array[item];
        if (item < to) {
            for (var i = item; i < to; i++) {
                array[i] = array[i + 1];
            }
            array[to] = savedItem;
        }
        if (item > to) {
            for (var i = item; i > to; i--) {
                array[i] = array[i - 1];
            }
            array[to] = savedItem;
        }
    }
}

if (typeof module != "undefined") module.exports = Utils;