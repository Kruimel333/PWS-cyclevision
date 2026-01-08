
import React, { useEffect, useRef, useState, useCallback, memo, useMemo } from "react";
import { 
    PRIMARY, 
    BG_DARK, BG_LIGHT, 
    CARD_DARK, CARD_LIGHT, 
    TEXT_DARK, TEXT_LIGHT, 
    STORAGE_KEYS, 
    defaultAchievements, 
    ACH_LEVELS_DISTANCE, 
    ACH_LEVELS_SPEED,
    ACH_LEVELS_WATT,
    ACH_LEVELS_DURATION,
    FRIENDS_DATA_FULL,
    TRAINING_PROGRAMS
} from "./constants.ts";
import { ScreenName, Ride, Achievements, Goal, CurrentRideState, Coordinate, RideSample, UnitSystem, SensorsState } from "./types.ts";
import { formatDuration, generateSampleData, clamp } from "./utils.ts";

// --- Branding Components (Based on user images) ---

const CycleVisionLogo = ({ size = 120, theme = "light", showText = true }: { size?: number, theme?: string, showText?: boolean }) => {
    const isDark = theme === "dark";
    const color = isDark ? "#FFFFFF" : "#000000";

    return (
        <div className="flex flex-col items-center justify-center">
            <svg width={size} height={size * 0.6} viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 35C10 30 15 25 30 25H170C185 25 190 30 190 35V45C190 65 175 80 155 80H140C125 80 115 70 110 60C105 50 95 50 90 60C85 70 75 80 60 80H45C25 80 10 65 10 45V35Z" stroke={color} strokeWidth="4" fill="none" />
                <g opacity="0.9">
                    <circle cx="45" cy="62" r="8" stroke={color} strokeWidth="2" />
                    <circle cx="75" cy="62" r="8" stroke={color} strokeWidth="2" />
                    <path d="M60 62L55 50L65 42L70 50L60 62Z" fill={color} />
                    <circle cx="68" cy="38" r="3" fill={color} />
                </g>
                <g opacity="0.9">
                    <path d="M135 45C132 42 128 42 125 45C122 48 122 52 125 55L135 65L145 55C148 52 148 48 145 45C142 42 138 42 135 45Z" fill={color} />
                    <path d="M158 40L150 55H160L152 70" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="178" cy="50" r="7" stroke={color} strokeWidth="2" />
                    <path d="M178 50V46M178 50L181 50" stroke={color} strokeWidth="2" strokeLinecap="round" />
                </g>
            </svg>
            {showText && (
                <span className="text-2xl font-black tracking-[0.2em] mt-2 uppercase italic" style={{ color: color, fontFamily: 'sans-serif' }}>
                    CYCLEVISION
                </span>
            )}
        </div>
    );
};

// --- Memoized UI Components ---

const TinyCard = memo(({ title, value, unit, theme, disabled = false }: { title: string; value: string; unit: string; theme: string; disabled?: boolean }) => {
    const isDark = theme === "dark";
    const cardColor = isDark ? CARD_DARK : CARD_LIGHT;
    const textColor = isDark ? TEXT_DARK : TEXT_LIGHT;
    const subColor = isDark ? "#9bb5ff" : "#6b7ea6";

    return (
        <div className={`p-3 rounded-2xl flex flex-col justify-between h-24 shadow-sm transition-all duration-300 ${disabled ? 'opacity-20 grayscale' : ''}`} style={{ backgroundColor: cardColor }}>
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70" style={{ color: subColor }}>{title}</span>
            <span className="text-2xl font-black" style={{ color: textColor }}>{disabled ? "--" : value}</span>
            <span className="text-[10px] font-bold" style={{ color: subColor }}>{disabled ? "Geen Sensor" : unit}</span>
        </div>
    );
});

