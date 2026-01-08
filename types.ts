
export interface Coordinate {
    lat: number;
    lon: number;
    ts: number;
}

export interface RideSample {
    ts: number;
    hr: number;
    speed: number;
    watt: number;
    cad: number;
    lat: number;
    lon: number;
}

export interface Ride {
    id: number;
    title: string;
    notes: string;
    distance: number;
    durationSec: number;
    startTime: number;
    endTime: number;
    avgSpeed: number;
    maxSpeed: number;
    avgHr: number;
    samples: RideSample[];
    coords: Coordinate[];
}

export interface CurrentRideState {
    id: number;
    startTs: number;
    distance: number;
    totalPausedMs: number;
    samples: RideSample[];
    coords: Coordinate[];
    paused: boolean;
    pausedAt?: number | null;
    title: string;
    notes: string;
}

export interface Achievements {
    distanceKm: number;
    maxSpeed: number;
    maxWatt: number;
    longestRideMin: number;
    streakDays: number;
    claimed: {
        distance: number[];
        speed: number[];
        watt: number[];
        duration: number[];
        streak: number[];
    };
}

export interface Goal {
    id: number;
    type: 'distance' | 'speed';
    value: number;
    unit: string;
    progress: number;
    completed: boolean;
    createdAt: number;
    targetDate?: number;
}

export type UnitSystem = 'metric' | 'imperial';

export interface SensorsState {
    hr: boolean;
    cadence: boolean;
    watt: boolean;
}

export type ScreenName = "home" | "record" | "stats" | "rides" | "achievements" | "friends" | "goals" | "programs" | "settings" | "menu";
