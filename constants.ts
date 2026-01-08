
export const PRIMARY = "#007BFF";
export const BG_LIGHT = "#FFFFFF";
export const BG_DARK = "#07102a";
export const CARD_LIGHT = "#F8F8F8";
export const CARD_DARK = "#0f1a33";
export const TEXT_LIGHT = "#111";
export const TEXT_DARK = "#fff";

export const STORAGE_KEYS = {
    RIDES: "@cv_rides_v2",
    ACH: "@cv_ach_v2",
    SETTINGS: "@cv_settings_v2",
    GOALS: "@cv_goals_v2",
};

export const defaultAchievements = {
    distanceKm: 0,
    maxSpeed: 0,
    maxWatt: 0,
    longestRideMin: 0,
    streakDays: 0,
    claimed: { distance: [], speed: [], watt: [], duration: [], streak: [] },
};

export const ACH_LEVELS_DISTANCE = [
    { name: "Basis", min: 0, max: 10, color: "#8b5a2b", emoji: "🌱" },
    { name: "Brons", min: 10, max: 100, color: "#b87333", emoji: "🥉" },
    { name: "Zilver", min: 100, max: 250, color: "#c0c0c0", emoji: "🥈" },
    { name: "Goud", min: 250, max: 500, color: "#ffd700", emoji: "🥇" },
    { name: "Diamant", min: 500, max: Infinity, color: "#00bcd4", emoji: "💎" },
];

export const ACH_LEVELS_SPEED = [
    { name: "Basis", min: 0, max: 20, color: "#8b5a2b", emoji: "🐢" },
    { name: "Brons", min: 20, max: 30, color: "#b87333", emoji: "🥉" },
    { name: "Zilver", min: 30, max: 40, color: "#c0c0c0", emoji: "🥈" },
    { name: "Goud", min: 40, max: 50, color: "#ffd700", emoji: "🥇" },
    { name: "Diamant", min: 50, max: Infinity, color: "#00bcd4", emoji: "🚀" },
];

export const ACH_LEVELS_WATT = [
    { name: "Beginner", min: 0, max: 150, color: "#8b5a2b", emoji: "💡" },
    { name: "Getraind", min: 150, max: 300, color: "#b87333", emoji: "⚡" },
    { name: "Atleet", min: 300, max: 500, color: "#c0c0c0", emoji: "🔋" },
    { name: "Pro", min: 500, max: 800, color: "#ffd700", emoji: "🔥" },
    { name: "Beest", min: 800, max: Infinity, color: "#ef4444", emoji: "👹" },
];

export const ACH_LEVELS_DURATION = [
    { name: "Ommetje", min: 0, max: 30, color: "#8b5a2b", emoji: "🕒" },
    { name: "Toertocht", min: 30, max: 60, color: "#b87333", emoji: "🚴" },
    { name: "Doorzetter", min: 60, max: 120, color: "#c0c0c0", emoji: "🦾" },
    { name: "Wielrenner", min: 120, max: 240, color: "#ffd700", emoji: "👑" },
    { name: "Legende", min: 240, max: Infinity, color: "#a855f7", emoji: "🌌" },
];

export const FRIENDS_DATA_FULL = [
    { name: "Marleen", totalDistance: 345.2, lastRide: { distance: 12.4, date: "Gisteren", avgSpeed: 25.1, notes: "Goeie rit, wel veel wind gehad aan het kanaal. Zal Billie leuk vinden:)" } },
    { name: "Jort", totalDistance: 890.7, lastRide: { distance: 35.1, date: "Woensdag", avgSpeed: 31.8, notes: "Intervaltraining gedaan. Drie sprints op 45 km/u. Nu wel moe pfff" } },
    { name: "Gerald", totalDistance: 120.5, lastRide: { distance: 8.9, date: "Vandaag", avgSpeed: 21.5, notes: "Rustige ochtendrit ter herstel. Lekker kort gehouden. Vanavond weer naar de Euroborg." } },
    // Fix: Michael was used as a variable name instead of a string literal
    { name: "Michael", totalDistance: 512.9, lastRide: { distance: 22.0, date: "Vandaag", avgSpeed: 28.5, notes: "Toetsen nagekeken op de fiets, was geen goede combinatie!" } },
    { name: "Stieneke", totalDistance: 78.1, lastRide: { distance: 5.5, date: "Eergisteren", avgSpeed: 19.0, notes: "Fiets was lek na 5 km, helaas! Meteen gestopt." } },
];

export const TRAINING_PROGRAMS = [
    { id: 1, name: "50km Duurtraining", duration: "4 Weken", focus: "Basisconditie", details: ["Week 1: 3x 2 uur op lage intensiteit.", "Week 3: Langste rit van 45km.", "Evaluatie na afloop."] },
    { id: 2, name: "Snelheid & Sprint", duration: "6 Weken", focus: "Max. Snelheid", details: ["Week 2: 5x 30s max sprint training.", "Week 4: Heuvelsprinten integreren.", "Hersteltijd is essentieel!"] },
    { id: 3, name: "Gewichtsbeheersing", duration: "12 Weken", focus: "Calorieverbranding", details: ["Focus op HR Zone 2-3 (vetverbranding).", "Minimum van 4 ritten per week.", "Korte, intensieve sessies op rustdagen."] },
];