const MapPreview = memo(({ coords = [], height = 180, theme }: { coords?: Coordinate[]; height?: number; theme: string }) => {
    const isDark = theme === "dark";
    const containerRef = useRef<HTMLDivElement>(null);
    const [w, setW] = useState(300);

    useEffect(() => {
        if (containerRef.current) setW(containerRef.current.offsetWidth);
    }, []);

    if (!coords.length) {
        return (
            <div 
                className="w-full rounded-2xl flex items-center justify-center border-2 border-dashed transition-colors duration-300" 
                style={{ height, backgroundColor: isDark ? "#0a1a2a" : "#f1f5f9", borderColor: isDark ? "#1e293b" : "#e2e8f0" }}
            >
                <span className="text-sm font-medium" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>Route wordt opgebouwd...</span>
            </div>
        );
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    coords.forEach(c => {
        if (c.lon < minX) minX = c.lon;
        if (c.lon > maxX) maxX = c.lon;
        if (c.lat < minY) minY = c.lat;
        if (c.lat > maxY) maxY = c.lat;
    });

    if (minX === maxX) { minX -= 0.0001; maxX += 0.0001; }
    if (minY === maxY) { minY -= 0.0001; maxY += 0.0001; }

    const pad = 20;
    const scaleX = (w - pad * 2) / (maxX - minX);
    const scaleY = (height - pad * 2) / (maxY - minY);
    const scale = Math.min(scaleX, scaleY);

    const points = coords.map((c) => {
        const x = (c.lon - minX) * scale + (w - (maxX - minX) * scale) / 2;
        const y = height - ((c.lat - minY) * scale + (height - (maxY - minY) * scale) / 2);
        return `${x},${y}`;
    }).join(" ");

    const ptsArr = points.split(" ");
    const startPt = ptsArr[0]?.split(",") || [0, 0];
    const endPt = ptsArr[ptsArr.length - 1]?.split(",") || [0, 0];

    return (
        <div ref={containerRef} className="w-full rounded-2xl overflow-hidden shadow-inner transition-colors duration-300" style={{ height, backgroundColor: isDark ? "#040c1d" : "#f8fafc" }}>
            <svg width="100%" height={height}>
                <polyline points={points} fill="none" stroke={PRIMARY} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={startPt[0]} cy={startPt[1]} r="6" fill="#ef4444" stroke="white" strokeWidth="2" />
                <circle cx={endPt[0]} cy={endPt[1]} r="6" fill="#22c55e" stroke="white" strokeWidth="2" />
            </svg>
        </div>
    );
});

const RideGraph = memo(({ data, valueKey, label, color, theme, unitSystem }: { data: RideSample[]; valueKey: keyof RideSample; label: string; color: string; theme: string; unitSystem: UnitSystem }) => {
    const isDark = theme === "dark";
    const height = 150;
    const paddingLeft = 40;
    const paddingBottom = 30;
    const values = data.map(d => Number(d[valueKey]));
    const axisColor = isDark ? '#1e293b' : '#e2e8f0';
    const textColor = isDark ? '#64748b' : '#94a3b8';

    const containerRef = useRef<HTMLDivElement>(null);
    const [w, setW] = useState(300);

    useEffect(() => {
        if (containerRef.current) setW(containerRef.current.offsetWidth);
    }, []);

    if (values.length < 2) {
        return (
            <div className="w-full flex items-center justify-center p-4 italic text-sm transition-colors duration-300" style={{ height, color: textColor, backgroundColor: isDark ? CARD_DARK : CARD_LIGHT, borderRadius: '1rem' }}>
                Wacht op meer data...
            </div>
        );
    }

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = Math.max(1, maxVal - minVal);
    
    const innerW = w - paddingLeft - 20;
    const pad = 10;
    const points = values.map((val, index) => {
        const x = (index / (values.length - 1)) * (innerW - 2 * pad) + pad + paddingLeft;
        const y = height - paddingBottom - ((val - minVal) / range) * (height - 2 * pad - paddingBottom);
        return `${x},${y}`;
    }).join(" ");

    let unit = "";
    if (valueKey === 'hr') unit = 'bpm';
    else if (valueKey === 'speed') unit = unitSystem === 'metric' ? 'km/u' : 'mph';
    else if (valueKey === 'watt') unit = 'W';
    else unit = 'rpm';

    const displayMax = valueKey === 'speed' && unitSystem === 'imperial' ? maxVal * 0.621371 : maxVal;

    return (
        <div ref={containerRef} className="w-full mt-4 p-4 rounded-2xl transition-colors duration-300" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black uppercase tracking-widest" style={{ color: color }}>{label}</span>
                <span className="text-xs font-bold" style={{ color: textColor }}>{displayMax.toFixed(1)} {unit} max</span>
            </div>
            <div className="relative" style={{ height: height }}>
                <svg width="100%" height={height}>
                    {[0, 0.5, 1].map((p, i) => {
                        const y = height - paddingBottom - p * (height - 2 * pad - paddingBottom);
                        return (
                            <React.Fragment key={i}>
                                <line x1={paddingLeft} y1={y} x2={w} y2={y} stroke={axisColor} strokeWidth="1" />
                                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill={textColor} fontSize="10" fontWeight="bold">
                                    {Math.round(minVal + p * range)}
                                </text>
                            </React.Fragment>
                        );
                    })}
                    <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
});

const Header = memo(({ theme, toggleTheme, onOpenMenu }: { theme: string; toggleTheme: () => void; onOpenMenu: () => void }) => {
    const isDark = theme === "dark";
    return (
        <header className="sticky top-0 z-40 flex items-center justify-between h-20 px-6 backdrop-blur-md transition-all duration-300 shadow-sm border-b" 
                style={{ 
                    backgroundColor: isDark ? 'rgba(7, 16, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)', 
                    borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
                    paddingTop: 'env(safe-area-inset-top)'
                }}>
            <button onClick={onOpenMenu} className="p-2 text-2xl hover:scale-110 transition-transform" style={{ color: PRIMARY }}>☰</button>
            <div className="flex items-center gap-3">
                <CycleVisionLogo size={45} theme={theme} showText={false} />
                <div className="flex flex-col items-start leading-none">
                    <h1 className="text-lg font-black tracking-tighter uppercase italic" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>CycleVision</h1>
                    <div className="h-[2px] w-full rounded-full bg-blue-600 mt-1"></div>
                </div>
            </div>
            <button onClick={toggleTheme} className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-xl">
                {isDark ? "☀️" : "🌙"}
            </button>
        </header>
    );
});

// --- Modals ---

const CreateGoalModal = ({ isDark, onSave, onCancel, unitSystem }: { isDark: boolean, onSave: (goal: Partial<Goal>) => void, onCancel: () => void, unitSystem: UnitSystem }) => {
    const [type, setType] = useState<'distance' | 'speed'>('distance');
    const [value, setValue] = useState('');
    const [date, setDate] = useState('');

    const unit = type === 'distance' ? (unitSystem === 'metric' ? 'km' : 'mi') : (unitSystem === 'metric' ? 'km/u' : 'mph');

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md"></div>
            <div className="relative w-full max-w-sm p-8 rounded-[2rem] shadow-2xl transition-colors" style={{ backgroundColor: isDark ? "#0f1a33" : "white" }}>
                <h2 className="text-2xl font-black mb-6 text-blue-600 italic tracking-tighter uppercase">Nieuw Doel</h2>
                <div className="space-y-5">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                        <button onClick={() => setType('distance')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${type === 'distance' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>AFSTAND</button>
                        <button onClick={() => setType('speed')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${type === 'speed' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>SNELHEID</button>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Doelwaarde ({unit})</label>
                        <input type="number" className="w-full p-4 rounded-xl border-2 dark:bg-[#07102a] dark:border-gray-800 dark:text-white focus:border-blue-500 outline-none font-bold" value={value} onChange={e => setValue(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Deadline (optioneel)</label>
                        <input type="date" className="w-full p-4 rounded-xl border-2 dark:bg-[#07102a] dark:border-gray-800 dark:text-white focus:border-blue-500 outline-none font-bold" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                </div>
                <button onClick={() => onSave({ type, value: parseFloat(value), targetDate: date ? new Date(date).getTime() : undefined })} className="w-full mt-8 p-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-transform uppercase tracking-widest">DOEL OPSLAAN</button>
                <button onClick={onCancel} className="w-full mt-3 p-3 text-gray-400 font-bold text-sm uppercase tracking-widest">Annuleren</button>
            </div>
        </div>
    );
};

const SaveRideModal = memo(({ isDark, onSave, onCancel }: { isDark: boolean; onSave: (title: string, notes: string) => void; onCancel: () => void }) => {
    const [localTitle, setLocalTitle] = useState(`Rit van ${new Date().toLocaleDateString()}`);
    const [localNotes, setLocalNotes] = useState('');

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-lg"></div>
            <div className="relative w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl transition-colors" style={{ backgroundColor: isDark ? "#0f1a33" : "white" }}>
                <div className="mb-6 flex justify-center">
                    <CycleVisionLogo size={80} theme={isDark ? "dark" : "light"} showText={false} />
                </div>
                <h2 className="text-3xl font-black mb-8 text-blue-600 text-center tracking-tighter italic">RIT VOLTOOID!</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Naam van de rit</label>
                        <input 
                            className="w-full p-5 rounded-2xl border-2 transition-all dark:bg-[#07102a] dark:border-gray-800 dark:text-white focus:border-blue-500 outline-none font-bold" 
                            value={localTitle} 
                            onChange={(e) => setLocalTitle(e.target.value)} 
                            placeholder="Mijn ochtendrit"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Notities</label>
                        <textarea 
                            className="w-full p-5 rounded-2xl border-2 transition-all dark:bg-[#07102a] dark:border-gray-800 dark:text-white h-32 focus:border-blue-500 outline-none font-medium" 
                            value={localNotes} 
                            onChange={(e) => setLocalNotes(e.target.value)}
                            placeholder="Hoe was de wind?"
                        />
                    </div>
                </div>
                <button onClick={() => onSave(localTitle, localNotes)} className="w-full mt-8 p-5 bg-blue-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-blue-500/20 active:scale-95 transition-transform uppercase tracking-widest">OPSLAAN</button>
                <button onClick={onCancel} className="w-full mt-4 p-4 text-red-500 font-bold opacity-60 hover:opacity-100 transition-opacity">RIT VERWIJDEREN</button>
            </div>
        </div>
    );
});

// --- Main App Component ---

export default function App() {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [screen, setScreen] = useState<ScreenName>("home");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
    const [activeSensors, setActiveSensors] = useState<SensorsState>({ hr: true, cadence: true, watt: true });
    
    const [liveMetrics, setLiveMetrics] = useState({ hr: 0, speed: 0, watt: 0, cadence: 0 });
    const [simRunning, setSimRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recording, setRecording] = useState(false);
    const [recordSeconds, setRecordSeconds] = useState(0);
    const [rides, setRides] = useState<Ride[]>([]);
    const [ach, setAch] = useState<Achievements>(defaultAchievements);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [activeProgramId, setActiveProgramId] = useState<number | null>(null);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    
    const [currentRide, setCurrentRide] = useState<CurrentRideState | null>(null);
    const [coords, setCoords] = useState<Coordinate[]>([]);
    
    const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
    const [selectedRideForStats, setSelectedRideForStats] = useState<Ride | null>(null);

    const simRef = useRef<any>(null);
    const timerRef = useRef<any>(null);
    const prevCoordRef = useRef({ lat: 52.3676, lon: 4.9041 });
    const prevMetricsRef = useRef({ hr: 85, speed: 18.2, watt: 180, cadence: 75 });
    const currentRideRef = useRef<CurrentRideState | null>(null);
    const isPausedRef = useRef<boolean>(false);

    useEffect(() => { currentRideRef.current = currentRide; }, [currentRide]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    useEffect(() => {
        const savedRides = localStorage.getItem(STORAGE_KEYS.RIDES);
        const savedAch = localStorage.getItem(STORAGE_KEYS.ACH);
        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const savedGoals = localStorage.getItem(STORAGE_KEYS.GOALS);
        const savedActiveProgram = localStorage.getItem("@cv_active_program");

        if (savedRides) setRides(JSON.parse(savedRides));
        if (savedAch) setAch(JSON.parse(savedAch));
        if (savedGoals) setGoals(JSON.parse(savedGoals));
        if (savedActiveProgram) setActiveProgramId(JSON.parse(savedActiveProgram));
        
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.theme) setTheme(settings.theme);
            if (settings.unitSystem) setUnitSystem(settings.unitSystem);
            if (settings.activeSensors) setActiveSensors(settings.activeSensors);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme("dark");
        }
    }, []);

    useEffect(() => { localStorage.setItem(STORAGE_KEYS.RIDES, JSON.stringify(rides)); }, [rides]);
    useEffect(() => { localStorage.setItem(STORAGE_KEYS.ACH, JSON.stringify(ach)); }, [ach]);
    useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ theme, unitSystem, activeSensors })); }, [theme, unitSystem, activeSensors]);
    useEffect(() => { localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals)); }, [goals]);
    useEffect(() => { localStorage.setItem("@cv_active_program", JSON.stringify(activeProgramId)); }, [activeProgramId]);

    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = BG_DARK;
        } else {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = BG_LIGHT;
        }
    }, [theme]);

    const toggleTheme = useCallback(() => setTheme(prev => prev === "dark" ? "light" : "dark"), []);

    const convertDist = useCallback((km: number) => {
        return unitSystem === "metric" ? km : km * 0.621371;
    }, [unitSystem]);

    const distUnit = unitSystem === "metric" ? "km" : "mi";
    const speedUnit = unitSystem === "metric" ? "km/u" : "mph";

    const generateSample = useCallback(() => {
        const deltaSec = 3;
        const lat = prevCoordRef.current.lat + (Math.random() - 0.5) * 0.0002;
        const lon = prevCoordRef.current.lon + (Math.random() - 0.5) * 0.0002;
        prevCoordRef.current = { lat, lon };

        const newHr = activeSensors.hr ? generateSampleData(prevMetricsRef.current.hr, 1, 4, 60, 190) : 0;
        const newSpeed = generateSampleData(prevMetricsRef.current.speed, 0.8, 3.0, 5, 55);
        const newWatt = activeSensors.watt ? generateSampleData(prevMetricsRef.current.watt, 10, 50, 50, 1000) : 0;
        const newCad = activeSensors.cadence ? generateSampleData(prevMetricsRef.current.cadence, 2, 8, 40, 120) : 0;
        
        const metrics = { hr: newHr, speed: newSpeed, watt: newWatt, cadence: newCad };
        setLiveMetrics(metrics);
        prevMetricsRef.current = metrics;

        const ts = Date.now();
        const coord: Coordinate = { lat, lon, ts };
        setCoords(c => [coord, ...c].slice(0, 1000));

        if (recording && !isPausedRef.current && currentRideRef.current) {
            const distAdd = (newSpeed * deltaSec) / 3600;
            const sample: RideSample = { ts, ...metrics, cad: newCad, lat, lon };

            setCurrentRide(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    distance: Math.round((prev.distance + distAdd) * 1000) / 1000,
                    samples: [sample, ...prev.samples].slice(0, 5000),
                    coords: [coord, ...prev.coords].slice(0, 5000)
                };
            });
        }
    }, [recording, activeSensors]);

    useEffect(() => {
        if (simRunning) {
            generateSample();
            simRef.current = setInterval(generateSample, 3000);
        } else {
            clearInterval(simRef.current);
        }
        return () => clearInterval(simRef.current);
    }, [simRunning, generateSample]);

    useEffect(() => {
        if (recording && !isPaused) {
            timerRef.current = setInterval(() => {
                if (currentRideRef.current) {
                    const elapsed = Date.now() - currentRideRef.current.startTs - currentRideRef.current.totalPausedMs;
                    setRecordSeconds(Math.floor(elapsed / 1000));
                }
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [recording, isPaused]);

    const navigate = useCallback((s: ScreenName, payload?: any) => {
        if (s === "stats" && payload) {
            const r = rides.find(rit => rit.id === payload);
            if (r) setSelectedRideForStats(r);
        } else if (s === "stats" && !payload) {
            if (rides.length > 0) setSelectedRideForStats(rides[0]);
        }
        setScreen(s);
        setIsMenuOpen(false);
    }, [rides]);

    const prepareRecording = useCallback(() => {
        setRecording(false);
        setIsPaused(false);
        setSimRunning(false);
        setRecordSeconds(0);
        setCoords([]);
        setLiveMetrics({ hr: 0, speed: 0, watt: 0, cadence: 0 });
        setCurrentRide(null);
        setScreen("record");
        setIsMenuOpen(false);
    }, []);

    const commenceRecording = useCallback(() => {
        const now = Date.now();
        setRecording(true);
        setIsPaused(false);
        setSimRunning(true);
        prevMetricsRef.current = { hr: 85, speed: 18.2, watt: 180, cadence: 75 };
        setCurrentRide({
            id: now,
            startTs: now,
            distance: 0,
            totalPausedMs: 0,
            samples: [],
            coords: [],
            paused: false,
            title: '',
            notes: ''
        });
    }, []);

    const togglePause = useCallback(() => {
        if (isPausedRef.current) {
            const pauseDur = Date.now() - (currentRideRef.current?.pausedAt || Date.now());
            setCurrentRide(prev => prev ? ({ ...prev, totalPausedMs: prev.totalPausedMs + pauseDur, pausedAt: null }) : null);
            setIsPaused(false);
            setSimRunning(true);
        } else {
            setCurrentRide(prev => prev ? ({ ...prev, pausedAt: Date.now() }) : null);
            setIsPaused(true);
            setSimRunning(false);
        }
    }, []);

    const stopRecording = useCallback(() => {
        setSimRunning(false);
        setIsSaveModalVisible(true);
    }, []);

    const confirmSave = useCallback((title: string, notes: string) => {
        if (!currentRideRef.current) return;
        const now = Date.now();
        const cr = currentRideRef.current;
        const samples = [...cr.samples].reverse();
        const duration = recordSeconds;
        const distance = cr.distance;
        
        const avgSpeed = duration > 0 ? (distance / (duration / 3600)) : 0;
        const maxSpeed = samples.length > 0 ? Math.max(...samples.map(s => s.speed)) : 0;
        const avgHr = samples.length > 0 ? Math.round(samples.reduce((a, b) => a + b.hr, 0) / samples.length) : 0;
        const maxWatt = samples.length > 0 ? Math.max(...samples.map(s => s.watt)) : 0;

        const newRide: Ride = {
            id: cr.id,
            title: title || `Rit van ${new Date(cr.startTs).toLocaleDateString()}`,
            notes: notes,
            distance,
            durationSec: duration,
            startTime: cr.startTs,
            endTime: now,
            avgSpeed,
            maxSpeed,
            avgHr,
            samples,
            coords: [...cr.coords].reverse()
        };

        setRides(prev => [newRide, ...prev]);
        setAch(prev => ({
            ...prev,
            distanceKm: (prev.distanceKm || 0) + distance,
            maxSpeed: Math.max(prev.maxSpeed || 0, maxSpeed),
            maxWatt: Math.max(prev.maxWatt || 0, maxWatt),
            longestRideMin: Math.max(prev.longestRideMin || 0, duration / 60)
        }));

        // Update Goal Progress
        setGoals(prev => prev.map(goal => {
            if (goal.completed) return goal;
            let newProgress = goal.progress;
            if (goal.type === 'distance') {
                newProgress += convertDist(distance);
            } else if (goal.type === 'speed') {
                newProgress = Math.max(newProgress, convertDist(maxSpeed));
            }
            const isCompleted = newProgress >= goal.value;
            return { ...goal, progress: newProgress, completed: isCompleted };
        }));

        setRecording(false);
        setIsPaused(false);
        setIsSaveModalVisible(false);
        setCurrentRide(null);
        setSelectedRideForStats(newRide);
        setScreen("stats");
    }, [recordSeconds, convertDist]);

    const handleCreateGoal = (data: Partial<Goal>) => {
        const newGoal: Goal = {
            id: Date.now(),
            type: data.type || 'distance',
            value: data.value || 0,
            unit: data.type === 'distance' ? distUnit : speedUnit,
            progress: 0,
            completed: false,
            createdAt: Date.now(),
            targetDate: data.targetDate
        };
        setGoals(prev => [newGoal, ...prev]);
        setIsGoalModalOpen(false);
    };

    const handleClaimAchievement = (type: string, levelIndex: number) => {
        setAch(prev => {
            const currentClaimed = prev.claimed[type as keyof typeof prev.claimed] || [];
            if (!currentClaimed.includes(levelIndex)) {
                return {
                    ...prev,
                    claimed: {
                        ...prev.claimed,
                        [type]: [...currentClaimed, levelIndex]
                    }
                };
            }
            return prev;
        });
    };

    const cancelRecording = useCallback(() => {
        setRecording(false);
        setIsPaused(false);
        setIsSaveModalVisible(false);
        setCurrentRide(null);
        setSimRunning(false);
        setScreen("home");
    }, []);

    const wipeData = useCallback(() => {
        if (confirm("Weet je zeker dat je alle data wilt wissen?")) {
            setRides([]);
            setAch(defaultAchievements);
            setGoals([]);
            setActiveProgramId(null);
            localStorage.clear();
            setScreen("home");
            setIsMenuOpen(false);
        }
    }, []);

    const getProgress = (value: number, levels: any[]) => {
        let levelIndex = 0;
        for (let i = 0; i < levels.length; i++) {
            if (value >= levels[i].min) levelIndex = i;
            else break;
        }
        const lvl = levels[levelIndex];
        const next = levels[Math.min(levelIndex + 1, levels.length - 1)];
        const range = Math.max(1, next.min - lvl.min);
        const inRange = clamp(value - lvl.min, 0, range);
        const pct = Math.round((inRange / range) * 100);
        return { levelIndex, lvl, next, pct };
    };

    const isDark = theme === "dark";
    const activeProgram = TRAINING_PROGRAMS.find(p => p.id === activeProgramId);

    const statsTotals = useMemo(() => {
        const totalDist = rides.reduce((acc, r) => acc + r.distance, 0);
        const totalTimeSec = rides.reduce((acc, r) => acc + r.durationSec, 0);
        const maxSpeed = rides.length > 0 ? Math.max(...rides.map(r => r.maxSpeed)) : 0;
        const maxWatt = ach.maxWatt || 0;
        const totalRides = rides.length;
        return { totalDist, totalTimeSec, maxSpeed, maxWatt, totalRides };
    }, [rides, ach]);

    return (
        <div className="min-h-screen transition-all duration-500 ease-in-out pb-[env(safe-area-inset-bottom)]" style={{ backgroundColor: isDark ? BG_DARK : BG_LIGHT }}>
            <Header theme={theme} toggleTheme={toggleTheme} onOpenMenu={() => setIsMenuOpen(true)} />
            
            <main className="flex-1 max-w-2xl mx-auto w-full relative">
                {screen === "home" && (
                    <div className="p-6">
                        {/* Background Logo Watermark */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.05] pointer-events-none -z-10">
                            <CycleVisionLogo size={320} theme={theme} showText={true} />
                        </div>

                        {recording && !isPaused && (
                            <div className="p-6 rounded-3xl mb-8 border-l-8 border-yellow-400 text-white shadow-2xl animate-pulse cursor-pointer" style={{ backgroundColor: PRIMARY }} onClick={() => setScreen("record")}>
                                <span className="text-xs font-black tracking-widest uppercase opacity-80">RIT BEZIG</span>
                                <div className="flex justify-between items-end mt-2">
                                    <div className="text-4xl font-black tabular-nums">{formatDuration(recordSeconds)}</div>
                                    <div className="text-xl font-bold opacity-90">{convertDist(currentRide?.distance || 0).toFixed(1)} {distUnit}</div>
                                </div>
                            </div>
                        )}

                        {activeProgram && (
                            <div className="p-6 rounded-3xl mb-8 border border-blue-600/30 bg-blue-600/5 backdrop-blur-sm cursor-pointer" onClick={() => navigate("programs")}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Actief Programma</span>
                                        <h3 className="text-xl font-black mt-1" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>{activeProgram.name}</h3>
                                        <p className="text-xs font-bold text-gray-400 mt-1">{activeProgram.duration} • {activeProgram.focus}</p>
                                    </div>
                                    <div className="p-2 bg-blue-600/10 rounded-xl text-blue-500 animate-pulse">⚡</div>
                                </div>
                            </div>
                        )}

                        <div className="mb-8">
                            <h2 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-3">Laatste Activiteit</h2>
                            {rides[0] ? (
                                <div className="p-6 rounded-3xl shadow-lg border border-transparent hover:border-blue-500/50 transition-all cursor-pointer" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }} onClick={() => navigate("stats", rides[0].id)}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-xl font-black" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>{rides[0].title}</div>
                                            <div className="text-xs font-bold text-gray-400 mt-1 uppercase">
                                                {new Date(rides[0].startTime).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>
                                        <div className="bg-blue-600/10 p-2 rounded-xl text-blue-500">🚴</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-6">
                                        <div className="text-center"><div className="text-lg font-black" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>{convertDist(rides[0].distance).toFixed(1)}</div><div className="text-[9px] font-black text-gray-400 uppercase">{distUnit}</div></div>
                                        <div className="text-center border-x border-gray-200 dark:border-gray-800"><div className="text-lg font-black" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>{convertDist(rides[0].avgSpeed).toFixed(0)}</div><div className="text-[9px] font-black text-gray-400 uppercase">gem {speedUnit}</div></div>
                                        <div className="text-center"><div className="text-lg font-black" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>{formatDuration(rides[0].durationSec).split(':').slice(1).join(':')}</div><div className="text-[9px] font-black text-gray-400 uppercase">tijd</div></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center text-gray-400 font-bold italic">Geen ritten gevonden.<br/>Tijd om te trappen!</div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-5 rounded-3xl shadow-sm flex flex-col items-center justify-center transition-colors" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                                <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Totaal Afstand</span>
                                <span className="text-2xl font-black text-blue-600">{convertDist(ach.distanceKm).toFixed(0)} {distUnit}</span>
                            </div>
                            <div className="p-5 rounded-3xl shadow-sm flex flex-col items-center justify-center transition-colors" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                                <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Max Snelheid</span>
                                <span className="text-2xl font-black text-blue-600">{convertDist(ach.maxSpeed).toFixed(0)} {speedUnit}</span>
                            </div>
                        </div>
                        <button onClick={prepareRecording} className="w-full p-6 bg-blue-600 text-white text-xl font-black rounded-3xl shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-tighter italic">START NIEUWE RIT ⚡</button>
                    </div>
                )}

                {screen === "record" && (
                    <div className="p-6 flex flex-col gap-6">
                        <div className="p-8 rounded-[2rem] text-center text-white shadow-2xl relative overflow-hidden transition-all duration-500" style={{ backgroundColor: recording ? PRIMARY : (isDark ? '#1e293b' : '#e2e8f0'), color: recording ? 'white' : (isDark ? '#64748b' : '#94a3b8') }}>
                            {recording && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>}
                            <span className="text-xs font-black opacity-70 uppercase tracking-[0.3em]">TIJD</span>
                            <div className="text-7xl font-black my-2 tabular-nums tracking-tighter">{formatDuration(recordSeconds)}</div>
                            {!recording && <span className="text-[10px] font-bold uppercase tracking-widest italic animate-bounce block mt-2">Druk op start om de rit te beginnen</span>}
                        </div>
                        <div className="p-8 rounded-[2rem] shadow-lg flex flex-col items-center transition-colors" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">AFSTAND</span>
                            <div className="text-6xl font-black mt-2 transition-all duration-300" style={{ color: recording ? PRIMARY : (isDark ? '#334155' : '#cbd5e1') }}>
                                {convertDist(currentRide?.distance || 0).toFixed(2)} <span className="text-2xl font-bold opacity-50">{distUnit}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <TinyCard title="Hartslag" value={`${liveMetrics.hr.toFixed(0)}`} unit="bpm" theme={theme} disabled={!activeSensors.hr} />
                            <TinyCard title="Snelheid" value={`${convertDist(liveMetrics.speed).toFixed(1)}`} unit={speedUnit} theme={theme} />
                            <TinyCard title="Watt" value={`${liveMetrics.watt.toFixed(0)}`} unit="W" theme={theme} disabled={!activeSensors.watt} />
                            <TinyCard title="Cadans" value={`${liveMetrics.cadence.toFixed(0)}`} unit="rpm" theme={theme} disabled={!activeSensors.cadence} />
                        </div>
                        <div className="flex flex-col gap-3 mt-4">
                            {!recording ? (
                                <button onClick={commenceRecording} className="p-6 bg-green-500 text-white text-2xl font-black rounded-[1.5rem] shadow-xl shadow-green-500/30 active:scale-95 transition-all animate-pulse hover:animate-none">GO! START RIT 🏁</button>
                            ) : (
                                <>
                                    {isPaused ? (
                                        <button onClick={togglePause} className="p-5 bg-green-500 text-white text-xl font-black rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-transform">HERVATTEN</button>
                                    ) : (
                                        <button onClick={togglePause} className="p-5 bg-blue-600 text-white text-xl font-black rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-transform">PAUZE</button>
                                    )}
                                    <button onClick={stopRecording} className="p-5 border-2 border-red-500/30 text-red-500 text-lg font-black rounded-2xl active:scale-95 transition-transform hover:bg-red-500/5">STOP & OPSLAAN</button>
                                </>
                            )}
                            {!recording && <button onClick={() => setScreen("home")} className="p-4 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors uppercase tracking-widest">Annuleren</button>}
                        </div>
                        <div className="mt-8 mb-10 opacity-70">
                            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4 text-center">LIVE ROUTE</h3>
                            <MapPreview coords={coords} theme={theme} height={220} />
                        </div>
                    </div>
                )}

                {screen === "stats" && selectedRideForStats && (
                    <div className="p-6">
                        <div className="p-8 rounded-[2rem] border-b-8 mb-8 shadow-xl transition-colors" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT, borderBottomColor: PRIMARY }}>
                            <h2 className="text-3xl font-black tracking-tighter italic" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>{selectedRideForStats.title}</h2>
                            <span className="text-gray-400 font-bold text-xs uppercase mt-1 block tracking-wider">{new Date(selectedRideForStats.startTime).toLocaleString('nl-NL')}</span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8">
                                <TinyCard title="Tijd" value={formatDuration(selectedRideForStats.durationSec)} unit="" theme={theme} />
                                <TinyCard title="Afstand" value={convertDist(selectedRideForStats.distance).toFixed(1)} unit={distUnit} theme={theme} />
                                <TinyCard title="Gem Snelheid" value={convertDist(selectedRideForStats.avgSpeed).toFixed(1)} unit={speedUnit} theme={theme} />
                                <TinyCard title="Top Snelheid" value={convertDist(selectedRideForStats.maxSpeed).toFixed(1)} unit={speedUnit} theme={theme} />
                                <TinyCard title="Gem HR" value={selectedRideForStats.avgHr.toString()} unit="bpm" theme={theme} />
                            </div>
                        </div>
                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 text-center">ROUTE OVERZICHT</h3>
                        <MapPreview coords={selectedRideForStats.coords} theme={theme} height={280} />
                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 mt-12 text-center">PRESTATIE DATA</h3>
                        <div className="space-y-6 mb-16">
                            <RideGraph data={selectedRideForStats.samples} valueKey="speed" label="SNELHEID" color="#3b82f6" theme={theme} unitSystem={unitSystem} />
                            <RideGraph data={selectedRideForStats.samples} valueKey="hr" label="HARTSLAG" color="#ef4444" theme={theme} unitSystem={unitSystem} />
                            <RideGraph data={selectedRideForStats.samples} valueKey="watt" label="WATTAGE" color="#f59e0b" theme={theme} unitSystem={unitSystem} />
                            <RideGraph data={selectedRideForStats.samples} valueKey="cad" label="CADANS" color="#10b981" theme={theme} unitSystem={unitSystem} />
                        </div>
                        <button onClick={() => setScreen("rides")} className="w-full p-5 bg-blue-600 text-white font-black rounded-[1.5rem] mb-12 shadow-xl shadow-blue-500/20 uppercase tracking-widest">TERUG NAAR OVERZICHT</button>
                    </div>
                )}

                {screen === "rides" && (
                    <div className="p-6">
                        <h2 className="text-2xl font-black mb-8 tracking-tighter" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>ALLE RITTEN</h2>
                        {rides.length === 0 ? (
                            <div className="text-center p-20 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] italic text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-gray-800">Geen historie gevonden.</div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {rides.map(r => (
                                    <div key={r.id} className="p-6 rounded-3xl border border-transparent shadow-sm hover:border-blue-500/50 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-4" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }} onClick={() => navigate("stats", r.id)}>
                                        <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-2xl">🚴</div>
                                        <div className="flex-1"><h3 className="text-lg font-black" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>{r.title}</h3><div className="text-xs font-bold text-gray-400 uppercase">{convertDist(r.distance).toFixed(1)} {distUnit.toUpperCase()} • {formatDuration(r.durationSec)}</div></div>
                                        <div className="text-right"><div className="text-sm font-black text-blue-500">{convertDist(r.avgSpeed).toFixed(0)}</div><div className="text-[9px] font-black text-gray-400 uppercase">{speedUnit.toUpperCase()}</div></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {screen === "achievements" && (
                    <div className="p-6 pb-20">
                        <h2 className="text-2xl font-black mb-8 tracking-tighter uppercase" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>TROFEEËNKAST 🏆</h2>
                        <div className="space-y-8 mb-12">
                            {[
                                { title: "TOTALE AFSTAND", val: convertDist(ach.distanceKm || 0).toFixed(0), unit: distUnit.toUpperCase(), levels: ACH_LEVELS_DISTANCE, current: convertDist(ach.distanceKm || 0), type: 'distance' },
                                { title: "TOP SNELHEID", val: convertDist(ach.maxSpeed || 0).toFixed(0), unit: speedUnit.toUpperCase(), levels: ACH_LEVELS_SPEED, current: convertDist(ach.maxSpeed || 0), type: 'speed' },
                                { title: "MAX VERMOGEN", val: (ach.maxWatt || 0).toFixed(0), unit: "WATT", levels: ACH_LEVELS_WATT, current: (ach.maxWatt || 0), type: 'watt' },
                                { title: "LANGSTE RIT", val: (ach.longestRideMin || 0).toFixed(0), unit: "MIN", levels: ACH_LEVELS_DURATION, current: (ach.longestRideMin || 0), type: 'duration' }
                            ].map((achItem) => {
                                const p = getProgress(achItem.current, achItem.levels);
                                const isClaimed = ach.claimed?.[achItem.type as keyof typeof ach.claimed]?.includes(p.levelIndex);
                                return (
                                    <div key={achItem.title} className="p-8 rounded-[2rem] shadow-xl border-l-8 transition-colors" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT, borderLeftColor: p.lvl.color }}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{achItem.title}</h4>
                                                <div className="text-5xl font-black mt-2" style={{ color: p.lvl.color }}>{achItem.val} <span className="text-xl opacity-50">{achItem.unit}</span></div>
                                                <span className="text-xs font-bold text-gray-400 mt-2 block uppercase tracking-tighter">LEVEL: {p.lvl.name}</span>
                                            </div>
                                            <div className="w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-5xl shadow-inner bg-black/5 dark:bg-white/5">{p.lvl.emoji}</div>
                                        </div>
                                        <div className="mt-8">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-2">
                                                <span>VOORTGANG</span>
                                                <span style={{ color: p.lvl.color }}>{achItem.current.toFixed(0)} / {p.next.min === Infinity ? "MAX" : p.next.min} {achItem.unit}</span>
                                            </div>
                                            <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden p-[2px]">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${p.pct}%`, backgroundColor: p.lvl.color }}></div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleClaimAchievement(achItem.type, p.levelIndex)}
                                            disabled={isClaimed}
                                            className={`w-full mt-8 p-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 ${isClaimed ? 'bg-gray-400/20 text-gray-400 cursor-default' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:bg-blue-500'}`}
                                        >
                                            {isClaimed ? 'GECLAIMD ✓' : `CLAIM ${p.lvl.name} 🏆`}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* --- Stats Summary Menu --- */}
                        <div className="mt-16">
                            <h2 className="text-xl font-black mb-6 tracking-tighter uppercase text-center" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>ALL-TIME STATISTIEKEN 📈</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 rounded-3xl shadow-lg transition-colors" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Totaal Afstand</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-blue-600 italic">{convertDist(statsTotals.totalDist).toFixed(0)}</span>
                                        <span className="text-[10px] font-bold text-gray-500">{distUnit.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="p-6 rounded-3xl shadow-lg transition-colors" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Totaal Tijd</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-blue-600 italic">{Math.floor(statsTotals.totalTimeSec / 3600)}h</span>
                                        <span className="text-2xl font-black text-blue-600 italic ml-1">{Math.floor((statsTotals.totalTimeSec % 3600) / 60)}m</span>
                                    </div>
                                </div>
                                <div className="p-6 rounded-3xl shadow-lg transition-colors" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Recordsnelheid</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-blue-600 italic">{convertDist(statsTotals.maxSpeed).toFixed(1)}</span>
                                        <span className="text-[10px] font-bold text-gray-500">{speedUnit.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="p-6 rounded-3xl shadow-lg transition-colors" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Max Vermogen</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-blue-600 italic">{statsTotals.maxWatt.toFixed(0)}</span>
                                        <span className="text-[10px] font-bold text-gray-500">WATT</span>
                                    </div>
                                </div>
                                <div className="col-span-2 p-6 rounded-3xl shadow-lg transition-colors flex justify-between items-center" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Totaal Aantal Ritten</span>
                                    <span className="text-2xl font-black text-blue-600 italic">{statsTotals.totalRides}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {screen === "friends" && (
                    <div className="p-6">
                        <h2 className="text-xl font-black mb-6 uppercase tracking-widest" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>Leaderboard</h2>
                        <div className="rounded-[2rem] overflow-hidden shadow-xl mb-12 transition-colors" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                            {[...FRIENDS_DATA_FULL].sort((a,b) => b.totalDistance - a.totalDistance).map((f, i) => (
                                <div key={f.name} className="flex flex-col p-5 border-b dark:border-gray-800 last:border-0 hover:bg-black/5 transition-all">
                                    <div className="flex items-center gap-5">
                                        <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${i === 0 ? 'bg-yellow-400 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-orange-400 text-black' : 'text-blue-500'}`}>{i + 1}</span>
                                        <div className="flex-1"><div className="font-black text-lg tracking-tight" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>{f.name}</div><div className="text-[10px] font-bold text-gray-400 uppercase">{f.lastRide.date} ACTIEF</div></div>
                                        <div className="text-2xl font-black text-blue-600 italic tracking-tighter">{convertDist(f.totalDistance).toFixed(0)}<span className="text-xs ml-1 opacity-50">{distUnit}</span></div>
                                    </div>
                                    {f.lastRide.notes && (
                                        <div className="mt-4 p-4 rounded-xl bg-black/5 dark:bg-white/5 border-l-4 border-blue-500/30">
                                            <p className="text-xs font-medium italic opacity-80" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>"{f.lastRide.notes}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {screen === "programs" && (
                    <div className="p-6 space-y-8">
                        <h2 className="text-2xl font-black mb-4 tracking-tighter uppercase" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>BESCHIKBARE PROGRAMMA'S</h2>
                        {TRAINING_PROGRAMS.map(p => (
                            <div key={p.id} className={`p-10 rounded-[2.5rem] shadow-xl border-t-8 transition-all ${activeProgramId === p.id ? 'border-green-500 scale-[1.02]' : 'border-blue-600 opacity-80'}`} style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                                <div className="flex flex-wrap gap-3 mb-4">
                                    <span className="px-4 py-1.5 bg-blue-600/10 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-widest border border-blue-600/20">{p.focus}</span>
                                    <span className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.duration}</span>
                                    {activeProgramId === p.id && <span className="px-4 py-1.5 bg-green-500/10 rounded-full text-[10px] font-black text-green-500 uppercase tracking-widest border border-green-500/20 animate-pulse">ACTIEF</span>}
                                </div>
                                <h3 className="text-3xl font-black text-blue-600 italic tracking-tighter uppercase leading-none mb-6">{p.name}</h3>
                                <div className="space-y-4">
                                    {p.details.map((d, i) => (
                                        <div key={i} className="flex gap-4 items-start text-sm font-bold text-gray-500 dark:text-gray-400">
                                            <div className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 shrink-0"></div>
                                            <span>{d}</span>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setActiveProgramId(p.id)}
                                    className={`w-full mt-10 p-5 font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest ${activeProgramId === p.id ? 'bg-green-500 text-white cursor-default' : 'bg-blue-600 text-white shadow-blue-500/20'}`}
                                >
                                    {activeProgramId === p.id ? 'HUIDIG PROGRAMMA ✅' : 'START PROGRAMMA 🚀'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {screen === "goals" && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black tracking-tighter uppercase" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>ACTIEVE DOELSTELLINGEN</h2>
                            <button onClick={() => setIsGoalModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-black text-xs rounded-xl uppercase tracking-widest shadow-lg shadow-blue-500/20">+ DOEL</button>
                        </div>
                        {goals.length === 0 ? (
                            <div className="text-center p-20 text-gray-400 font-bold italic bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                                Geen actieve doelen.<br/>Zet de lat hoger!
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {goals.map(g => (
                                    <div key={g.id} className={`p-8 rounded-[2rem] border-l-8 shadow-xl transition-all ${g.completed ? 'border-green-500' : 'border-blue-600'}`} style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-black text-[10px] text-gray-400 uppercase tracking-widest">{g.type === 'distance' ? 'AFSTAND DOEL' : 'SNELHEID DOEL'}</span>
                                            {g.targetDate && <span className="text-[9px] font-bold text-gray-500 uppercase">Deadline: {new Date(g.targetDate).toLocaleDateString()}</span>}
                                        </div>
                                        <div className="text-5xl font-black text-blue-600 my-2 italic tracking-tighter">{g.value} <span className="text-xl opacity-50 uppercase">{g.unit}</span></div>
                                        <div className="mt-6">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400 mb-2">
                                                <span>VOORTGANG</span>
                                                <span>{Math.round((g.progress/g.value)*100)}%</span>
                                            </div>
                                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden p-[3px]">
                                                <div className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.6)] ${g.completed ? 'bg-green-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, (g.progress/g.value)*100)}%` }}></div>
                                            </div>
                                        </div>
                                        {g.completed && <div className="mt-4 text-center font-black text-green-500 text-xs uppercase tracking-widest">DOEL BEHAALD! 🎉</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setIsGoalModalOpen(true)} className="w-full p-6 bg-blue-600/10 text-blue-500 border-2 border-dashed border-blue-600/30 font-black rounded-[1.5rem] mt-8 active:scale-95 transition-transform uppercase tracking-widest">
                            + NIEUW DOEL STELLEN
                        </button>
                    </div>
                )}

                {screen === "settings" && (
                    <div className="p-6 pb-20">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Interface & Eenheden</h3>
                        <div className="p-6 rounded-[2rem] mb-6 shadow-lg transition-colors space-y-6" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="font-black text-lg tracking-tighter" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>DONKERE MODUS</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Beter voor de ogen</span>
                                </div>
                                <div className={`w-16 h-9 rounded-full p-1 cursor-pointer transition-all duration-300 ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`} onClick={toggleTheme}>
                                    <div className={`w-7 h-7 rounded-full bg-white shadow-md transition-all duration-300 transform ${isDark ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="font-black text-lg tracking-tighter" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>EENHEDEN</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Wissel tussen KM en MI</span>
                                </div>
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                    <button onClick={() => setUnitSystem("metric")} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${unitSystem === 'metric' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}>KM</button>
                                    <button onClick={() => setUnitSystem("imperial")} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${unitSystem === 'imperial' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}>MI</button>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2 mt-8">Sensoren (Simulatie)</h3>
                        <div className="p-6 rounded-[2rem] mb-10 shadow-lg transition-colors space-y-4" style={{ backgroundColor: isDark ? CARD_DARK : CARD_LIGHT }}>
                            {[
                                { id: 'hr', label: 'Hartslagmeter', icon: '❤️' },
                                { id: 'cadence', label: 'Cadansmeter', icon: '🔄' },
                                { id: 'watt', label: 'Wattagemeter', icon: '⚡' }
                            ].map(sensor => (
                                <div key={sensor.id} className="flex justify-between items-center p-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{sensor.icon}</span>
                                        <span className="font-bold text-sm" style={{ color: isDark ? TEXT_DARK : TEXT_LIGHT }}>{sensor.label}</span>
                                    </div>
                                    <button 
                                        onClick={() => setActiveSensors(prev => ({ ...prev, [sensor.id]: !prev[sensor.id as keyof SensorsState] }))}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSensors[sensor.id as keyof SensorsState] ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}
                                    >
                                        {activeSensors[sensor.id as keyof SensorsState] ? 'Gekoppeld' : 'Koppel'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">Privacy & Data</h3>
                        <div className="p-10 rounded-[2.5rem] bg-red-500/5 dark:bg-red-500/10 border-2 border-dashed border-red-500/20 text-center mb-16">
                            <p className="text-xs font-bold text-red-500/80 mb-6 px-10">Zodra je de data wist, is er geen weg meer terug.</p>
                            <button onClick={wipeData} className="w-full p-6 bg-red-600 text-white font-black rounded-3xl shadow-xl shadow-red-500/30 active:scale-95 transition-transform uppercase tracking-widest">VERWIJDER ACCOUNT DATA</button>
                        </div>

                        <div className="text-center space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CycleVision v2.1.0</p>
                            <p className="text-xs font-bold text-blue-600/60 italic">Gebouwd door Niek Amsing en Hidde Kruims</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Overlays */}
            {isSaveModalVisible && <SaveRideModal isDark={isDark} onSave={confirmSave} onCancel={cancelRecording} />}
            {isGoalModalOpen && <CreateGoalModal isDark={isDark} onSave={handleCreateGoal} onCancel={() => setIsGoalModalOpen(false)} unitSystem={unitSystem} />}

            {/* Side Menu Overlay */}
            <div className={`fixed inset-0 z-[70] flex transition-opacity duration-300 ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}></div>
                <div className={`relative w-[85%] max-w-sm h-full shadow-2xl p-8 transition-transform duration-500 flex flex-col ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`} 
                     style={{ 
                         backgroundColor: isDark ? "#0a1229" : "#fff",
                         paddingTop: 'env(safe-area-inset-top)',
                         paddingBottom: 'env(safe-area-inset-bottom)'
                     }}>
                    <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-4xl text-gray-400 font-light z-10">&times;</button>
                    
                    <div className="mb-10 flex flex-col items-center text-center">
                        <div className="mb-4">
                            <CycleVisionLogo size={120} theme={theme} showText={true} />
                        </div>
                        <div className="mt-4 space-y-1">
                            <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Ride smarter. Ride safer.</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">By Niek Amsing & Hidde Kruims</p>
                            <div className="h-[2px] w-12 bg-blue-600 mx-auto rounded-full opacity-30 mt-2"></div>
                        </div>
                    </div>

                    <nav className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-2">
                        {[ 
                            { key: "home", label: "🏠 Dashboard" }, 
                            { key: "record", label: "🚴‍♂️ Start Rit" }, 
                            { key: "stats", label: "📊 Analyse" }, 
                            { key: "rides", label: "📋 Overzicht" }, 
                            { key: "achievements", label: "🏆 Trofeeën" },
                            { key: "friends", label: "🤝 Vrienden" },
                            { key: "goals", label: "🎯 Doelen" },
                            { key: "programs", label: "📚 Training" },
                            { key: "settings", label: "⚙️ Instellingen" } 
                        ].map(item => (
                            <button key={item.key} onClick={() => { if (item.key === "record") prepareRecording(); else navigate(item.key as ScreenName); }} className={`text-left p-4 rounded-2xl font-black transition-all transform active:scale-95 ${screen === item.key ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>{item.label}</button>
                        ))}
                    </nav>

                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-40 text-center">Cyclist Vision Tech © 2025</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
