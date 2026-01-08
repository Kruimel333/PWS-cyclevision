
export function clamp(v: number, a: number, b: number): number {
    return Math.max(a, Math.min(b, v));
}

export function formatDuration(seconds: number): string {
    const totalSeconds = Math.max(0, seconds);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function generateSampleData(current: number, minDelta: number, maxDelta: number, minVal: number, maxVal: number): number {
    const delta = Math.random() * (maxDelta - minDelta) + minDelta;
    const sign = Math.random() < 0.5 ? 1 : -1;
    let newValue = current + sign * delta;
    return Math.round(clamp(newValue, minVal, maxVal) * 10) / 10;
}
