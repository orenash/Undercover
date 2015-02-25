module.exports = {
    PORT: 9876,

    NUM_PLAYERS: 1,
    NUM_ROUNDS: 15,

    PLAYER_INIT_ITEMS: 2,
    PLAYER_INIT_LOCATIONS: 3,
    PLAYER_INIT_COMMUNICATIONS: 3,

    CACHE_INIT_ITEMS: 4,
    CACHE_INIT_LOCATIONS: 5,
    CACHE_INIT_COMMUNICATIONS: 7,

    ACTIONS_PER_TURN: 2,

    MAX_CARDS_IN_CACHE: 5,
    MAX_CARDS_IN_HAND: 10,

    LOCATIONS_NUM: 8,
    LOCATIONS: {
        "Sukrawa University": {
            specialItem: "Encrypted USB Stick",
            specialItemReq: [
                ["Disguise", "Credit Card"]
            ]
        },
        "Central Bus Station": {},
        "Camp Haan Army Base": {
            specialItem: "Sniper Rifle (Gun)",
            specialItemReq: [
                ["Fake I.D.", "Credit Card"]
            ]
        },
        "Loktech Solutions": {
            specialItem: "Loktech Entry Codes",
            specialItemReq: [
                ["Night Vision Goggles", "Rope", "Gun"]
            ]
        },
        "Ironsense Metalworks Factory": {},
        "City Hall": {
            specialItem: "Prime Minister's Schedule",
            specialItemReq: [
                ["Fake I.D.", "Disguise"],
                ["Grappling Hook", "Glass Cutter"]
            ]
        },
        "Sukrawa Trade Center": {},
        "Furuk Power Plant": {
            specialItem: "EMP",
            specialItemReq: [
                ["Fake I.D.", "Disguise"],
                ["Rope", "Gun"]
            ]
        }
    },
    LOCATION_CARDS: [
        "Sukrawa University", "Sukrawa University", "Sukrawa University", "Sukrawa University", "Sukrawa University",
        "Central Bus Station", "Central Bus Station", "Central Bus Station", "Central Bus Station", "Central Bus Station",
        "Camp Haan Army Base", "Camp Haan Army Base", "Camp Haan Army Base", "Camp Haan Army Base", "Camp Haan Army Base",
        "Loktech Solutions", "Loktech Solutions", "Loktech Solutions", "Loktech Solutions", "Loktech Solutions",
        "Ironsense Metalworks Factory", "Ironsense Metalworks Factory", "Ironsense Metalworks Factory", "Ironsense Metalworks Factory", "Ironsense Metalworks Factory",
        "City Hall", "City Hall", "City Hall", "City Hall", "City Hall",
        "Sukrawa Trade Center", "Sukrawa Trade Center", "Sukrawa Trade Center", "Sukrawa Trade Center", "Sukrawa Trade Center",
        "Furuk Power Plant", "Furuk Power Plant", "Furuk Power Plant", "Furuk Power Plant", "Furuk Power Plant",
        //"Free Bus Pass", "Free Bus Pass" TODO
    ],
    ITEM_CARDS: [
        "Pistol (Gun)", "Laptop", "Explosives", "Fake I.D.", "Chloroform", "Rope", "Audio Bugs", "Grappling Hook",
        "Pistol (Gun)", "Laptop", "Explosives", "Fake I.D.", "Chloroform", "Rope", "Audio Bugs", "Grappling Hook",
        "Pistol (Gun)", "Laptop", "Explosives", "Fake I.D.", "Chloroform", "Rope", "Audio Bugs", "Grappling Hook",
        "Glass Cutter", "Disguise", "Credit Card", "Burner Cellphone", "Lockpick", "Night Vision Goggles", "Swiss Army Knife", "Toolbox",
        "Glass Cutter", "Disguise", "Credit Card", "Burner Cellphone", "Lockpick", "Night Vision Goggles", "Swiss Army Knife", "Toolbox",
        "Glass Cutter", "Disguise", "Credit Card", "Burner Cellphone", "Lockpick", "Night Vision Goggles", "Swiss Army Knife", "Toolbox",
        "M16 (Gun)", "AK-47 (Gun)", "Tranquilizer (Gun)", "Tear Gas", "Tear Gas", "Tear Gas"
    ],
    COMMUNICATION_CARDS: [
        "Meet me at / Meet me here", "Meet me at / Meet me here", "Meet me at / Meet me here", "Meet me at / Meet me here",
        "I left you information at", "I left you information at",
        "I have everything I need for my mission", "I have everything I need for my mission",
        "Yes / Okay / I’ll do it / I’ve got it", "Yes / Okay / I’ll do it / I’ve got it",
        "No / I can't do what you want", "No / I can't do what you want",
        "I need", "I need", "I have", "EMP", "Sniper Rifle", "Loktech entry codes", "Encrypted USB stick",
        "Prime Minister's schedule", "Turn four", "Turn five", "Turn six", "Turn seven",
        "Turn eight", "Turn nine", "Turn ten", "Turn eleven", "Turn twelve", "Turn thirteen", "Turn fourteen", "Turn fifteen",
        "Turn eight", "Turn nine", "Turn ten", "Turn eleven", "Turn twelve", "Turn thirteen", "Turn fourteen", "Turn fifteen",
        "Power plant", "Army base", "Loktech", "Bus station", "Ironsense", "City hall", "University", "STC"
    ],
    MISSIONS: [
        {
            title: "Assassinate the prime minister",
            reqSpies: 2,
            reqItems: {"Sniper Rifle":1, "Prime Minister's Schedule":1},
            location: "City Hall"
        },
        {
            title: "Discover the plans for new weapon design",
            reqSpies: 3,
            reqItems: {"Loktech Entry Codes":1},
            location: "Loktech Solutions"
        },
        {
            title: "Steal the new Boltovian weapon prototype",
            reqSpies: 3,
            reqItems: {"Rope":1, "EMP":1},
            location: "Ironsense Metalworks Factory"
        },
        {
            title: "Rescue Agent J from enemy hands",
            reqSpies: 4,
            reqItems: {"Gun":2},
            location: "Ironsense Metalworks Factory"
        },
        {
            title: "Place listening devices in trade institution",
            reqSpies: 3,
            reqItems: {"Audio Bugs":1, "Fake I.D.":1},
            location: "Sukrawa Trade Center"
        },
        {
            title: "Cause mass mayhem in order to mask an attack",
            reqSpies: 3,
            reqItems: {"Tear Gas":1, "Explosives":1},
            location: "Central Bus Station"
        },
        {
            title: "Kidnap scientist Terasha Inklonski",
            reqSpies: 3,
            reqItems: {"Chloroform":1, "Gun":1, "Rope":1},
            location: "Sukrawa University"
        },
        {
            title: "Frame the prime minister",
            reqSpies: 3,
            reqItems: {"Prime Minister's Schedule":1, "Audio Bugs":1},
            location: "City Hall"
        },

    ],
    SPECIALTIES: [1, 2, 3, 4, 5]
}